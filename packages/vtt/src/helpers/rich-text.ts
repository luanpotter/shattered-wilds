export const processRichText = (text: string): string => {
	if (!text) return '';

	let processed = text;

	// First, protect code blocks from other processing
	const codeBlocks: string[] = [];
	processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
		const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
		codeBlocks.push(code);
		return placeholder;
	});

	// Process wiki links: [[Link Text]] or [[Link Text | Display Text]]
	// Keep original case for display, create slug properly for URL
	processed = processed.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_match, linkText, _, displayText) => {
		const display = displayText ? displayText.trim() : linkText.trim();
		// Create slug: preserve case but replace spaces with underscores, no lowercasing
		const slug = linkText.trim().replace(/\s+/g, '_');
		return `<a href="https://d12.nexus/wiki/${slug}" target="_blank" rel="noopener">${display}</a>`;
	});

	// Process basic markdown
	// Important: Process bold BEFORE italic to avoid conflicts with **
	// Bold: **text**
	processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

	// Italic: *text* but NOT **text** (already processed)
	// Use negative lookahead/lookbehind to avoid matching asterisks from bold
	processed = processed.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');

	// Also support underscore italics: _text_ (but not in the middle of words or slugs)
	// Use word boundaries to avoid matching underscores in wiki link slugs
	processed = processed.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');

	// Restore code blocks with proper inline styling
	codeBlocks.forEach((code, index) => {
		const placeholder = `__CODE_BLOCK_${index}__`;
		processed = processed.replace(placeholder, `<code>${code}</code>`);
	});

	// Line breaks
	processed = processed.replace(/\n/g, '<br>');

	return processed;
};
