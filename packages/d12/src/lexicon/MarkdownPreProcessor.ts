export type TextPostRenderer = (tagName: string, ...args: string[]) => string | null;

export class MarkdownPreProcessor {
	private renderer: TextPostRenderer;

	constructor({ renderer }: { renderer: TextPostRenderer }) {
		this.renderer = renderer;
	}

	wikiLinks = (value: string): string => {
		return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
			const [link, text] = r.includes(' | ') ? r.split(' | ') : [r, r];
			const url = `/wiki/${link.replace(' ', '_')}`;
			return `[${text}](${url})`;
		});
	};

	processShortcodes = (value: string): string => {
		return value.replace(/\{%\s*(\w+)\s+([^%]+)\s*%\}/g, (match, tagName, args) => {
			const parsedArgs = parseLiquidArgs(args);
			return this.renderer(tagName, ...parsedArgs) ?? match;
		});
	};

	process = (value: string): string => {
		return this.wikiLinks(this.processShortcodes(value));
	};
}

const parseLiquidArgs = (args: string): string[] => {
	const result: string[] = [];
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
