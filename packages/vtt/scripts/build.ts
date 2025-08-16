import { execSync } from 'child_process';
import { mkdirSync, rmSync, cpSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const buildDir = join(root, 'build');
const outDir = join(root, 'dist');
const systemOut = join(outDir, 'system');

function safeMkdir(path: string) {
	if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function main() {
	// Ensure working directory is the package root regardless of invocation origin
	process.chdir(root);

	// Prepare dist folders
	rmSync(outDir, { recursive: true, force: true });
	safeMkdir(outDir);
	safeMkdir(systemOut);

	// Copy manifest
	cpSync(join(root, 'system.json'), join(systemOut, 'system.json'));
	// Copy template.json if present
	try {
		cpSync(join(root, 'template.json'), join(systemOut, 'template.json'));
	} catch {
		/* optional */
	}

	// Bundle compiled JS into a single system.js that inlines workspace deps (e.g., @shattered-wilds/commons)
	const entry = join(buildDir, 'index.js');
	execSync(`bun build "${entry}" --outfile="${join(buildDir, 'system.js')}" --format=esm --target=browser --minify --sourcemap`, {
		stdio: 'inherit',
	});
	// Copy bundled output to dist/system
	cpSync(join(buildDir, 'system.js'), join(systemOut, 'system.js'));
	if (existsSync(join(buildDir, 'system.js.map'))) cpSync(join(buildDir, 'system.js.map'), join(systemOut, 'system.js.map'));

	// Copy templates
	safeMkdir(join(systemOut, 'templates'));
	cpSync(join(root, 'templates'), join(systemOut, 'templates'), { recursive: true });

	// Copy styles
	safeMkdir(join(systemOut, 'styles'));
	cpSync(join(root, 'styles'), join(systemOut, 'styles'), { recursive: true });

	// Copy basic assets (reuse root assets)
	safeMkdir(join(systemOut, 'assets'));
	const repoRoot = join(root, '..', '..', '..');
	try {
		cpSync(join(repoRoot, 'assets', 'd12.svg'), join(systemOut, 'assets', 'd12.svg'));
		cpSync(join(repoRoot, 'assets', 'crits.svg'), join(systemOut, 'assets', 'crits.svg'));
	} catch (err) {
		// assets are optional during CI
		void err;
	}

	// Create a minimal language file
	safeMkdir(join(systemOut, 'lang'));
	writeFileSync(join(systemOut, 'lang', 'en.json'), JSON.stringify({ SHATTERED_WILDS: 'Shattered Wilds' }, null, 2));
}

main();


