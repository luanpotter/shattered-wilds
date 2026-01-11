import { queue, map, asc } from 'type-comparator';
import { MarkdownPreProcessor } from '@shattered-wilds/d12';

export class TextProcessor {
	constructor(wiki) {
		this.wiki = Object.fromEntries(wiki.map(e => [e.slug, e]));

		this.shortcodes = {
			item: (path, excludeTags = []) => {
				return this.renderPath('item', path, excludeTags);
			},
			text: path => {
				return this.renderPath('text', path);
			},
			list: (group, sortKey, ...filters) => {
				const filterPairs = this.parseFilterPairs(group, filters);
				return this.renderList(group, sortKey, filterPairs);
			},
			list_feats_for_class: classSlug => {
				const classEntry = this.wiki[classSlug];
				if (!classEntry) {
					throw new Error(`Missing class entry: ${classSlug}`);
				}
				const filterSource = source =>
					source === classEntry.role || source === classEntry.flavor || source === classEntry.realm;
				const filterFeat = feat => feat.sources.some(filterSource);
				const order = ['level', 'isMinor'];
				return this.renderListWithSortAndFilter('Feat', order, filterFeat, []);
			},
			list_feats_for_source: (source, ...filters) => {
				const filterPairs = this.parseFilterPairs('Feat', filters);
				const filterFeat = feat =>
					feat.sources.includes(source) && filterPairs.every(([key, value]) => feat[key] === value);
				const order = ['level', 'isNotCore'];
				return this.renderListWithSortAndFilter('Feat', order, filterFeat, ['Source']);
			},
		};

		this.mdPreProcessor = new MarkdownPreProcessor({
			renderer: (tagName, ...args) => {
				if (this.shortcodes[tagName]) {
					return this.shortcodes[tagName](...args);
				}
				return null;
			},
		});
	}

	parseFilterPairs = (group, filters) =>
		filters.reduce(
			(result, _, index, array) => {
				if (index % 2 === 0) {
					result.push(array.slice(index, index + 2));
				}
				return result;
			},
			[['group', group]],
		);

	renderList = (group, sortKey, filterPairs) => {
		const excludedTags = filterPairs.map(([key]) => key);
		const filter = e => filterPairs.every(([key, value]) => e[key] === value);
		return this.renderListWithSortAndFilter(group, [sortKey], filter, excludedTags);
	};

	renderListWithSortAndFilter = (group, sortKeys, filter, excludedTags) => {
		const items = Object.values(this.wiki)
			.filter(e => e.group === group)
			.filter(filter)
			.sort(queue(sortKeys.map(sortKey => map(e => e[sortKey], asc))))
			.map(e => this.renderEntry('item', e, excludedTags));
		return `<ul>${items.map(e => `<li>${e}</li>`).join('')}</ul>`;
	};

	renderPath = (type, slug, excludeTags = []) => {
		const entry = this.wiki[slug];
		if (!entry) {
			return `<span style='color:red'>[Missing lexicon entry: ${slug}]</span>`;
		}
		return this.renderEntry(type, entry, excludeTags);
	};

	renderEntry = (type, entry, excludeTags = []) => {
		const excludeTagsArray = Array.isArray(excludeTags) ? excludeTags : excludeTags.split(',').map(tag => tag.trim());
		if (type === 'text') {
			const desc = entry.content;
			return this.processMarkdown(desc, { inline: false });
		} else if (type === 'item') {
			const metaHtml = this.renderMetadata(entry, excludeTagsArray);
			if (!entry.content) {
				console.error(`Missing content for entry: ${entry.title}`, entry);
			}
			const descFirstParagraph = entry.content.split(/\n\n/)[0].trim();
			const markdown = this.processMarkdown(descFirstParagraph, { inline: true });
			return `<strong><a href="${entry.url}">${entry.title}</a></strong>: ${metaHtml}${markdown}`;
		} else {
			return `<span style='color:red'>[Unknown type: ${type}]</span>`;
		}
	};

	renderMetadata = (entry, excludeTagsArray) => {
		const metadata = Object.values(entry.metadata ?? []).filter(tag => !excludeTagsArray.includes(tag.key.text));
		if (metadata.length > 0) {
			return (
				'<span class="item-metadata">' +
				metadata
					.map(tag => {
						const renderComponent = c => (c.slug ? `<a href="/wiki/${c.slug}/">${c.text}</a>` : c.text);
						const key = renderComponent(tag.key);
						const value = tag.value ? `: ${renderComponent(tag.value)}` : '';
						return `<span class="${tag.metadataClass}">${key}${value}</span>`;
					})
					.join(' ') +
				'</span> '
			);
		}
		return '';
	};

	newLineToBR = value => {
		return value.replace(/\n/g, '<br>\n');
	};

	processMarkdown = (value, { inline } = { inline: true }) => {
		if (value === undefined) {
			return undefined;
		}
		const render = inline ? 'renderInline' : 'render';
		return this.md[render](this.mdPreProcessor.process(value));
	};
}
