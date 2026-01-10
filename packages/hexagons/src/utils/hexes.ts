import * as commons from '@shattered-wilds/commons';
import type { Point } from '@shattered-wilds/commons';

/**
 * Gets the hex size from Foundry VTT's canvas grid.
 * Returns undefined if canvas is not available.
 */
export const getHexSize = (): number | undefined => {
	const grid = canvas?.grid;
	if (!grid) {
		return undefined;
	}
	// Foundry's grid.size is the distance between flat edges (the "width" for pointy-top)
	return grid.size;
};

/**
 * Find the closest vertex to a given point from a list of vertices.
 * Thin wrapper around commons implementation.
 */
export const findClosestVertex = (point: PIXI.IPointData, vertices: Point[]): Point | null => {
	return commons.findClosestVertex(point, vertices);
};

/**
 * Get the 6 vertices (corners) of the hex containing the given pixel point.
 * Uses Foundry VTT's canvas grid to determine hex size.
 */
export const getHexVertices = (point: PIXI.IPointData): Point[] => {
	const hexSize = getHexSize();
	if (!hexSize) {
		return [];
	}

	const hex = commons.pixelToAxial(point, hexSize);
	return commons.getHexVertices(hex, hexSize);
};

/**
 * Get all vertices adjacent to a given vertex (connected by hex edges).
 * Uses Foundry VTT's canvas grid to determine hex size.
 */
export const getAdjacentVertices = (vertex: Point): Point[] => {
	const hexSize = getHexSize();
	if (!hexSize) {
		return [];
	}

	return commons.getAdjacentVertices(vertex, hexSize);
};

/**
 * Find the shortest path along hex edges from one vertex to another.
 * Uses Foundry VTT's canvas grid to determine hex size.
 */
export const findVertexPath = (start: Point, end: Point): Point[] => {
	const hexSize = getHexSize();
	if (!hexSize) {
		return [];
	}

	return commons.findVertexPath(start, end, hexSize);
};
