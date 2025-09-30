import { Character, HexPosition, Point } from './types/ui';

/**
 * Find the next available character number
 * Skips numbers that are already used in existing character names
 */
export const findNextCharacterNumber = (characters: Character[]): number => {
	// Extract numbers from existing character names
	const usedNumbers = characters
		.map(c => {
			// Try to extract number from "Character X" format
			const match = c.props.name.match(/^Character (\d+)$/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter((num): num is number => num !== null) // Filter out non-matches
		.sort((a, b) => a - b); // Sort numerically

	// Find the first gap in the sequence starting from 1
	let nextNumber = 1;
	for (const num of usedNumbers) {
		if (num > nextNumber) {
			// Found a gap
			break;
		}
		if (num === nextNumber) {
			// This number is used, try next one
			nextNumber++;
		}
	}

	return nextNumber;
};

/**
 * Find the next available hex position for a character
 * Searches in a spiral pattern outward from the center
 * @param characters Array of existing characters to check positions against
 * @returns The next available hex coordinates {q, r}
 */
export const findNextEmptyHexPosition = (
	characters: Character[],
	startQ: number = 0,
	startR: number = 0,
): HexPosition => {
	// Check if the starting position is empty
	if (!findCharacterAtPosition(characters, startQ, startR)) {
		return { q: startQ, r: startR };
	}

	// Spiral outward from the starting position
	const directions = [
		{ q: 1, r: 0 }, // east
		{ q: 0, r: 1 }, // southeast
		{ q: -1, r: 1 }, // southwest
		{ q: -1, r: 0 }, // west
		{ q: 0, r: -1 }, // northwest
		{ q: 1, r: -1 }, // northeast
	];

	let q = startQ;
	let r = startR;
	let radius = 1;

	while (radius < 20) {
		// Prevent infinite loop with a reasonable limit
		for (let side = 0; side < 6; side++) {
			for (let step = 0; step < radius; step++) {
				q += directions[side].q;
				r += directions[side].r;

				if (!findCharacterAtPosition(characters, q, r)) {
					return { q, r };
				}
			}
		}
		radius++;
	}

	// Fallback if no position found
	return { q: 0, r: 0 };
};

/**
 * Finds a character at the given hex position
 */
export const findCharacterAtPosition = (characters: Character[], q: number, r: number): Character | undefined => {
	return characters.find(c => c.position?.q === q && c.position?.r === r);
};

/**
 * Convert axial hex coordinates to pixel coordinates
 */
export const axialToPixel = (q: number, r: number): Point => {
	const x = q * 10 + r * 5;
	const y = r * 8.66; // sqrt(3) * 5
	return { x, y };
};
