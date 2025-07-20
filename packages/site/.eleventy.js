import { HtmlBasePlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItWiki from 'markdown-it-wikilinks';
import yaml from 'js-yaml';
import eleventyGoogleFonts from 'eleventy-google-fonts';
import { stats } from './src/_config/data/stats.js';
import { classes } from './src/_config/data/classes.js';
import { parseLexicon } from './src/_config/lexicon.js';
import { TextProcessor } from './src/_config/TextProcessor.js';

export default function (eleventyConfig) {
	// NOTE: kept to allow for a different prefix in the future
	const pathPrefix = process.env.ENV === 'production' ? '' : '';

	// Add global data for lexicon files
	const lexiconFiles = parseLexicon();

	const processor = new TextProcessor(lexiconFiles);

	eleventyConfig.setDataDeepMerge(true);
	eleventyConfig.addPlugin(HtmlBasePlugin, { baseHref: pathPrefix });
	eleventyConfig.addPlugin(eleventyGoogleFonts);

	eleventyConfig.addGlobalData('lexiconFiles', lexiconFiles);
	eleventyConfig.addGlobalData('stats', stats);
	eleventyConfig.addGlobalData('classes', classes);

	const wikiPages = [...lexiconFiles, ...stats, ...classes]
		.filter(e => e.slug)
		.sort((a, b) => {
			if (!a.title) {
				console.error(`No title for ${a.slug}`);
			}
			return a.title.localeCompare(b.title);
		});
	eleventyConfig.addGlobalData('wikiPages', wikiPages);

	// Set default layout for all pages
	eleventyConfig.addGlobalData('layout', 'main');

	eleventyConfig.addPassthroughCopy({
		'../../node_modules/simpledotcss/simple.min.css': 'simple.min.css',
	});
	eleventyConfig.addPassthroughCopy('src/bundle.css');
	eleventyConfig.addPassthroughCopy('assets', { expand: true });

	const wikiOptions = {
		baseURL: '/wiki/',
		makeAllLinksAbsolute: true,
		uriSuffix: '',
	};

	const md = markdownIt({ html: true })
		.use(markdownItAnchor)
		.use(markdownItAttrs)
		.use(markdownItWiki, wikiOptions)
		.use(md => {
			const refine = (tokens, idx) => {
				return processor.preProcessMarkdown(tokens[idx].content);
			};
			md.renderer.rules.text = refine;
			md.renderer.rules.html_inline = refine;
			md.renderer.rules.html_block = refine;
		});

	processor.md = md;

	eleventyConfig.setLibrary('md', md);
	eleventyConfig.addDataExtension('yaml', contents => yaml.load(contents));
	eleventyConfig.addLiquidFilter('mdb', text => processor.processMarkdown(text, { inline: false }));
	eleventyConfig.addLiquidFilter('mdi', text => processor.processMarkdown(text, { inline: true }));

	eleventyConfig.addShortcode('item', (path, excludeTags = []) => {
		return processor.renderLexiconEntry('item', path, excludeTags);
	});
	eleventyConfig.addShortcode('text', path => {
		return processor.renderLexiconEntry('text', path);
	});
	const addMark = value => `<mark class="todo">${value}</mark>`;
	eleventyConfig.addShortcode('TODO', value => addMark(value ? `TODO: ${value}` : 'TODO'));

	return {
		passthroughFileCopy: true,
		dir: {
			input: 'src',
			output: '_site',
			includes: '_includes',
			data: '_data',
		},
	};
}
