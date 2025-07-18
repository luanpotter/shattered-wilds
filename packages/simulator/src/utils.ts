import { Character, Point, Window, HexPosition } from './types';

// Constants for window positioning
const INITIAL_POSITION: Point = { x: 20, y: 20 };
const WINDOW_SIZE = { width: 300, height: 300 };
const OVERLAP_MARGIN = 8; // Additional buffer when checking for overlaps

/**
 * Find the next available position for a new window
 */
export function findNextWindowPosition(windows: Window[]): Point {
	// If no windows, return default position
	if (windows.length === 0) {
		return INITIAL_POSITION;
	}

	// Get viewport dimensions
	const viewportWidth = window.innerWidth - WINDOW_SIZE.width;
	const viewportHeight = window.innerHeight - WINDOW_SIZE.height;

	// Define step size for grid positions
	const stepSize = 50; // Pixels between positions

	// Compute grid size based on viewport dimensions and step size
	const gridCols = Math.ceil(viewportWidth / stepSize);
	const gridRows = Math.ceil(viewportHeight / stepSize);
	const gridSize = Math.max(gridCols, gridRows);

	// Create a grid to represent potential window positions
	const grid: boolean[][] = [];

	// Initialize the grid (all positions free)
	for (let i = 0; i < gridSize; i++) {
		grid[i] = [];
		for (let j = 0; j < gridSize; j++) {
			grid[i][j] = false;
		}
	}

	// Mark occupied positions based on existing windows
	for (const window of windows) {
		// Get the window's bounds
		const winLeft = window.position.x;
		const winRight = window.position.x + WINDOW_SIZE.width;
		const winTop = window.position.y;
		const winBottom = window.position.y + WINDOW_SIZE.height;

		// Check each grid cell to see if it overlaps with this window
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				// Calculate the grid cell's bounds
				const cellLeft = col * stepSize + INITIAL_POSITION.x;
				const cellRight = cellLeft + WINDOW_SIZE.width;
				const cellTop = row * stepSize + INITIAL_POSITION.y;
				const cellBottom = cellTop + WINDOW_SIZE.height;

				// Check for overlap (with margin)
				if (
					cellRight + OVERLAP_MARGIN > winLeft &&
					cellLeft - OVERLAP_MARGIN < winRight &&
					cellBottom + OVERLAP_MARGIN > winTop &&
					cellTop - OVERLAP_MARGIN < winBottom
				) {
					grid[row][col] = true; // Mark as occupied
				}
			}
		}
	}

	// Find the first free position
	for (let row = 0; row < gridSize; row++) {
		for (let col = 0; col < gridSize; col++) {
			if (!grid[row][col]) {
				const x = col * stepSize + INITIAL_POSITION.x;
				const y = row * stepSize + INITIAL_POSITION.y;

				// Ensure the position is within viewport bounds
				if (x < viewportWidth && y < viewportHeight) {
					return { x, y };
				}
			}
		}
	}

	// If no free position found, cascade from the last window
	const lastWindow = windows[windows.length - 1];
	const x = Math.min(lastWindow.position.x + 20, viewportWidth - 20);
	const y = Math.min(lastWindow.position.y + 20, viewportHeight - 20);

	return { x, y };
}

/**
 * Find the next available character number
 * Skips numbers that are already used in existing character names
 */
export function findNextCharacterNumber(characters: Character[]): number {
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
}

/**
 * Find the next available hex position for a character
 * Searches in a spiral pattern outward from the center
 * @param characters Array of existing characters to check positions against
 * @returns The next available hex coordinates {q, r}
 */
export function findNextEmptyHexPosition(characters: Character[], startQ: number = 0, startR: number = 0): HexPosition {
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
}

/**
 * Finds a character at the given hex position
 */
export function findCharacterAtPosition(characters: Character[], q: number, r: number): Character | undefined {
	return characters.find(c => c.position?.q === q && c.position?.r === r);
}

/**
 * Convert axial hex coordinates to pixel coordinates
 */
export function axialToPixel(q: number, r: number): Point {
	const x = q * 10 + r * 5;
	const y = r * 8.66; // sqrt(3) * 5
	return { x, y };
}
