import { Character } from './types/ui';

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
 * Same as `array.indexOf` but uses a predicate function to find the matching item.
 * @param array the array to search
 * @param predicate function to test each item
 * @returns the index of the matching item, or -1 if not found
 */
export const indexOfMatching = <T>(array: readonly T[], predicate: (item: T) => boolean): number => {
	for (let i = 0; i < array.length; i++) {
		if (predicate(array[i])) {
			return i;
		}
	}
	return -1;
};
