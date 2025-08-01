import { map, asc } from 'type-comparator';

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
				const filterPairs = filters.reduce(
					(result, _, index, array) => {
						if (index % 2 === 0) {
							result.push(array.slice(index, index + 2));
						}
						return result;
					},
					[['group', group]],
				);
				return this.renderList(group, sortKey, filterPairs);
			},
			TODO: value => {
				const addMark = value => `<mark class="todo">${value}</mark>`;
				return addMark(value ? `TODO: ${value}` : 'TODO');
			},
		};
	}

	renderList = (group, sortKey, filterPairs) => {
		const excludedTags = filterPairs.map(([key]) => key);
		const items = Object.values(this.wiki)
			.filter(e => filterPairs.every(([key, value]) => e[key] === value))
			.sort(map(e => e[sortKey], asc))
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
			const descFirstParagraph = entry.content.split(/\n\n/)[0].trim();
			const markdown = this.processMarkdown(descFirstParagraph, { inline: true });
			return `<strong><a href="${entry.url}">${entry.title}</a></strong>: ${metaHtml}${markdown}`;
		} else {
			return `<span style='color:red'>[Unknown type: ${type}]</span>`;
		}
	};

	renderMetadata = (entry, excludeTagsArray) => {
		const metadata = Object.values(entry.metadata ?? []).filter(tag => !excludeTagsArray.includes(tag.key));
		if (metadata.length > 0) {
			return (
				'<span class="item-metadata">' +
				metadata
					.map(tag => {
						const isKeyword = tag.value === undefined;
						const title = isKeyword ? `<a href="/wiki/${tag.key}/">${tag.title}</a>` : tag.title;
						const value = isKeyword ? '' : `: ${tag.value}`;
						return `<span class="${tag.cssClass}">${title}${value}</span>`;
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

	wikiLinks = value => {
		return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
			var link, text;
			if (r.includes(' | ')) {
				[link, text] = r.split(' | ');
			} else {
				link = text = r;
			}
			return `<a href="/wiki/${link.replace(' ', '_')}">${text}</a>`;
		});
	};

	processShortcodes = value => {
		return value.replace(/\{%\s*(\w+)\s+([^%]+)\s*%\}/g, (match, tagName, args) => {
			const shortcodeFn = this.shortcodes[tagName];
			if (shortcodeFn) {
				const parsedArgs = parseLiquidArgs(args);
				return shortcodeFn(...parsedArgs);
			}
			return match;
		});
	};

	preProcessMarkdown = value => {
		return this.wikiLinks(this.processShortcodes(value));
	};

	processMarkdown = (value, { inline } = { inline: true }) => {
		if (value === undefined) {
			return undefined;
		}
		const render = inline ? 'renderInline' : 'render';
		return this.md[render](this.preProcessMarkdown(value));
	};
}

const parseLiquidArgs = args => {
	const result = [];
	let current = '';
	let inQuotes = false;
	let escapeNext = false;

	const maybeAdd = () => {
		const value = current.trim().replace(/,$/g, '');
		if (value) {
			result.push(value);
		}
	};

	for (let i = 0; i < args.length; i++) {
		const char = args[i];

		if (escapeNext) {
			current += char;
			escapeNext = false;
			continue;
		}

		if (char === '\\') {
			escapeNext = true;
			continue;
		}

		if (char === '"') {
			inQuotes = !inQuotes;
			continue;
		}

		if (char === ' ' && !inQuotes) {
			maybeAdd();
			current = '';
			continue;
		}

		current += char;
	}
	maybeAdd();

	return result;
};
