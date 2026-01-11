import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { GENERATED_LEXICON } from '@shattered-wilds/d12';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseLexicon = () => {
	const lexiconDir = path.join(__dirname, '../../../../docs/lexicon');
	if (!fs.existsSync(lexiconDir)) {
		console.warn(`Lexicon directory not found: ${lexiconDir}, using only generated lexicon`);
		return getGeneratedLexiconEntries();
	}

	function getAllMarkdownFiles(dir, basePath = '') {
		const items = fs.readdirSync(dir);

		const results = [];
		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Recursively scan subdirectories
				const subFiles = getAllMarkdownFiles(fullPath, path.join(basePath, item));
				results.push(...subFiles);
			} else if (item.endsWith('.md')) {
				// Create slug from relative path to lexicon root
				const relativePath = path.relative(lexiconDir, fullPath).replace(/\.md$/, '');

				const bits = relativePath.split('/').slice(-2);
				const [group, slug] = bits.length === 1 ? [undefined, ...bits] : bits;
				const title = slug.replace(/_/g, ' ');

				// Parse frontmatter if present
				const content = fs.readFileSync(fullPath, 'utf8');
				let frontMatter = {};
				let markdownContent = content;

				// Use regex to extract YAML frontmatter
				const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
				if (fmMatch) {
					try {
						frontMatter = yaml.load(fmMatch[1]);
						markdownContent = content.slice(fmMatch[0].length).trim();
					} catch (e) {
						console.warn(`Failed to parse frontmatter for ${fullPath}:`, e.message);
					}
				}

				const parseFrontMatter = frontMatter => {
					if (!frontMatter || typeof frontMatter !== 'object') {
						return [];
					}
					const specialTitles = {
						ap: 'AP',
					};
					return Object.entries(frontMatter).map(([key, value]) => {
						return {
							key: key,
							title: (specialTitles[key] || key).replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
							value: value === true ? undefined : value,
							cssClass: value === true ? `metadata-trait` : `metadata-${key.replace(/_/g, '-')}`,
						};
					});
				};

				results.push({
					group,
					slug,
					title: title,
					url: `/wiki/${slug}/`,
					content: markdownContent,
					metadata: parseFrontMatter(frontMatter),
				});
			}
		}

		return results;
	}

	const docsLexicon = getAllMarkdownFiles(lexiconDir);
	const generatedLexicon = getGeneratedLexiconEntries();

	// Merge: docs/lexicon files take precedence over generated ones
	const docsSlugSet = new Set(docsLexicon.map(e => e.slug));
	const mergedLexicon = [...docsLexicon, ...generatedLexicon.filter(e => !docsSlugSet.has(e.slug))];

	return mergedLexicon;
};

/**
 * Convert GENERATED_LEXICON from d12 into the same format as docs/lexicon entries
 */
function getGeneratedLexiconEntries() {
	return Object.entries(GENERATED_LEXICON).map(([slug, content]) => ({
		group: undefined,
		slug,
		title: slug.replace(/_/g, ' '),
		url: `/wiki/${slug}/`,
		content,
		metadata: [],
	}));
}
