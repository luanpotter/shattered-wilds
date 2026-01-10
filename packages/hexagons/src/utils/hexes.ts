import { findVertexPathAStar, vertexKey, verticesEqual } from '@shattered-wilds/commons';
import type { Point } from '@shattered-wilds/commons';

/**
 * Gets the hex size from Foundry VTT's canvas grid.
 */
export const getHexSize = (): number | undefined => {
	return canvas?.grid?.size;
};

/**
 * Get the 6 vertices (corners) of the hex containing the given pixel point.
 * Uses Foundry VTT's canvas grid native API to handle grid orientation and offset.
 */
export const getHexVertices = (point: PIXI.IPointData): Point[] => {
	const grid = canvas?.grid;
	if (!grid) return [];

	const offset = grid.getOffset({ x: point.x, y: point.y });
	const center = grid.getCenterPoint({ i: offset.i, j: offset.j });
	if (!center) return [];

	const neighborOffsets = grid.getAdjacentOffsets(offset);
	const neighbors: { x: number; y: number; angle: number }[] = [];

	for (const neighborOffset of neighborOffsets) {
		const neighborCenter = grid.getCenterPoint(neighborOffset);
		if (neighborCenter) {
			const dx = neighborCenter.x - center.x;
			const dy = neighborCenter.y - center.y;
			neighbors.push({ x: neighborCenter.x, y: neighborCenter.y, angle: Math.atan2(dy, dx) });
		}
	}

	if (neighbors.length !== 6) return [];
	neighbors.sort((a, b) => a.angle - b.angle);

	const vertices: Point[] = [];
	for (let i = 0; i < 6; i++) {
		const n1 = neighbors[i]!;
		const n2 = neighbors[(i + 1) % 6]!;
		vertices.push({ x: (center.x + n1.x + n2.x) / 3, y: (center.y + n1.y + n2.y) / 3 });
	}
	return vertices;
};

/**
 * Get all vertices adjacent to a given vertex (connected by hex edges).
 * Each vertex is shared by 3 hexes and has 3 adjacent vertices.
 */
export const getAdjacentVertices = (vertex: Point): Point[] => {
	const grid = canvas?.grid;
	if (!grid) return [];

	const offset = grid.getOffset(vertex);
	const hexesToCheck = [offset, ...grid.getAdjacentOffsets(offset)];

	let foundHex: { i: number; j: number } | null = null;
	let foundVertexIndex = -1;

	for (const hexOffset of hexesToCheck) {
		const hexCenter = grid.getCenterPoint(hexOffset);
		if (!hexCenter) continue;
		const hexVertices = getHexVertices(hexCenter);
		for (let i = 0; i < hexVertices.length; i++) {
			if (verticesEqual(hexVertices[i]!, vertex)) {
				foundHex = hexOffset;
				foundVertexIndex = i;
				break;
			}
		}
		if (foundHex) break;
	}

	if (!foundHex || foundVertexIndex === -1) return [];

	const hexCenter = grid.getCenterPoint(foundHex);
	if (!hexCenter) return [];
	const hexVertices = getHexVertices(hexCenter);

	const adjacent: Point[] = [hexVertices[(foundVertexIndex + 5) % 6]!, hexVertices[(foundVertexIndex + 1) % 6]!];

	for (const neighborOffset of grid.getAdjacentOffsets(foundHex)) {
		const neighborCenter = grid.getCenterPoint(neighborOffset);
		if (!neighborCenter) continue;
		const neighborVertices = getHexVertices(neighborCenter);
		for (let j = 0; j < neighborVertices.length; j++) {
			if (verticesEqual(neighborVertices[j]!, vertex)) {
				const prev = neighborVertices[(j + 5) % 6]!;
				const next = neighborVertices[(j + 1) % 6]!;
				if (!hexVertices.some(hv => verticesEqual(hv, prev))) adjacent.push(prev);
				if (!hexVertices.some(hv => verticesEqual(hv, next))) adjacent.push(next);
				break;
			}
		}
	}
	return adjacent;
};

/** Get all hexes along the straight line between two points. */
const getHexesAlongLine = (start: Point, end: Point): Set<string> => {
	const grid = canvas?.grid;
	if (!grid) return new Set();

	const hexes = new Set<string>();
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const steps = Math.max(Math.ceil(distance / 2), 1);

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const o = grid.getOffset({ x: start.x + dx * t, y: start.y + dy * t });
		hexes.add(`${o.i},${o.j}`);
	}
	return hexes;
};

/**
 * Find the shortest path along hex edges from one vertex to another.
 * Uses A* pathfinding constrained to hexes along the line.
 */
export const findVertexPath = (start: Point, end: Point): Point[] => {
	const grid = canvas?.grid;
	if (!grid) return [];

	const allowedHexes = getHexesAlongLine(start, end);

	// Snap start/end to exact vertices and add their hexes
	let snappedStart = start;
	let snappedEnd = end;

	for (const hexOffset of [grid.getOffset(start), ...grid.getAdjacentOffsets(grid.getOffset(start))]) {
		const hexCenter = grid.getCenterPoint(hexOffset);
		if (!hexCenter) continue;
		for (const v of getHexVertices(hexCenter)) {
			if (verticesEqual(v, start)) {
				allowedHexes.add(`${hexOffset.i},${hexOffset.j}`);
				snappedStart = v;
			}
		}
	}

	for (const hexOffset of [grid.getOffset(end), ...grid.getAdjacentOffsets(grid.getOffset(end))]) {
		const hexCenter = grid.getCenterPoint(hexOffset);
		if (!hexCenter) continue;
		for (const v of getHexVertices(hexCenter)) {
			if (verticesEqual(v, end)) {
				allowedHexes.add(`${hexOffset.i},${hexOffset.j}`);
				snappedEnd = v;
			}
		}
	}

	// Collect allowed vertices
	const allowedVertices = new Set<string>();
	for (const hexKeyStr of allowedHexes) {
		const [i, j] = hexKeyStr.split(',').map(Number);
		if (i !== undefined && j !== undefined) {
			const center = grid.getCenterPoint({ i, j });
			if (center) {
				for (const v of getHexVertices(center)) allowedVertices.add(vertexKey(v));
			}
		}
	}

	const startKey = vertexKey(snappedStart);
	const endKey = vertexKey(snappedEnd);
	if (!allowedVertices.has(startKey) || !allowedVertices.has(endKey)) return [start, end];

	return findVertexPathAStar(snappedStart, snappedEnd, {
		getAdjacentVertices,
		isVertexAllowed: v => allowedVertices.has(vertexKey(v)),
	});
};
