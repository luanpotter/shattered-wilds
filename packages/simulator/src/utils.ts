import { Window, Point } from './types';

// Constants for window positioning
const INITIAL_POSITION: Point = { x: 80, y: 80 };
const MARGIN = 16; // Space between windows
const OVERLAP_MARGIN = 8; // Additional buffer when checking for overlaps
// Default window dimensions
const WINDOW_SIZE = { width: 300, height: 200 };

/**
 * Find a position for a new window that doesn't overlap with existing windows
 * Places windows side by side with margins and tries to fill gaps
 */
export const findNextWindowPosition = (windows: Window[]): Point => {
	if (windows.length === 0) {
		return { ...INITIAL_POSITION };
	}

	// Get available horizontal space
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	// Calculate how many columns and rows we can fit
	const maxCols = Math.floor((viewportWidth - INITIAL_POSITION.x) / (WINDOW_SIZE.width + MARGIN));
	const maxRows = Math.floor((viewportHeight - INITIAL_POSITION.y) / (WINDOW_SIZE.height + MARGIN));

	// Create an array of grid positions
	const gridPositions = [];
	for (let row = 0; row < maxRows; row++) {
		for (let col = 0; col < maxCols; col++) {
			gridPositions.push({
				row,
				col,
				x: INITIAL_POSITION.x + col * (WINDOW_SIZE.width + MARGIN),
				y: INITIAL_POSITION.y + row * (WINDOW_SIZE.height + MARGIN),
			});
		}
	}

	// Mark positions that are too close to existing windows
	const occupiedPositions = gridPositions.filter(pos => {
		return windows.some(window => {
			// Check if this grid position would overlap with this window
			// Use actual window position (after dragging)
			// Add OVERLAP_MARGIN to create a buffer zone around each window
			return (
				Math.abs(pos.x - window.position.x) < WINDOW_SIZE.width + OVERLAP_MARGIN &&
				Math.abs(pos.y - window.position.y) < WINDOW_SIZE.height + OVERLAP_MARGIN
			);
		});
	});

	// Find first free position
	const freePosition = gridPositions.find(
		pos => !occupiedPositions.some(occupied => occupied.row === pos.row && occupied.col === pos.col)
	);

	// If we found a free position, use it
	if (freePosition) {
		return { x: freePosition.x, y: freePosition.y };
	}

	// If all grid positions are occupied, cascade from the last window
	// Find the most bottom-right window to cascade from
	let maxRight = INITIAL_POSITION.x;
	let maxBottom = INITIAL_POSITION.y;

	windows.forEach(window => {
		if (window.position.x > maxRight) {
			maxRight = window.position.x;
		}
		if (window.position.y > maxBottom) {
			maxBottom = window.position.y;
		}
	});

	// Add margin and make sure it's visible on screen
	const x = Math.min(maxRight + MARGIN, viewportWidth - WINDOW_SIZE.width - MARGIN);
	const y = Math.min(maxBottom + MARGIN, viewportHeight - WINDOW_SIZE.height - MARGIN);

	return { x, y };
};

/**
 * Find the next available hex position for a character
 * Searches in a spiral pattern outward from the center
 * @param characters Array of existing characters to check positions against
 * @returns The next available hex coordinates {q, r}
 */
export const findNextEmptyHexPosition = (characters: { position?: { q: number; r: number } }[]) => {
	// Start at center hex
	const center = { q: 0, r: 0 };

	// Check if center is available
	if (!characters.some(c => c.position?.q === center.q && c.position?.r === center.r)) {
		return center;
	}

	// Spiral out to find the next empty hex
	// Direction vectors for the six neighbors of a hex in axial coordinates
	const directions = [
		{ q: 1, r: 0 }, // right
		{ q: 0, r: 1 }, // down-right
		{ q: -1, r: 1 }, // down-left
		{ q: -1, r: 0 }, // left
		{ q: 0, r: -1 }, // up-left
		{ q: 1, r: -1 }, // up-right
	];

	// Spiral outward from center
	for (let radius = 1; radius <= 10; radius++) {
		// Limit search radius to 10
		// Start at the top-right corner of the radius
		let hex = { q: radius, r: -radius };

		// Move along each of the six sides of the hexagonal ring
		for (let side = 0; side < 6; side++) {
			// Each side has 'radius' steps
			for (let step = 0; step < radius; step++) {
				// Check if this position is free
				if (!characters.some(c => c.position?.q === hex.q && c.position?.r === hex.r)) {
					return hex;
				}

				// Move to next hex in the ring
				hex = {
					q: hex.q + directions[side].q,
					r: hex.r + directions[side].r,
				};
			}
		}
	}

	// If we get here, we didn't find a free position within radius 10
	// Return a random position as a fallback
	return { q: Math.floor(Math.random() * 10) - 5, r: Math.floor(Math.random() * 10) - 5 };
};
