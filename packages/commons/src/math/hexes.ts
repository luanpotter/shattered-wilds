/**
 * Hex grid math utilities supporting both pointy-top and flat-top hexagons.
 *
 * This module provides coordinate conversion, vertex computation, and pathfinding
 * functions for hex grids via the HexGrid class.
 *
 * Coordinate systems:
 * - Axial coordinates (q, r): Standard hex grid coordinates
 * - Pixel coordinates (x, y): Cartesian coordinates
 * - Hex vertices: Points at the corners of hexagons
 *
 * Usage:
 *   const grid = new HexGrid({ size: 100, orientation: HexOrientation.PointyTop });
 *   const pixel = grid.axialToPixel({ q: 1, r: 2 });
 *   const hex = grid.pixelToAxial({ x: 150, y: 200 });
 */

import { Dimensions, Line, Point } from './geom.js';

/** Axial hex coordinates */
export interface HexCoord {
	q: number;
	r: number;
}

/** Hex grid orientation */
export enum HexOrientation {
	/** Pointy vertex at top, flat edges on sides */
	PointyTop = 'pointy-top',
	/** Flat edge at top, pointy vertices on sides */
	FlatTop = 'flat-top',
}

/** Configuration for a HexGrid instance */
export interface HexGridConfig {
	/** The size of a hex (distance between parallel edges) */
	size: number;
	/** Hex orientation (pointy-top or flat-top) */
	orientation: HexOrientation;
}

const SQRT3 = Math.sqrt(3);

// ============================================================================
// Direction vectors for hex neighbors (same for both orientations in axial coords)
// ============================================================================

const AXIAL_DIRECTIONS: HexCoord[] = [
	{ q: 1, r: 0 }, // East
	{ q: 1, r: -1 }, // Northeast
	{ q: 0, r: -1 }, // Northwest
	{ q: -1, r: 0 }, // West
	{ q: -1, r: 1 }, // Southwest
	{ q: 0, r: 1 }, // Southeast
];

// ============================================================================
// Standalone utility functions (orientation-independent)
// These are defined before the class so they can be used inside it
// ============================================================================

/**
 * Check if two vertices are approximately equal (within tolerance).
 */
export const verticesEqual = (v1: Point, v2: Point, tolerance: number = 0.01): boolean => {
	const dx = v1.x - v2.x;
	const dy = v1.y - v2.y;
	return dx * dx + dy * dy < tolerance * tolerance;
};

/**
 * Create a string key for a vertex (for use in Maps/Sets).
 */
export const vertexKey = (v: Point): string => {
	return `${Math.round(v.x * 100)},${Math.round(v.y * 100)}`;
};

/**
 * Find the closest vertex to a given point.
 */
export const findClosestVertex = (point: Point, vertices: Point[]): Point | null => {
	if (vertices.length === 0) return null;

	let closest: Point | null = null;
	let closestDistSq = Infinity;

	for (const vertex of vertices) {
		const dx = vertex.x - point.x;
		const dy = vertex.y - point.y;
		const distSq = dx * dx + dy * dy;
		if (distSq < closestDistSq) {
			closestDistSq = distSq;
			closest = vertex;
		}
	}

	return closest;
};

/**
 * Calculate the perpendicular distance from a point to a line.
 */
export const distanceToLine = (point: Point, line: Line): number => {
	const dx = line.end.x - line.start.x;
	const dy = line.end.y - line.start.y;
	const lengthSq = dx * dx + dy * dy;

	if (lengthSq === 0) {
		const pdx = point.x - line.start.x;
		const pdy = point.y - line.start.y;
		return Math.sqrt(pdx * pdx + pdy * pdy);
	}

	const t = ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) / lengthSq;
	const projX = line.start.x + t * dx;
	const projY = line.start.y + t * dy;

	const pdx = point.x - projX;
	const pdy = point.y - projY;
	return Math.sqrt(pdx * pdx + pdy * pdy);
};

/**
 * Calculate signed distance from point to line.
 * Positive = left of line, negative = right of line.
 */
export const signedDistanceToLine = (point: Point, line: Line): number => {
	const dx = line.end.x - line.start.x;
	const dy = line.end.y - line.start.y;
	const cross = (point.x - line.start.x) * dy - (point.y - line.start.y) * dx;
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length === 0) return 0;
	return cross / length;
};

/**
 * Configuration for the A* vertex path finding algorithm.
 */
export interface VertexPathConfig {
	/** Get all vertices adjacent to a given vertex (connected by edges). */
	getAdjacentVertices: (vertex: Point) => Point[];
	/** Check if a vertex is allowed in the path (optional filter). */
	isVertexAllowed?: (vertex: Point) => boolean;
}

/**
 * Generic A* pathfinding along vertices (hex edges or similar).
 * Finds a path that stays close to the straight line between start and end.
 *
 * @param start - Starting vertex
 * @param end - Ending vertex
 * @param config - Configuration with callbacks for getting neighbors and filtering vertices
 * @returns Array of vertices forming the path, or empty array if no path found
 */
export const findVertexPathAStar = (start: Point, end: Point, config: VertexPathConfig): Point[] => {
	const { getAdjacentVertices, isVertexAllowed } = config;

	if (verticesEqual(start, end)) {
		return [start];
	}

	const line: Line = { start, end };
	const startKey = vertexKey(start);
	const endKey = vertexKey(end);

	// A* search
	const queue: { vertex: Point; cost: number; signedDistSum: number }[] = [
		{ vertex: start, cost: 0, signedDistSum: 0 },
	];
	const visited = new Set<string>();
	const parent = new Map<string, Point>();
	const bestCost = new Map<string, number>([[startKey, 0]]);

	while (queue.length > 0) {
		// Find node with lowest cost
		let minIdx = 0;
		for (let i = 1; i < queue.length; i++) {
			const curr = queue[i]!;
			const min = queue[minIdx]!;
			if (
				curr.cost < min.cost ||
				(Math.abs(curr.cost - min.cost) < 0.01 && Math.abs(curr.signedDistSum) < Math.abs(min.signedDistSum))
			) {
				minIdx = i;
			}
		}

		const current = queue.splice(minIdx, 1)[0]!;
		const k = vertexKey(current.vertex);
		if (visited.has(k)) continue;
		visited.add(k);

		// Check if we reached the end
		if (k === endKey) {
			const path: Point[] = [];
			let curr: Point | undefined = current.vertex;
			while (curr) {
				path.unshift(curr);
				curr = parent.get(vertexKey(curr));
			}
			return path;
		}

		// Explore neighbors
		for (const next of getAdjacentVertices(current.vertex)) {
			const nextKey = vertexKey(next);
			if (visited.has(nextKey)) continue;
			if (isVertexAllowed && !isVertexAllowed(next)) continue;

			const newCost = current.cost + distanceToLine(next, line);
			const newSignedDistSum = current.signedDistSum + signedDistanceToLine(next, line);

			if (!bestCost.has(nextKey) || newCost < bestCost.get(nextKey)!) {
				bestCost.set(nextKey, newCost);
				parent.set(nextKey, current.vertex);
				queue.push({ vertex: next, cost: newCost, signedDistSum: newSignedDistSum });
			}
		}
	}

	return [];
};

// ============================================================================
// HexGrid class
// ============================================================================

/**
 * A hex grid with configurable size and orientation.
 *
 * All coordinate conversion and vertex calculations are performed
 * relative to this grid's configuration.
 */
export class HexGrid {
	readonly size: number;
	readonly orientation: HexOrientation;

	constructor(config: HexGridConfig) {
		this.size = config.size;
		this.orientation = config.orientation;
	}

	/**
	 * Convert axial hex coordinates to pixel coordinates (hex center).
	 */
	axialToPixel(hex: HexCoord): Point {
		if (this.orientation === HexOrientation.PointyTop) {
			// For pointy-top hexagons:
			// - Horizontal spacing between centers in same row = size
			// - Each row is offset by size/2
			// - Vertical spacing = size * sqrt(3) / 2
			const x = hex.q * this.size + hex.r * (this.size / 2);
			const y = hex.r * this.size * (SQRT3 / 2);
			return { x, y };
		} else {
			// For flat-top hexagons:
			// - Vertical spacing between centers in same column = size
			// - Each column is offset by size/2
			// - Horizontal spacing = size * sqrt(3) / 2
			const x = hex.q * this.size * (SQRT3 / 2);
			const y = hex.r * this.size + hex.q * (this.size / 2);
			return { x, y };
		}
	}

	/**
	 * Convert pixel coordinates to axial hex coordinates.
	 * This finds which hex contains the given pixel point.
	 */
	pixelToAxial(point: Point): HexCoord {
		if (this.orientation === HexOrientation.PointyTop) {
			// Inverse of axialToPixel for pointy-top
			const r = point.y / ((this.size * SQRT3) / 2);
			const q = (point.x - (r * this.size) / 2) / this.size;
			return this.roundAxial(q, r);
		} else {
			// Inverse of axialToPixel for flat-top
			const q = point.x / ((this.size * SQRT3) / 2);
			const r = (point.y - (q * this.size) / 2) / this.size;
			return this.roundAxial(q, r);
		}
	}

	/**
	 * Round fractional axial coordinates to the nearest hex.
	 * Uses the cube coordinate constraint (x + y + z = 0) for proper rounding.
	 */
	roundAxial(q: number, r: number): HexCoord {
		// Convert to cube coordinates
		const x = q;
		const z = r;
		const y = -x - z;

		// Round each component
		let rx = Math.round(x);
		let ry = Math.round(y);
		let rz = Math.round(z);

		// Fix rounding errors by adjusting the component with the largest diff
		const xDiff = Math.abs(rx - x);
		const yDiff = Math.abs(ry - y);
		const zDiff = Math.abs(rz - z);

		if (xDiff > yDiff && xDiff > zDiff) {
			rx = -ry - rz;
		} else if (yDiff > zDiff) {
			ry = -rx - rz;
		} else {
			rz = -rx - ry;
		}

		return { q: rx, r: rz };
	}

	/**
	 * Calculate the distance between two hexes in hex-steps.
	 */
	hexDistance(pos1: HexCoord, pos2: HexCoord): number {
		return (Math.abs(pos1.q - pos2.q) + Math.abs(pos1.q + pos1.r - pos2.q - pos2.r) + Math.abs(pos1.r - pos2.r)) / 2;
	}

	/**
	 * Find the shortest path between two hex positions (line of hexes).
	 */
	findHexPath(start: HexCoord, end: HexCoord): HexCoord[] {
		if (start.q === end.q && start.r === end.r) {
			return [start];
		}

		const axialToCube = (hex: HexCoord) => ({
			x: hex.q,
			y: -hex.q - hex.r,
			z: hex.r,
		});

		const cubeToAxial = (cube: { x: number; y: number; z: number }): HexCoord => ({
			q: cube.x,
			r: cube.z,
		});

		const cubeRound = (cube: { x: number; y: number; z: number }) => {
			let rx = Math.round(cube.x);
			let ry = Math.round(cube.y);
			let rz = Math.round(cube.z);

			const xDiff = Math.abs(rx - cube.x);
			const yDiff = Math.abs(ry - cube.y);
			const zDiff = Math.abs(rz - cube.z);

			if (xDiff > yDiff && xDiff > zDiff) {
				rx = -ry - rz;
			} else if (yDiff > zDiff) {
				ry = -rx - rz;
			} else {
				rz = -rx - ry;
			}

			return { x: rx, y: ry, z: rz };
		};

		const startCube = axialToCube(start);
		const endCube = axialToCube(end);
		const distance = this.hexDistance(start, end);

		const path: HexCoord[] = [];

		for (let i = 0; i <= distance; i++) {
			const t = distance === 0 ? 0 : i / distance;
			const cube = {
				x: startCube.x + (endCube.x - startCube.x) * t,
				y: startCube.y + (endCube.y - startCube.y) * t,
				z: startCube.z + (endCube.z - startCube.z) * t,
			};
			const rounded = cubeRound(cube);
			path.push(cubeToAxial(rounded));
		}

		return path;
	}

	/**
	 * Get the 6 vertices (corners) of a hex at the given axial coordinates.
	 *
	 * For pointy-top: vertices numbered 0-5 starting from TOP, going clockwise
	 * For flat-top: vertices numbered 0-5 starting from TOP-RIGHT, going clockwise
	 */
	getHexVertices(hex: HexCoord): Point[] {
		const center = this.axialToPixel(hex);
		// Radius from center to vertex
		const radius = this.size / SQRT3;

		const vertices: Point[] = [];

		// Starting angle depends on orientation
		// Pointy-top: first vertex at top (90°)
		// Flat-top: first vertex at top-right (30°)
		const startAngleDeg = this.orientation === HexOrientation.PointyTop ? 90 : 30;

		for (let i = 0; i < 6; i++) {
			// Going clockwise means decreasing angle
			const angleDeg = startAngleDeg - i * 60;
			const angleRad = (angleDeg * Math.PI) / 180;
			vertices.push({
				x: center.x + radius * Math.cos(angleRad),
				y: center.y - radius * Math.sin(angleRad), // Subtract because y-axis is flipped in screen coords
			});
		}

		return vertices;
	}

	/**
	 * Get all unique vertices for a set of hex coordinates.
	 */
	getAllVertices(hexCoords: HexCoord[]): Point[] {
		const vertexMap = new Map<string, Point>();

		for (const hex of hexCoords) {
			const vertices = this.getHexVertices(hex);
			for (const vertex of vertices) {
				const key = vertexKey(vertex);
				if (!vertexMap.has(key)) {
					vertexMap.set(key, vertex);
				}
			}
		}

		return Array.from(vertexMap.values());
	}

	/**
	 * Find the nearest vertex to a point, searching the local hex and its neighbors.
	 */
	findNearestVertex(point: Point): Point | null {
		const hex = this.pixelToAxial(point);
		const neighbors = this.getHexNeighbors(hex);
		const allHexes = [hex, ...neighbors];
		const allVertices = this.getAllVertices(allHexes);
		return findClosestVertex(point, allVertices);
	}

	/**
	 * Get the 6 neighboring hexes of a given hex.
	 */
	getHexNeighbors(hex: HexCoord): HexCoord[] {
		return AXIAL_DIRECTIONS.map(dir => ({
			q: hex.q + dir.q,
			r: hex.r + dir.r,
		}));
	}

	/**
	 * Get all vertices adjacent to a given vertex (connected by hex edges).
	 */
	getAdjacentVertices(vertex: Point): Point[] {
		const hex = this.pixelToAxial(vertex);
		const hexesToCheck = [hex, ...this.getHexNeighbors(hex)];

		let foundHex: HexCoord | null = null;
		let foundIndex = -1;

		for (const h of hexesToCheck) {
			const vertices = this.getHexVertices(h);
			for (let i = 0; i < vertices.length; i++) {
				if (verticesEqual(vertices[i]!, vertex)) {
					foundHex = h;
					foundIndex = i;
					break;
				}
			}
			if (foundHex) break;
		}

		if (!foundHex || foundIndex === -1) {
			return [];
		}

		const hexVertices = this.getHexVertices(foundHex);
		const adjacent: Point[] = [];

		// Adjacent vertices on the same hex (previous and next in the ring)
		const prev = hexVertices[(foundIndex + 5) % 6];
		const next = hexVertices[(foundIndex + 1) % 6];
		if (prev) adjacent.push(prev);
		if (next) adjacent.push(next);

		// Find the third adjacent vertex from neighboring hexes
		const neighbors = this.getHexNeighbors(foundHex);

		for (const neighborHex of neighbors) {
			const neighborVertices = this.getHexVertices(neighborHex);

			for (let j = 0; j < neighborVertices.length; j++) {
				const nv = neighborVertices[j]!;
				if (verticesEqual(nv, vertex)) {
					const prevOnNeighbor = neighborVertices[(j + 5) % 6]!;
					const nextOnNeighbor = neighborVertices[(j + 1) % 6]!;

					const isOnOriginal = (v: Point) => hexVertices.some(hv => verticesEqual(hv, v));

					if (!isOnOriginal(prevOnNeighbor)) {
						adjacent.push(prevOnNeighbor);
					}
					if (!isOnOriginal(nextOnNeighbor)) {
						adjacent.push(nextOnNeighbor);
					}
					break;
				}
			}
		}

		return adjacent;
	}

	/**
	 * Get all hexes that a straight line passes through.
	 */
	getHexesAlongLine(start: Point, end: Point): Set<string> {
		const hexes = new Set<string>();
		const hexKeyFn = (h: HexCoord) => `${h.q},${h.r}`;

		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const steps = Math.max(Math.ceil(distance / 2), 1);

		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const point = {
				x: start.x + dx * t,
				y: start.y + dy * t,
			};
			const hex = this.pixelToAxial(point);
			hexes.add(hexKeyFn(hex));
		}

		return hexes;
	}

	/**
	 * Find the shortest path along hex edges from one vertex to another.
	 */
	findVertexPath(start: Point, end: Point): Point[] {
		const allowedHexKeys = this.getHexesAlongLine(start, end);

		const startHex = this.pixelToAxial(start);
		const endHex = this.pixelToAxial(end);
		const allStartHexes = [startHex, ...this.getHexNeighbors(startHex)];
		const allEndHexes = [endHex, ...this.getHexNeighbors(endHex)];

		for (const h of [...allStartHexes, ...allEndHexes]) {
			allowedHexKeys.add(`${h.q},${h.r}`);
		}

		const allowedVertexKeys = new Set<string>();
		for (const hexKeyStr of allowedHexKeys) {
			const [q, r] = hexKeyStr.split(',').map(Number);
			if (q !== undefined && r !== undefined) {
				const hex = { q, r };
				const vertices = this.getHexVertices(hex);
				for (const v of vertices) {
					allowedVertexKeys.add(vertexKey(v));
				}
			}
		}

		return findVertexPathAStar(start, end, {
			getAdjacentVertices: v => this.getAdjacentVertices(v),
			isVertexAllowed: v => allowedVertexKeys.has(vertexKey(v)),
		});
	}

	/**
	 * Get all hexes within a certain range of a center hex.
	 */
	getHexesInRange(center: HexCoord, range: number): HexCoord[] {
		const hexes: HexCoord[] = [];
		for (let q = -range; q <= range; q++) {
			for (let r = -range; r <= range; r++) {
				if (Math.abs(q + r) <= range) {
					hexes.push({
						q: center.q + q,
						r: center.r + r,
					});
				}
			}
		}
		return hexes;
	}

	/**
	 * Compute boundary edges for a set of hexes.
	 */
	computeBoundaries(hexes: HexCoord[], offset: HexCoord): Line[] {
		const hexSet = new Set(hexes.map(h => `${h.q + offset.q},${h.r + offset.r}`));

		// Edge to neighbor mapping (same for both orientations in axial coords)
		const edgeToNeighborIndex = [1, 0, 5, 4, 3, 2];

		const boundaryEdges: Line[] = [];
		for (const hex of hexes) {
			const adjustedHex = { q: hex.q + offset.q, r: hex.r + offset.r };
			const vertices = this.getHexVertices(adjustedHex);
			const neighbors = this.getHexNeighbors(adjustedHex);

			for (let i = 0; i < 6; i++) {
				const neighborIndex = edgeToNeighborIndex[i]!;
				const neighbor = neighbors[neighborIndex]!;
				const neighborKey = `${neighbor.q},${neighbor.r}`;
				if (!hexSet.has(neighborKey)) {
					const start = vertices[i]!;
					const end = vertices[(i + 1) % 6]!;
					boundaryEdges.push({ start, end });
				}
			}
		}
		return boundaryEdges;
	}

	/**
	 * Check if a hex position is within the grid bounds.
	 */
	isHexInBounds({ q, r }: HexCoord, { width, height }: Dimensions): boolean {
		if (r < -height || r > height) {
			return false;
		}

		const qOffset = Math.floor(r / 2);
		const minQ = -width - qOffset;
		const maxQ = width - qOffset;

		return q >= minQ && q <= maxQ;
	}
}
