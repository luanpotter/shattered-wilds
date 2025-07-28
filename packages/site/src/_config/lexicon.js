import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseLexicon = () => {
	const lexiconDir = path.join(__dirname, '../../../../docs/lexicon');
	if (!fs.existsSync(lexiconDir)) {
		throw new Error(`Lexicon directory not found: ${lexiconDir}`);
	}

	function getAllMarkdownFiles(dir, basePath = '') {
		const files = [];
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Recursively scan subdirectories
				const subFiles = getAllMarkdownFiles(fullPath, path.join(basePath, item));
				files.push(...subFiles);
			} else if (item.endsWith('.md')) {
				// Create slug from relative path to lexicon root
				const relativePath = path.relative(lexiconDir, fullPath).replace(/\.md$/, '');

				const bits = relativePath.split('/').slice(-2);
				const [category, slug] = bits.length === 1 ? [undefined, ...bits] : bits;
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

				files.push({
					filePath: fullPath,
					slug: slug,
					title: title,
					basePath: basePath,
					content: markdownContent,
					metadata: parseFrontMatter(frontMatter),
					category,
				});
			}
		}

		return files;
	}

	const markdownFiles = getAllMarkdownFiles(lexiconDir);

	// Group items by category for category pages
	const categoryGroups = {};
	markdownFiles.forEach(file => {
		if (file.category) {
			if (!categoryGroups[file.category]) {
				categoryGroups[file.category] = [];
			}
			categoryGroups[file.category].push(file);
		}
	});

	// Build a lookup for slug to url
	const slugToUrl = {};
	markdownFiles.forEach(file => {
		slugToUrl[file.slug] = `/wiki/${file.slug}/`;
	});

	return markdownFiles.map(file => {
		let categoryItems = null;
		if (categoryGroups[file.title]) {
			categoryItems = categoryGroups[file.title]
				.filter(item => item.slug !== file.slug)
				.map(item => ({
					...item,
					url: slugToUrl[item.slug],
				}));
		}
		return {
			// wiki parameters
			slug: file.slug,
			title: file.title,
			url: `/wiki/${file.slug}/`,

			// data
			content: file.content,
			metadata: file.metadata,
			category: file.category,
			categoryItems: categoryItems,
		};
	});
};
