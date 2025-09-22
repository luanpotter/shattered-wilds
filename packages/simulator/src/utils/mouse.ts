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

// Listen for mousemove and store last mouse position globally
if (typeof window !== 'undefined') {
	window.lastMousePosition = undefined;
	window.addEventListener('mousemove', e => {
		window.lastMousePosition = { x: e.clientX, y: e.clientY };
	});
}

export const Mouse = {
	getPosition: getCurrentMousePosition,
};
