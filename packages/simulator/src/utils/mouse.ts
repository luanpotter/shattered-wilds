import { Point } from '../types/ui';

declare global {
	interface Window {
		lastMousePosition: Point | undefined;
	}
}

const getCurrentMousePosition = (): Point => {
	return window?.lastMousePosition ?? getFallbackMousePosition();
};

const getFallbackMousePosition = (): Point => {
	return {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
	};
};

/**
 * Adjusts modal position to ensure it stays within viewport bounds.
 * This prevents modals from opening partially off-screen when near edges.
 *
 * @param mousePosition - The raw mouse position where the modal should open
 * @param modalSize - Optional size of the modal (width, height). If not provided, uses estimated defaults.
 * @returns Adjusted position that keeps the modal within viewport
 */
const getAdjustedModalPosition = (
	mousePosition: Point,
	modalSize?: { width: number; height: number } | undefined,
): Point => {
	// Use estimated modal size if not provided
	// These are reasonable defaults based on typical modal sizes
	const estimatedWidth = modalSize?.width ?? 400;
	const estimatedHeight = modalSize?.height ?? 300;

	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	// Add some padding from the edges
	const padding = 20;

	let x = mousePosition.x;
	let y = mousePosition.y;

	// Check if modal would extend beyond right edge
	if (x + estimatedWidth > viewportWidth - padding) {
		// Position modal to the left of the cursor instead
		x = Math.max(padding, mousePosition.x - estimatedWidth);
	}

	// Check if modal would extend beyond bottom edge
	if (y + estimatedHeight > viewportHeight - padding) {
		// Position modal above the cursor instead
		y = Math.max(padding, mousePosition.y - estimatedHeight);
	}

	// Ensure modal doesn't go off the left or top edge
	x = Math.max(padding, x);
	y = Math.max(padding, y);

	return { x, y };
};

// Listen for mousemove and store last mouse position globally
if (typeof window !== 'undefined') {
	window.lastMousePosition = undefined;
	window.addEventListener('mousemove', e => {
		window.lastMousePosition = { x: e.clientX, y: e.clientY };
	});
}

export const Mouse = {
	getPosition: getCurrentMousePosition,
	getAdjustedPosition: getAdjustedModalPosition,
};
