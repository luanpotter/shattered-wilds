import { execSync } from 'child_process';
import { mkdirSync, rmSync, cpSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const systemOut = join(dist, 'system');

function safeMkdir(path: string) {
	if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function main() {
	// Prepare dist folders
	rmSync(systemOut, { recursive: true, force: true });
	safeMkdir(systemOut);

	// Copy manifest
	cpSync(join(root, 'system.json'), join(systemOut, 'system.json'));
	// Copy template.json if present
	try {
		cpSync(join(root, 'template.json'), join(systemOut, 'template.json'));
	} catch {
		/* optional */
	}

	// Copy compiled JS (rename index.js -> system.js). Our entry is src/index.ts
	const compiledIndex = join(dist, 'index.js');
	const compiledMap = join(dist, 'index.js.map');
	cpSync(compiledIndex, join(systemOut, 'system.js'));
	if (existsSync(compiledMap)) cpSync(compiledMap, join(systemOut, 'system.js.map'));

	// Copy templates
	safeMkdir(join(systemOut, 'templates'));
	cpSync(join(root, 'templates'), join(systemOut, 'templates'), { recursive: true });

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

	// Zip package
	try {
		const zipPath = join(dist, 'shattered-wilds.zip');
		execSync(`cd "${systemOut}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
	} catch (err) {
		console.warn('zip command not available; produced unzipped system directory instead.');
		void err;
	}
}

main();


