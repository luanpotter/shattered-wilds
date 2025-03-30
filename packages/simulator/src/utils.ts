import { Window, Point } from './types';

// Constants for window positioning
const INITIAL_POSITION: Point = { x: 80, y: 80 };
const MARGIN = 16; // Space between windows
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
			return (
				Math.abs(pos.x - window.position.x) < WINDOW_SIZE.width &&
				Math.abs(pos.y - window.position.y) < WINDOW_SIZE.height
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
