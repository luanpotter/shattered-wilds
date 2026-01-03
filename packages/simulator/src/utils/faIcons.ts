// Font Awesome 6 icon search utility
// Icon names are the react-icons export names (e.g., 'FaStar', 'FaFire')

import * as Fa6Icons from 'react-icons/fa6';

// Get all FA6 icon names dynamically from the module
const FA_ICONS: string[] = Object.keys(Fa6Icons).filter(key => key.startsWith('Fa'));

interface IconEntry {
	name: string;
	tokens: string[];
	rank: number;
}

const MAX_RECENTS = 10;
const DEFAULT_ICONS = ['FaStar', 'FaFire', 'FaSkull', 'FaDragon', 'FaCrown'];

const iconEntries: IconEntry[] = [];
const recentIcons: IconEntry[] = [];
const searchCache = new Map<string, IconEntry[]>();

// Convert camelCase to searchable tokens
function nameToTokens(name: string): string[] {
	// Remove 'Fa' prefix and split on camelCase
	const withoutPrefix = name.replace(/^Fa/, '');
	const tokens = withoutPrefix.split(/(?=[A-Z])/).map(t => t.toLowerCase());
	tokens.push(withoutPrefix.toLowerCase());
	tokens.push(name.toLowerCase());
	return tokens;
}

// Initialize icon entries
for (let i = 0; i < FA_ICONS.length; i++) {
	const name = FA_ICONS[i];
	iconEntries.push({
		name,
		tokens: nameToTokens(name),
		rank: i,
	});
}

// Initialize recent icons with defaults
for (const name of DEFAULT_ICONS) {
	const entry = iconEntries.find(e => e.name === name);
	if (entry) {
		recentIcons.push(entry);
	}
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	const aLen = a.length;
	const bLen = b.length;
	if (aLen === 0) return bLen;
	if (bLen === 0) return aLen;

	const previous = Array.from({ length: bLen + 1 }, (_, i) => i);
	const current = new Array<number>(bLen + 1).fill(0);

	for (let i = 1; i <= aLen; i++) {
		current[0] = i;
		const aCode = a.charCodeAt(i - 1);
		for (let j = 1; j <= bLen; j++) {
			const cost = aCode === b.charCodeAt(j - 1) ? 0 : 1;
			current[j] = Math.min(current[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + cost);
		}
		for (let j = 0; j <= bLen; j++) {
			previous[j] = current[j]!;
		}
	}
	return previous[bLen]!;
}

function evaluateTerm(term: string, token: string): number | null {
	if (term === token) return 0;
	if (term.startsWith(token)) return 1 + (term.length - token.length) * 0.01;
	const index = term.indexOf(token);
	if (index >= 0) return 2 + index * 0.1;
	const distance = levenshtein(term, token);
	const maxLength = Math.max(term.length, token.length);
	if (maxLength === 0) return null;
	const similarity = 1 - distance / maxLength;
	if (similarity < 0.45) return null;
	return 10 + (1 - similarity) * 10;
}

function scoreEntry(entry: IconEntry, queryTokens: string[]): number | null {
	let total = 0;
	for (const token of queryTokens) {
		const tokenScore = scoreToken(entry, token);
		if (tokenScore === null) return null;
		total += tokenScore;
	}
	return total + entry.rank * 1e-4;
}

function scoreToken(entry: IconEntry, token: string): number | null {
	let best: number | null = null;
	for (const term of entry.tokens) {
		const score = evaluateTerm(term, token);
		if (score !== null && (best === null || score < best)) {
			best = score;
		}
	}
	return best;
}

function getRecentEntries(limit: number): IconEntry[] {
	const unique: IconEntry[] = [];
	const seen = new Set<string>();
	for (const entry of recentIcons) {
		if (seen.has(entry.name)) continue;
		seen.add(entry.name);
		unique.push(entry);
		if (unique.length === limit) break;
	}
	return unique;
}

export interface IconResult {
	name: string;
	displayName: string;
}

function toResult(entry: IconEntry): IconResult {
	return {
		name: entry.name,
		displayName: entry.name
			.replace(/^Fa/, '')
			.replace(/([A-Z])/g, ' $1')
			.trim(),
	};
}

export function getIconSuggestions(query: string, limit = 5): IconResult[] {
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
	tokenSet.add(normalizedQuery);
	for (const part of normalizedQuery.split(/\s+/)) {
		if (part) tokenSet.add(part);
	}
	const tokens = Array.from(tokenSet);

	if (!tokens.length) {
		const recents = getRecentEntries(limit);
		searchCache.set(cacheKey, recents);
		return recents.map(toResult);
	}

	const scored: { entry: IconEntry; score: number }[] = [];
	for (const entry of iconEntries) {
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

export function recordIconUsage(name: string): void {
	const entry = iconEntries.find(e => e.name === name);
	if (!entry) return;

	const existingIndex = recentIcons.indexOf(entry);
	if (existingIndex !== -1) {
		recentIcons.splice(existingIndex, 1);
	}
	recentIcons.unshift(entry);
	if (recentIcons.length > MAX_RECENTS) {
		recentIcons.length = MAX_RECENTS;
	}
	searchCache.clear();
}

export function isValidIcon(name: string): boolean {
	return iconEntries.some(e => e.name === name);
}
