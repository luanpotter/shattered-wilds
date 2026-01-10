/**
 * Hex grid math utilities for pointy-top hexagons.
 *
 * This module provides coordinate conversion, vertex computation, and pathfinding
 * functions for hex grids.
 *
 * Coordinate systems:
 * - Axial coordinates (q, r): Standard hex grid coordinates
 * - Pixel coordinates (x, y): Cartesian coordinates
 * - Hex vertices: Points at the corners of hexagons
 *
 * For pointy-top hexagons with radius R:
 * - Horizontal spacing: 2R (center to center horizontally within same row offset)
 * - Vertical spacing: R * sqrt(3) (center to center vertically)
 * - Each hex has 6 vertices, numbered 0-5 starting from the top and going clockwise
 */

import { Dimensions, Point } from './geom.js';

// ============================================================================
// Types
// ============================================================================

/** Axial hex coordinates */
export interface HexCoord {
	q: number;
	r: number;
}

// ============================================================================
// Constants
// ============================================================================

/** The mathematical constant sqrt(3), used extensively in hex calculations */
const SQRT3 = Math.sqrt(3);

// ============================================================================
// Coordinate Conversions
// ============================================================================

/**
 * Convert axial hex coordinates to pixel coordinates (hex center).
 *
 * For a pointy-top hex with radius R:
 * - x = R * (3/2 * q)... wait, that's for flat-top
 * - For pointy-top: x = R * sqrt(3) * (q + r/2), y = R * 3/2 * r
 *
 * But we can use a simpler formula with a "size" parameter that represents
 * the horizontal spacing between adjacent hex centers in the same row.
 *
 * @param q - Axial q coordinate
 * @param r - Axial r coordinate
 * @param hexSize - The "width" of a hex (horizontal spacing). Default 10.
 * @returns Pixel coordinates of the hex center
 */
export const axialToPixel = (hex: HexCoord, hexSize: number = 10): Point => {
	// For pointy-top hexagons:
	// - Horizontal spacing between centers in same row = hexSize
	// - Each row is offset by hexSize/2
	// - Vertical spacing = hexSize * sqrt(3) / 2
	const x = hex.q * hexSize + hex.r * (hexSize / 2);
	const y = hex.r * hexSize * (SQRT3 / 2);
	return { x, y };
};

/**
 * Convert pixel coordinates to axial hex coordinates.
 * This finds which hex contains the given pixel point.
 *
 * @param x - Pixel x coordinate
 * @param y - Pixel y coordinate
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Axial coordinates of the containing hex (rounded)
 */
export const pixelToAxial = (point: Point, hexSize: number = 10): HexCoord => {
	// Inverse of axialToPixel
	// y = r * hexSize * sqrt(3) / 2  =>  r = y / (hexSize * sqrt(3) / 2)
	// x = q * hexSize + r * hexSize / 2  =>  q = (x - r * hexSize / 2) / hexSize
	const r = point.y / ((hexSize * SQRT3) / 2);
	const q = (point.x - (r * hexSize) / 2) / hexSize;

	// Round to nearest hex using cube coordinate rounding
	return roundAxial(q, r);
};

/**
 * Round fractional axial coordinates to the nearest hex.
 * Uses the cube coordinate constraint (x + y + z = 0) for proper rounding.
 */
export const roundAxial = (q: number, r: number): HexCoord => {
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
};

/**
 * Calculate the distance between two hexes in hex-steps.
 * This is the minimum number of hex moves to get from one hex to another.
 *
 * @param pos1 - First hex position
 * @param pos2 - Second hex position
 * @returns The hex distance (number of hex steps)
 */
export const hexDistance = (pos1: HexCoord, pos2: HexCoord): number => {
	// Using the cube coordinate distance formula
	// distance = (|x1-x2| + |y1-y2| + |z1-z2|) / 2
	// where y = -q - r
	return (Math.abs(pos1.q - pos2.q) + Math.abs(pos1.q + pos1.r - pos2.q - pos2.r) + Math.abs(pos1.r - pos2.r)) / 2;
};

/**
 * Find the shortest path between two hex positions (line of hexes).
 * Uses cube coordinate line-drawing algorithm.
 *
 * @param start - Starting hex position
 * @param end - Ending hex position
 * @returns Array of hex positions along the path
 */
export const findHexPath = (start: HexCoord, end: HexCoord): HexCoord[] => {
	// If same position, return single hex
	if (start.q === end.q && start.r === end.r) {
		return [start];
	}

	// Convert axial to cube coordinates for line algorithm
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
	const distance = hexDistance(start, end);

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
};

// ============================================================================
// Hex Vertex Functions
// ============================================================================

/**
 * Get the 6 vertices (corners) of a hex at the given axial coordinates.
 *
 * For a pointy-top hex, vertices are numbered 0-5 starting from the TOP
 * and going CLOCKWISE:
 *   0: top
 *   1: top-right
 *   2: bottom-right
 *   3: bottom
 *   4: bottom-left
 *   5: top-left
 *
 * @param q - Axial q coordinate
 * @param r - Axial r coordinate
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Array of 6 vertex positions
 */
export const getHexVertices = (hex: HexCoord, hexSize: number = 10): Point[] => {
	const center = axialToPixel(hex, hexSize);
	const radius = hexSize / SQRT3; // Radius to vertices for pointy-top hex

	const vertices: Point[] = [];
	for (let i = 0; i < 6; i++) {
		// For pointy-top, vertex 0 is at the top (90 degrees in standard math coords)
		// Going clockwise means decreasing angle
		const angleDeg = 90 - i * 60;
		const angleRad = (angleDeg * Math.PI) / 180;
		vertices.push({
			x: center.x + radius * Math.cos(angleRad),
			y: center.y - radius * Math.sin(angleRad), // Subtract because y-axis is flipped in screen coords
		});
	}

	return vertices;
};

/**
 * Get all unique vertices in the hex grid within a certain range.
 * Each vertex is shared by exactly 3 hexes.
 *
 * @param hexCoords - Array of hex coordinates to get vertices for
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Array of unique vertices
 */
export const getAllVertices = (hexCoords: HexCoord[], hexSize: number = 10): Point[] => {
	const vertexMap = new Map<string, Point>();
	const keyFn = (v: Point) => `${Math.round(v.x * 100)},${Math.round(v.y * 100)}`;

	for (const hex of hexCoords) {
		const vertices = getHexVertices(hex, hexSize);
		for (const vertex of vertices) {
			const key = keyFn(vertex);
			if (!vertexMap.has(key)) {
				vertexMap.set(key, vertex);
			}
		}
	}

	return Array.from(vertexMap.values());
};

/**
 * Find the closest vertex to a given point.
 *
 * @param point - The point to find the nearest vertex to
 * @param vertices - Array of vertices to search
 * @returns The closest vertex, or null if array is empty
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
 * Find the nearest vertex to a point, searching the local hex and its neighbors.
 *
 * @param point - The point to find the nearest vertex to
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns The closest vertex
 */
export const findNearestVertex = (point: Point, hexSize: number = 10): Point | null => {
	const hex = pixelToAxial(point, hexSize);
	const neighbors = getHexNeighbors(hex);
	const allHexes = [hex, ...neighbors];
	const allVertices = getAllVertices(allHexes, hexSize);
	return findClosestVertex(point, allVertices);
};

// ============================================================================
// Hex Neighbor Functions
// ============================================================================

/** Direction vectors for the 6 neighbors of a hex (axial coordinates) */
const AXIAL_DIRECTIONS: HexCoord[] = [
	{ q: 1, r: 0 }, // East
	{ q: 1, r: -1 }, // Northeast
	{ q: 0, r: -1 }, // Northwest
	{ q: -1, r: 0 }, // West
	{ q: -1, r: 1 }, // Southwest
	{ q: 0, r: 1 }, // Southeast
];

/**
 * Get the 6 neighboring hexes of a given hex.
 */
export const getHexNeighbors = (hex: HexCoord): HexCoord[] => {
	return AXIAL_DIRECTIONS.map(dir => ({
		q: hex.q + dir.q,
		r: hex.r + dir.r,
	}));
};

// ============================================================================
// Vertex Adjacency (for pathfinding along hex edges)
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
 * Get all vertices adjacent to a given vertex (connected by hex edges).
 *
 * Each vertex in a hex grid is adjacent to exactly 3 other vertices:
 * - Two vertices on the same hex (connected by edges of that hex)
 * - One vertex from a neighboring hex (across the shared edge)
 *
 * @param vertex - The vertex to find adjacents for
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Array of adjacent vertices
 */
export const getAdjacentVertices = (vertex: Point, hexSize: number = 10): Point[] => {
	// Find which hex this vertex belongs to
	const hex = pixelToAxial(vertex, hexSize);
	const hexesToCheck = [hex, ...getHexNeighbors(hex)];

	// Find the exact hex and vertex index
	let foundHex: HexCoord | null = null;
	let foundIndex = -1;

	for (const h of hexesToCheck) {
		const vertices = getHexVertices(h, hexSize);
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

	const hexVertices = getHexVertices(foundHex, hexSize);
	const adjacent: Point[] = [];

	// Adjacent vertices on the same hex (previous and next in the ring)
	const prev = hexVertices[(foundIndex + 5) % 6];
	const next = hexVertices[(foundIndex + 1) % 6];
	if (prev) adjacent.push(prev);
	if (next) adjacent.push(next);

	// Find the third adjacent vertex from neighboring hexes
	// A vertex is shared by exactly 3 hexes
	const neighbors = getHexNeighbors(foundHex);

	for (const neighborHex of neighbors) {
		const neighborVertices = getHexVertices(neighborHex, hexSize);

		// Find if this neighbor shares the vertex
		for (let j = 0; j < neighborVertices.length; j++) {
			const nv = neighborVertices[j]!;
			if (verticesEqual(nv, vertex)) {
				// This neighbor shares the vertex - get its adjacent vertices
				const prevOnNeighbor = neighborVertices[(j + 5) % 6]!;
				const nextOnNeighbor = neighborVertices[(j + 1) % 6]!;

				// Add vertices that aren't on the original hex
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
};

// ============================================================================
// Line-to-Point Distance Functions
// ============================================================================

/**
 * Calculate the perpendicular distance from a point to a line segment.
 */
export const distanceToLine = (point: Point, lineStart: Point, lineEnd: Point): number => {
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const lengthSq = dx * dx + dy * dy;

	if (lengthSq === 0) {
		// Line start and end are the same point
		const pdx = point.x - lineStart.x;
		const pdy = point.y - lineStart.y;
		return Math.sqrt(pdx * pdx + pdy * pdy);
	}

	// Project point onto line (unclamped to allow extrapolation)
	const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
	const projX = lineStart.x + t * dx;
	const projY = lineStart.y + t * dy;

	const pdx = point.x - projX;
	const pdy = point.y - projY;
	return Math.sqrt(pdx * pdx + pdy * pdy);
};

/**
 * Calculate signed distance from point to line.
 * Positive = left of line, negative = right of line.
 */
export const signedDistanceToLine = (point: Point, lineStart: Point, lineEnd: Point): number => {
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const cross = (point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx;
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length === 0) return 0;
	return cross / length;
};

// ============================================================================
// Pathfinding Along Hex Edges
// ============================================================================

/**
 * Get all hexes that a straight line passes through.
 * Used to constrain vertex path finding to hexes near the desired line.
 *
 * @param start - Start point of the line
 * @param end - End point of the line
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Set of hex coordinate keys ("q,r")
 */
export const getHexesAlongLine = (start: Point, end: Point, hexSize: number = 10): Set<string> => {
	const hexes = new Set<string>();
	const hexKey = (h: HexCoord) => `${h.q},${h.r}`;

	// Sample points along the line densely to ensure we catch all hexes
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const steps = Math.max(Math.ceil(distance / 2), 1); // Sample every ~2 pixels

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const point = {
			x: start.x + dx * t,
			y: start.y + dy * t,
		};
		const hex = pixelToAxial(point, hexSize);
		hexes.add(hexKey(hex));
	}

	return hexes;
};

/**
 * Find the shortest path along hex edges from one vertex to another.
 *
 * This uses A* search to find a path that:
 * 1. Only uses hex edges (never cuts through hexes)
 * 2. Stays as close to the straight line as possible
 * 3. Alternates sides of the line when possible for aesthetic purposes
 *
 * CRITICAL: This ensures no line segment crosses through a hexagon.
 * All vertices in the returned path are connected by hex edges.
 *
 * @param start - Starting vertex
 * @param end - Ending vertex
 * @param hexSize - The "width" of a hex. Default 10.
 * @returns Array of vertices forming the path, or empty if no path found
 */
export const findVertexPath = (start: Point, end: Point, hexSize: number = 10): Point[] => {
	// Quick check for same vertex
	if (verticesEqual(start, end)) {
		return [start];
	}

	// Get all hexes along the straight line
	const allowedHexKeys = getHexesAlongLine(start, end, hexSize);

	// Also add hexes that contain the start and end vertices
	const startHex = pixelToAxial(start, hexSize);
	const endHex = pixelToAxial(end, hexSize);
	const allStartHexes = [startHex, ...getHexNeighbors(startHex)];
	const allEndHexes = [endHex, ...getHexNeighbors(endHex)];

	for (const h of [...allStartHexes, ...allEndHexes]) {
		allowedHexKeys.add(`${h.q},${h.r}`);
	}

	// Collect all vertices on allowed hexes
	const allowedVertexKeys = new Set<string>();
	for (const hexKeyStr of allowedHexKeys) {
		const [q, r] = hexKeyStr.split(',').map(Number);
		if (q !== undefined && r !== undefined) {
			const hex = { q, r };
			const vertices = getHexVertices(hex, hexSize);
			for (const v of vertices) {
				allowedVertexKeys.add(vertexKey(v));
			}
		}
	}

	// A* search
	interface PathNode {
		vertex: Point;
		cost: number; // Cumulative distance to line
		signedDistSum: number; // For alternating preference
		pathLength: number;
	}

	const queue: PathNode[] = [
		{
			vertex: start,
			cost: 0,
			signedDistSum: 0,
			pathLength: 1,
		},
	];

	const visited = new Set<string>();
	const parent = new Map<string, Point>();
	const bestCost = new Map<string, number>();

	bestCost.set(vertexKey(start), 0);

	while (queue.length > 0) {
		// Find node with lowest cost
		let minIdx = 0;
		for (let i = 1; i < queue.length; i++) {
			const curr = queue[i]!;
			const min = queue[minIdx]!;

			// Primary: minimize cumulative distance to line
			if (curr.cost < min.cost) {
				minIdx = i;
			} else if (Math.abs(curr.cost - min.cost) < 0.01) {
				// Secondary: prefer alternating sides (minimize absolute signed sum)
				if (Math.abs(curr.signedDistSum) < Math.abs(min.signedDistSum)) {
					minIdx = i;
				}
			}
		}

		const current = queue.splice(minIdx, 1)[0];
		if (!current) break;

		const { vertex, cost: cumulativeCost, signedDistSum, pathLength } = current;
		const k = vertexKey(vertex);

		if (visited.has(k)) continue;
		visited.add(k);

		// Check if we reached the end
		if (verticesEqual(vertex, end)) {
			// Reconstruct path
			const path: Point[] = [];
			let curr: Point | undefined = vertex;
			while (curr) {
				path.unshift(curr);
				curr = parent.get(vertexKey(curr));
			}
			return path;
		}

		// Explore adjacent vertices
		const adjacent = getAdjacentVertices(vertex, hexSize);
		for (const next of adjacent) {
			const nextKey = vertexKey(next);

			if (!allowedVertexKeys.has(nextKey) || visited.has(nextKey)) {
				continue;
			}

			// Calculate costs
			const nextDistToLine = distanceToLine(next, start, end);
			const nextSignedDist = signedDistanceToLine(next, start, end);
			const newCumulativeCost = cumulativeCost + nextDistToLine;
			const newSignedDistSum = signedDistSum + nextSignedDist;
			const newPathLength = pathLength + 1;

			const existingCost = bestCost.get(nextKey);
			if (existingCost === undefined || newCumulativeCost < existingCost) {
				bestCost.set(nextKey, newCumulativeCost);
				parent.set(nextKey, vertex);
				queue.push({
					vertex: next,
					cost: newCumulativeCost,
					signedDistSum: newSignedDistSum,
					pathLength: newPathLength,
				});
			}
		}
	}

	// No path found - return empty array
	console.error('No vertex path found between', start, 'and', end);
	return [];
};

export const pointToSegmentDistance = (p: Point, a: Point, b: Point): number => {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) {
		return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
	}
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
	const projX = a.x + t * dx;
	const projY = a.y + t * dy;
	return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
};

export const getHexesInRange = (center: HexCoord, range: number): HexCoord[] => {
	const hexes: HexCoord[] = [];
	for (let q = -range; q <= range; q++) {
		for (let r = -range; r <= range; r++) {
			// Check if this hex is within range
			if (Math.abs(q + r) <= range) {
				hexes.push({
					q: center.q + q,
					r: center.r + r,
				});
			}
		}
	}
	return hexes;
};

export const computeBoundaries = (
	hexes: HexCoord[],
	offset: HexCoord,
): { x1: number; y1: number; x2: number; y2: number }[] => {
	// Create a set of hex keys for quick lookup
	const hexSet = new Set(hexes.map(h => `${h.q + offset.q},${h.r + offset.r}`));

	// Edge index to neighbor index mapping for pointy-top hex:
	// Edge 0 (v0→v1, top→top-right) borders Northeast neighbor (index 1)
	// Edge 1 (v1→v2, top-right→bottom-right) borders East neighbor (index 0)
	// Edge 2 (v2→v3, bottom-right→bottom) borders Southeast neighbor (index 5)
	// Edge 3 (v3→v4, bottom→bottom-left) borders Southwest neighbor (index 4)
	// Edge 4 (v4→v5, bottom-left→top-left) borders West neighbor (index 3)
	// Edge 5 (v5→v0, top-left→top) borders Northwest neighbor (index 2)
	const edgeToNeighborIndex = [1, 0, 5, 4, 3, 2];

	// Collect all boundary edges
	const boundaryEdges: { x1: number; y1: number; x2: number; y2: number }[] = [];
	for (const hex of hexes) {
		const adjustedHex = { q: hex.q + offset.q, r: hex.r + offset.r };
		const vertices = getHexVertices(adjustedHex, 10);
		const neighbors = getHexNeighbors(adjustedHex);

		// For each edge (6 edges)
		for (let i = 0; i < 6; i++) {
			const neighborIndex = edgeToNeighborIndex[i]!;
			const neighbor = neighbors[neighborIndex]!;
			const neighborKey = `${neighbor.q},${neighbor.r}`;
			// Only draw this edge if neighbor is NOT in the area
			if (!hexSet.has(neighborKey)) {
				const v1 = vertices[i]!;
				const v2 = vertices[(i + 1) % 6]!;
				boundaryEdges.push({ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y });
			}
		}
	}
	return boundaryEdges;
};

// Check if a hex position is within the grid bounds
export const isHexInBounds = ({ q, r }: HexCoord, { width, height }: Dimensions): boolean => {
	// Check vertical bounds
	if (r < -height || r > height) {
		return false;
	}

	// Calculate the q range for this row (same logic as generateHexes)
	const qOffset = Math.floor(r / 2);
	const minQ = -width - qOffset;
	const maxQ = width - qOffset;

	return q >= minQ && q <= maxQ;
};
