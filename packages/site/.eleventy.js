import { HtmlBasePlugin } from '@11ty/eleventy';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItWiki from 'markdown-it-wikilinks';
import yaml from 'js-yaml';
import eleventyGoogleFonts from 'eleventy-google-fonts';
import { actions } from './src/_config/data/actions.js';
import { stats } from './src/_config/data/stats.js';
import { derivedStats } from './src/_config/data/derived_stats.js';
import { resources } from './src/_config/data/resources.js';
import { feats } from './src/_config/data/feats.js';
import { equipment } from './src/_config/data/equipment.js';
import { classes } from './src/_config/data/classes.js';
import { traits } from './src/_config/data/traits.js';
import { parseLexicon } from './src/_config/lexicon.js';
import { TextProcessor } from './src/_config/TextProcessor.js';
import { covers } from './src/_config/data/covers.js';
import { predefinedArcaneSpells } from './src/_config/data/arcane.js';
import { schools } from './src/_config/data/schools.js';
import { conditions } from './src/_config/data/conditions.js';
import { consequences } from './src/_config/data/consequence.js';
import { upbringings } from './src/_config/data/upbringings.js';

export default function (eleventyConfig) {
	// NOTE: kept to allow for a different prefix in the future
	const pathPrefix = process.env.ENV === 'production' ? '' : '';

	// Add global data for lexicon files
	const lexiconFiles = parseLexicon();

	eleventyConfig.setDataDeepMerge(true);
	eleventyConfig.addPlugin(HtmlBasePlugin, { baseHref: pathPrefix });
	eleventyConfig.addPlugin(eleventyGoogleFonts);

	eleventyConfig.addGlobalData('lexiconFiles', lexiconFiles);
	eleventyConfig.addGlobalData('actions', actions);
	eleventyConfig.addGlobalData('stats', stats);
	eleventyConfig.addGlobalData('derivedStats', derivedStats);
	eleventyConfig.addGlobalData('resources', resources);
	eleventyConfig.addGlobalData('feats', feats);
	eleventyConfig.addGlobalData('equipment', equipment);
	eleventyConfig.addGlobalData('classes', classes);
	eleventyConfig.addGlobalData('traits', traits);
	eleventyConfig.addGlobalData('covers', covers);
	eleventyConfig.addGlobalData('predefinedArcaneSpells', predefinedArcaneSpells);
	eleventyConfig.addGlobalData('schools', schools);
	eleventyConfig.addGlobalData('conditions', conditions);
	eleventyConfig.addGlobalData('consequences', consequences);
	eleventyConfig.addGlobalData('upbringings', upbringings);

	const wikiPages = [
		...lexiconFiles,
		...actions,
		...stats,
		...derivedStats,
		...resources,
		...feats,
		...equipment,
		...classes,
		...traits,
		...covers,
		...predefinedArcaneSpells,
		...schools,
		...conditions,
		...consequences,
		...upbringings,
	]
		.filter(e => e.slug)
		.sort((a, b) => {
			if (!a.title) {
				console.error(`No title for ${a.slug}`);
			}
			return a.title.localeCompare(b.title);
		});

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
