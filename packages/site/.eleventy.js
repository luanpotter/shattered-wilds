import { HtmlBasePlugin } from '@11ty/eleventy';
import eleventyGoogleFonts from 'eleventy-google-fonts';
import yaml from 'js-yaml';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItWiki from 'markdown-it-wikilinks';
import { parseLexicon } from './src/_config/lexicon.js';
import { TextProcessor } from './src/_config/TextProcessor.js';
import { WIKI } from '@shattered-wilds/d12';

export default function (eleventyConfig) {
	// NOTE: kept to allow for a different prefix in the future
	const pathPrefix = process.env.ENV === 'production' ? '' : '';

	// Add global data for lexicon files
	const lexiconFiles = parseLexicon();

	eleventyConfig.setDataDeepMerge(true);
	eleventyConfig.addPlugin(HtmlBasePlugin, { baseHref: pathPrefix });
	eleventyConfig.addPlugin(eleventyGoogleFonts);

	eleventyConfig.addGlobalData('lexiconFiles', lexiconFiles);

	const wikiPages = WIKI;

	const byGlobalKey = Object.groupBy(wikiPages, e => e.globalDataKey);
	for (const [key, entries] of Object.entries(byGlobalKey)) {
		eleventyConfig.addGlobalData(key, entries);
	}

	const wikiByGroup = wikiPages.reduce((acc, e) => {
		if (!e.group) {
			return acc;
		}
		if (!acc[e.group]) {
			acc[e.group] = [];
		}
		acc[e.group].push(e);
		return acc;
	}, {});

	const allTraits = wikiByGroup['Trait'].map(e => e.slug);
	const wikiByGroupByTrait = {};
	for (const [group, pages] of Object.entries(wikiByGroup)) {
		for (const trait of allTraits) {
			const traitKey = trait.replace('_', ' ');
			const filtered = pages.filter(e => (e.traits ?? []).includes(traitKey));
			if (filtered.length > 0) {
				(wikiByGroupByTrait[group] ??= {})[trait] = filtered;
			}
		}
	}

	const isValid = new Set(wikiPages.map(e => e.slug)).size === wikiPages.length;
	if (!isValid) {
		console.error(
			'Duplicate slugs in wikiPages: ',
			wikiPages.filter((e, i, a) => a.findIndex(t => t.slug === e.slug) !== i),
		);
	}
	const wiki = {
		pages: wikiPages,
		byGroup: wikiByGroup,
		byGroupByTrait: wikiByGroupByTrait,
	};
	eleventyConfig.addGlobalData('wiki', wiki);

	const processor = new TextProcessor(wikiPages);

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
	eleventyConfig.addLiquidFilter('per_page', function (arr, size) {
		if (!Array.isArray(arr) || !size || size < 1) return [];
		const result = [];
		for (let i = 0; i < arr.length; i += size) {
			result.push(arr.slice(i, i + size));
		}
		return result;
	});

	// Register shortcodes using the processor's shortcodes field
	eleventyConfig.addShortcode('item', processor.shortcodes.item);
	eleventyConfig.addShortcode('text', processor.shortcodes.text);
	eleventyConfig.addShortcode('list', processor.shortcodes.list);
	eleventyConfig.addShortcode('list_feats_for_class', processor.shortcodes.list_feats_for_class);
	eleventyConfig.addShortcode('list_feats_for_source', processor.shortcodes.list_feats_for_source);

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
