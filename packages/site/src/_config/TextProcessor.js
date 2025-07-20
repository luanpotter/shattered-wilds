export class TextProcessor {
	constructor(lexiconFiles) {
		this.lexiconFiles = lexiconFiles;
	}

	renderLexiconEntry = (type, path, excludeTags = []) => {
		const slug = path.replace(/[/\\]/g, '_');
		const entry = this.lexiconFiles.find(e => e.slug === slug);
		if (!entry) {
			return `<span style='color:red'>[Missing lexicon entry: ${slug}]</span>`;
		}
		// Build metadata HTML
		let metaHtml = '';
		if (entry.metadata && Object.keys(entry.metadata).length > 0) {
			const excludeTagsArray = Array.isArray(excludeTags) ? excludeTags : excludeTags.split(',').map(tag => tag.trim());
			metaHtml =
				'<span class="item-metadata">' +
				Object.values(entry.metadata)
					.map(tag => {
						if (excludeTagsArray.includes(tag.key)) {
							return '';
						}
						return `<span class="${tag.cssClass}">${tag.title}${tag.value ? `: ${tag.value}` : ''}</span>`;
					})
					.filter(html => html !== '')
					.join(' ') +
				'</span>';
		}
		if (type === 'text') {
			const desc = entry.content;
			return this.processMarkdown(desc, { inline: false });
		} else if (type === 'item') {
			const descFirstParagraph = entry.content.split(/\n\n/)[0].trim();
			const markdown = this.processMarkdown(descFirstParagraph, { inline: true });
			return `<strong><a href="${entry.url}">${entry.title}</a></strong> ${metaHtml} : ${markdown}`;
		} else {
			return `<span style='color:red'>[Unknown type: ${type}]</span>`;
		}
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
		return value.replace(/\{%\s*(item|link)\s+"([^"]+)"(?:\s*,\s*"([^"]+)")?\s*%\}/g, (_, type, path, excludeTags) => {
			return this.renderLexiconEntry(type, path, excludeTags);
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
