import emojiData from 'emojilib/dist/emoji-en-US.json';

const VARIATION_SELECTOR_REGEX = /[\uFE0E\uFE0F]/g;
const MAX_RECENTS = 10;
const DEFAULT_EMOJIS = ['🌳', '🌲', '🌿', '☠️', '⭐', '🔥', '⚡', '🛡️', '🐉', '🎯'];

interface EmojiEntry {
	emoji: string;
	canonicalName: string;
	keywords: string[];
	phrases: string[];
	tokens: string[];
	rank: number;
}

export interface EmojiResult {
	emoji: string;
	canonicalName: string;
	keywords: string[];
}

const emojiEntries: EmojiEntry[] = [];
const emojiByKey = new Map<string, EmojiEntry>();
const recentEmojis: EmojiEntry[] = [];
const searchCache = new Map<string, EmojiEntry[]>();

for (const [emoji, rawKeywords] of Object.entries(emojiData)) {
	const phrases = Array.from(new Set(rawKeywords.map(normalizePhrase)));
	const tokensSet = new Set<string>();
	for (const keyword of rawKeywords) {
		tokensSet.add(keyword.toLowerCase());
	}
	for (const phrase of phrases) {
		tokensSet.add(phrase);
		for (const token of phrase.split(/\s+/)) {
			if (token) {
				tokensSet.add(token);
			}
		}
	}
	tokensSet.add(createEmojiKey(emoji));
	tokensSet.add(emoji);
	const canonicalName = phrases[0] ?? '';
	const entry: EmojiEntry = {
		emoji,
		canonicalName,
		keywords: phrases,
		phrases,
		tokens: Array.from(tokensSet),
		rank: emojiEntries.length,
	};
	emojiEntries.push(entry);
	emojiByKey.set(createEmojiKey(emoji), entry);
	const normalized = emoji.replace(VARIATION_SELECTOR_REGEX, '');
	if (normalized !== emoji) {
		emojiByKey.set(createEmojiKey(normalized), entry);
	}
}

for (const emoji of DEFAULT_EMOJIS) {
	const entry = getEntry(emoji);
	if (entry) {
		recentEmojis.push(entry);
	}
}

function createEmojiKey(value: string): string {
	return value.replace(VARIATION_SELECTOR_REGEX, '').toLowerCase();
}

function normalizePhrase(value: string): string {
	return value.replace(/_/g, ' ').trim().toLowerCase();
}

function levenshtein(a: string, b: string): number {
	if (a === b) {
		return 0;
	}
	const aLen = a.length;
	const bLen = b.length;
	if (aLen === 0) {
		return bLen;
	}
	if (bLen === 0) {
		return aLen;
	}
	const previous = Array.from({ length: bLen + 1 }, (_, index) => index);
	const current = new Array<number>(bLen + 1).fill(0);
	for (let i = 1; i <= aLen; i += 1) {
		current[0] = i;
		const aCode = a.charCodeAt(i - 1);
		for (let j = 1; j <= bLen; j += 1) {
			const cost = aCode === b.charCodeAt(j - 1) ? 0 : 1;
			const insertCost = current[j - 1]! + 1;
			const deleteCost = previous[j]! + 1;
			const replaceCost = previous[j - 1]! + cost;
			current[j] = Math.min(insertCost, deleteCost, replaceCost);
		}
		for (let j = 0; j <= bLen; j += 1) {
			previous[j] = current[j]!;
		}
	}
	return previous[bLen]!;
}

function evaluateTerm(term: string, token: string): number | null {
	if (term === token) {
		return 0;
	}
	if (term.startsWith(token)) {
		return 1 + (term.length - token.length) * 0.01;
	}
	const index = term.indexOf(token);
	if (index >= 0) {
		return 2 + index * 0.1;
	}
	const distance = levenshtein(term, token);
	const maxLength = Math.max(term.length, token.length);
	if (maxLength === 0) {
		return null;
	}
	const similarity = 1 - distance / maxLength;
	if (similarity < 0.45) {
		return null;
	}
	return 10 + (1 - similarity) * 10;
}

function scoreEntry(entry: EmojiEntry, queryTokens: string[]): number | null {
	let total = 0;
	for (const token of queryTokens) {
		const tokenScore = scoreToken(entry, token);
		if (tokenScore === null) {
			return null;
		}
		total += tokenScore;
	}
	return total + entry.rank * 1e-4;
}

function scoreToken(entry: EmojiEntry, token: string): number | null {
	let best: number | null = null;
	for (const term of entry.phrases) {
		const score = evaluateTerm(term, token);
		if (score !== null && (best === null || score < best)) {
			best = score;
		}
	}
	for (const term of entry.tokens) {
		const score = evaluateTerm(term, token);
		if (score !== null && (best === null || score < best)) {
			best = score;
		}
	}
	return best;
}

function getRecentEntries(limit: number): EmojiEntry[] {
	const unique: EmojiEntry[] = [];
	const seen = new Set<EmojiEntry>();
	for (const entry of recentEmojis) {
		if (seen.has(entry)) {
			continue;
		}
		seen.add(entry);
		unique.push(entry);
		if (unique.length === limit) {
			break;
		}
	}
	return unique;
}

function toResult(entry: EmojiEntry): EmojiResult {
	return {
		emoji: entry.emoji,
		canonicalName: entry.canonicalName,
		keywords: entry.keywords,
	};
}

export function getEmojiSuggestions(query: string, limit = 5): EmojiResult[] {
	const normalizedQuery = query.trim().toLowerCase();
	const cacheKey = `${normalizedQuery}:${limit}`;
	if (searchCache.has(cacheKey)) {
		return searchCache.get(cacheKey)!.map(toResult);
	}
	if (!normalizedQuery) {
		const recents = getRecentEntries(limit);
		searchCache.set(cacheKey, recents);
		return recents.map(toResult);
	}
	const tokenSet = new Set<string>();
	if (normalizedQuery) {
		tokenSet.add(normalizedQuery);
	}
	for (const part of normalizedQuery.split(/\s+/)) {
		if (part) {
			tokenSet.add(part);
		}
	}
	const tokens = Array.from(tokenSet);
	if (!tokens.length) {
		const recents = getRecentEntries(limit);
		searchCache.set(cacheKey, recents);
		return recents.map(toResult);
	}
	const scored: { entry: EmojiEntry; score: number }[] = [];
	for (const entry of emojiEntries) {
		const score = scoreEntry(entry, tokens);
		if (score !== null) {
			scored.push({ entry, score });
		}
	}
	if (!scored.length) {
		const recents = getRecentEntries(limit);
		searchCache.set(cacheKey, recents);
		return recents.map(toResult);
	}
	scored.sort((a, b) => a.score - b.score);
	const selected = scored.slice(0, limit).map(item => item.entry);
	searchCache.set(cacheKey, selected);
	return selected.map(toResult);
}

export function isKnownEmoji(value: string): boolean {
	return Boolean(getEmojiEntry(value));
}

export function recordEmojiUsage(value: string): void {
	const entry = getEntry(value);
	if (!entry) {
		return;
	}
	const existingIndex = recentEmojis.indexOf(entry);
	if (existingIndex !== -1) {
		recentEmojis.splice(existingIndex, 1);
	}
	recentEmojis.unshift(entry);
	if (recentEmojis.length > MAX_RECENTS) {
		recentEmojis.length = MAX_RECENTS;
	}
	searchCache.clear();
}

export function getEmojiEntry(value: string): EmojiResult | null {
	const entry = getEntry(value);
	return entry ? toResult(entry) : null;
}

function getEntry(value: string): EmojiEntry | undefined {
	return emojiByKey.get(createEmojiKey(value));
}
