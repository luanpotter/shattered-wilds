import { execSync } from 'child_process';
import { mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const buildDir = join(root, 'build');
const outDir = join(root, 'dist');
const moduleOut = join(outDir, 'module');

function safeMkdir(path: string) {
	if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function main() {
	process.chdir(root);

	rmSync(outDir, { recursive: true, force: true });
	safeMkdir(outDir);
	safeMkdir(moduleOut);

	cpSync(join(root, 'module.json'), join(moduleOut, 'module.json'));

	const entry = join(buildDir, 'index.js');
	execSync(
		`bun build "${entry}" --outfile="${join(buildDir, 'module.js')}" --format=esm --target=browser --minify --sourcemap`,
		{ stdio: 'inherit' },
	);

	cpSync(join(buildDir, 'module.js'), join(moduleOut, 'module.js'));
	if (existsSync(join(buildDir, 'module.js.map'))) {
		cpSync(join(buildDir, 'module.js.map'), join(moduleOut, 'module.js.map'));
	}

	const releaseDir = join(outDir, 'hexagons');
	safeMkdir(releaseDir);
	cpSync(moduleOut, releaseDir, { recursive: true });

	console.log('✅ Hexagons build complete');
	console.log(`📦 Module bundle: ${moduleOut}`);
	console.log(`🚀 Release package: ${releaseDir}`);
}

main();
