export const findClosestVertex = (
	point: PIXI.IPointData,
	vertices: { x: number; y: number }[],
): { x: number; y: number } | null => {
	let closestVertex: { x: number; y: number } | null = null;
	let closestDist = Infinity;

	for (const vertex of vertices) {
		const dx = vertex.x - point.x;
		const dy = vertex.y - point.y;
		const dist = dx * dx + dy * dy;
		if (dist < closestDist) {
			closestDist = dist;
			closestVertex = vertex;
		}
	}

	return closestVertex;
};

export const getHexVertices = (point: PIXI.IPointData): { x: number; y: number }[] => {
	const grid = canvas?.grid;
	if (!grid) {
		return [];
	}

	const offset = grid.getOffset({ x: point.x, y: point.y });
	const center = grid.getCenterPoint({ i: offset.i, j: offset.j });
	if (!center) {
		return [];
	}

	// Get the 6 neighboring hex centers using the correct API
	const neighborOffsets = grid.getAdjacentOffsets(offset);
	const neighbors: { x: number; y: number; angle: number }[] = [];

	for (const neighborOffset of neighborOffsets) {
		const neighborCenter = grid.getCenterPoint(neighborOffset);
		if (neighborCenter) {
			// Calculate angle from center to this neighbor
			const dx = neighborCenter.x - center.x;
			const dy = neighborCenter.y - center.y;
			const angle = Math.atan2(dy, dx);
			neighbors.push({ x: neighborCenter.x, y: neighborCenter.y, angle });
		}
	}

	if (neighbors.length !== 6) {
		console.warn('Got wrong number of neighbors:', neighbors.length);
		return [];
	}

	// Sort neighbors by angle to get them in clockwise order
	neighbors.sort((a, b) => a.angle - b.angle);

	// Each vertex is the average of the center and two adjacent neighbors (in sorted order)
	const vertices: { x: number; y: number }[] = [];
	for (let i = 0; i < 6; i++) {
		const n1 = neighbors[i];
		const n2 = neighbors[(i + 1) % 6];
		if (n1 && n2) {
			vertices.push({
				x: (center.x + n1.x + n2.x) / 3,
				y: (center.y + n1.y + n2.y) / 3,
			});
		}
	}

	return vertices;
};

export const getAdjacentVertices = (vertex: { x: number; y: number }): { x: number; y: number }[] => {
	const grid = canvas?.grid;
	if (!grid) {
		return [];
	}

	// Find which hex and which vertex index this point corresponds to
	// by checking all nearby hexes
	const offset = grid.getOffset(vertex);
	const hexesToCheck = [offset, ...grid.getAdjacentOffsets(offset)];

	let foundHex: { i: number; j: number } | null = null;
	let foundVertexIndex = -1;

	// Find which hex this vertex belongs to
	for (const hexOffset of hexesToCheck) {
		const hexVertices = getHexVertices(grid.getCenterPoint(hexOffset) || { x: 0, y: 0 });
		for (let i = 0; i < hexVertices.length; i++) {
			const v = hexVertices[i];
			if (v) {
				const dx = v.x - vertex.x;
				const dy = v.y - vertex.y;
				if (dx * dx + dy * dy < 0.1) {
					// Very close match
					foundHex = hexOffset;
					foundVertexIndex = i;
					break;
				}
			}
		}
		if (foundHex) break;
	}

	if (!foundHex || foundVertexIndex === -1) {
		return [];
	}

	// Get the hex vertices
	const hexCenter = grid.getCenterPoint(foundHex);
	if (!hexCenter) {
		return [];
	}

	const hexVertices = getHexVertices(hexCenter);
	if (hexVertices.length === 0) {
		return [];
	}

	// A vertex has exactly 3 adjacent vertices:
	// 1. Previous vertex on the same hex (counterclockwise)
	// 2. Next vertex on the same hex (clockwise)
	// 3. The vertex on the adjacent hex across the shared edge

	const adjacent: { x: number; y: number }[] = [];

	// Adjacent vertex 1: previous on same hex
	const prev = hexVertices[(foundVertexIndex + 5) % 6];
	if (prev) {
		adjacent.push(prev);
	}

	// Adjacent vertex 2: next on same hex
	const next = hexVertices[(foundVertexIndex + 1) % 6];
	if (next) {
		adjacent.push(next);
	}

	// Adjacent vertex 3 & 4: across the edges to the 2 neighbor hexes
	// A vertex is shared by exactly 3 hexes. We know one (foundHex).
	// Find the other 2 by checking all neighbors
	const neighborOffsets = grid.getAdjacentOffsets(foundHex);

	for (const neighborOffset of neighborOffsets) {
		// Skip if this is the same hex
		if (neighborOffset.i === foundHex.i && neighborOffset.j === foundHex.j) {
			continue;
		}

		const neighborCenter = grid.getCenterPoint(neighborOffset);
		if (neighborCenter) {
			const neighborVertices = getHexVertices(neighborCenter);
			// Check each vertex of the neighbor to see if it matches our vertex
			for (let j = 0; j < neighborVertices.length; j++) {
				const neighborVertex = neighborVertices[j];
				if (neighborVertex) {
					const dx = neighborVertex.x - vertex.x;
					const dy = neighborVertex.y - vertex.y;
					if (dx * dx + dy * dy < 0.1) {
						// Very close match
						// Found a neighbor hex that shares this vertex!
						// Now find the "opposite" vertex on that hex relative to our shared vertex
						// The adjacent vertex is the one that's NOT on the edge we came from
						// We want the vertices adjacent to j on the neighbor hex
						const prevOnNeighbor = neighborVertices[(j + 5) % 6];
						const nextOnNeighbor = neighborVertices[(j + 1) % 6];

						// Check which one is NOT already in our adjacent list (i.e., not on original hex)
						if (prevOnNeighbor) {
							const isPrevOnOriginalHex = hexVertices.some(v => {
								if (!v) return false;
								const dx2 = v.x - prevOnNeighbor.x;
								const dy2 = v.y - prevOnNeighbor.y;
								return dx2 * dx2 + dy2 * dy2 < 0.1;
							});
							if (!isPrevOnOriginalHex) {
								adjacent.push(prevOnNeighbor);
							}
						}

						if (nextOnNeighbor) {
							const isNextOnOriginalHex = hexVertices.some(v => {
								if (!v) return false;
								const dx2 = v.x - nextOnNeighbor.x;
								const dy2 = v.y - nextOnNeighbor.y;
								return dx2 * dx2 + dy2 * dy2 < 0.1;
							});
							if (!isNextOnOriginalHex) {
								adjacent.push(nextOnNeighbor);
							}
						}
						break;
					}
				}
			}
		}
	}

	return adjacent;
};

export const getHexesAlongLine = (start: { x: number; y: number }, end: { x: number; y: number }): Set<string> => {
	const grid = canvas?.grid;
	if (!grid) {
		return new Set();
	}

	const hexes = new Set<string>();
	const hexKey = (offset: { i: number; j: number }) => `${offset.i},${offset.j}`;

	// Sample points along the line - much denser sampling to not miss any hexes
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const steps = Math.ceil(distance / 2); // Sample every 2 pixels to ensure we catch all hexes

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = start.x + dx * t;
		const y = start.y + dy * t;
		const offset = grid.getOffset({ x, y });
		hexes.add(hexKey(offset));
	}

	return hexes;
};

export const distanceToLine = (
	point: { x: number; y: number },
	lineStart: { x: number; y: number },
	lineEnd: { x: number; y: number },
): number => {
	// Calculate perpendicular distance from point to line
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const lengthSq = dx * dx + dy * dy;

	if (lengthSq === 0) {
		// Line start and end are the same point
		const pdx = point.x - lineStart.x;
		const pdy = point.y - lineStart.y;
		return Math.sqrt(pdx * pdx + pdy * pdy);
	}

	// Project point onto line
	const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
	const projX = lineStart.x + t * dx;
	const projY = lineStart.y + t * dy;

	const pdx = point.x - projX;
	const pdy = point.y - projY;
	return Math.sqrt(pdx * pdx + pdy * pdy);
};

export const signedDistanceToLine = (
	point: { x: number; y: number },
	lineStart: { x: number; y: number },
	lineEnd: { x: number; y: number },
): number => {
	// Calculate signed distance using cross product
	// Positive = left of line (or above for horizontal), negative = right of line (or below)
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const cross = (point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx;
	const length = Math.sqrt(dx * dx + dy * dy);
	return cross / length;
};

export const findVertexPath = (
	start: { x: number; y: number },
	end: { x: number; y: number },
): { x: number; y: number }[] => {
	const grid = canvas?.grid;
	if (!grid) {
		return [];
	}

	// Get all hexes along the straight line
	const allowedHexes = getHexesAlongLine(start, end);
	const hexKey = (offset: { i: number; j: number }) => `${offset.i},${offset.j}`;
	const vertexKey = (v: { x: number; y: number }) => `${Math.round(v.x)},${Math.round(v.y)}`;

	// Find all hexes that contain the start vertex
	const startOffset = grid.getOffset(start);
	const startHexesToCheck = [startOffset, ...grid.getAdjacentOffsets(startOffset)];
	for (const hexOffset of startHexesToCheck) {
		const hexCenter = grid.getCenterPoint(hexOffset);
		if (hexCenter) {
			const hexVertices = getHexVertices(hexCenter);
			for (const vertex of hexVertices) {
				const dx = vertex.x - start.x;
				const dy = vertex.y - start.y;
				if (dx * dx + dy * dy < 0.1) {
					// This hex contains the start vertex
					allowedHexes.add(hexKey(hexOffset));
					break;
				}
			}
		}
	}

	// Find all hexes that contain the end vertex
	const endOffset = grid.getOffset(end);
	const endHexesToCheck = [endOffset, ...grid.getAdjacentOffsets(endOffset)];
	for (const hexOffset of endHexesToCheck) {
		const hexCenter = grid.getCenterPoint(hexOffset);
		if (hexCenter) {
			const hexVertices = getHexVertices(hexCenter);
			for (const vertex of hexVertices) {
				const dx = vertex.x - end.x;
				const dy = vertex.y - end.y;
				if (dx * dx + dy * dy < 0.1) {
					// This hex contains the end vertex
					allowedHexes.add(hexKey(hexOffset));
					break;
				}
			}
		}
	}

	// Collect all vertices on allowed hexes
	const allowedVertices = new Set<string>();

	for (const hexKeyStr of allowedHexes) {
		const parts = hexKeyStr.split(',').map(Number);
		const i = parts[0];
		const j = parts[1];
		if (i !== undefined && j !== undefined) {
			const center = grid.getCenterPoint({ i, j });
			if (center) {
				const vertices = getHexVertices(center);
				for (const vertex of vertices) {
					allowedVertices.add(vertexKey(vertex));
				}
			}
		}
	}

	// A* search - track cumulative distance to line for each path
	interface PathNode {
		vertex: { x: number; y: number };
		cost: number; // Cumulative sum of distances to line
		signedDistSum: number; // Sum of signed distances (for alternating behavior)
		pathLength: number; // Number of vertices in path
	}

	const queue: PathNode[] = [{ vertex: start, cost: 0, signedDistSum: 0, pathLength: 1 }];
	const visited = new Set<string>();
	const parent = new Map<string, { x: number; y: number }>();
	const bestCost = new Map<string, number>();

	bestCost.set(vertexKey(start), 0);

	while (queue.length > 0) {
		// Find node with lowest cost (primary: total distance, secondary: alternating)
		let minIdx = 0;
		for (let i = 1; i < queue.length; i++) {
			const curr = queue[i]!;
			const min = queue[minIdx]!;

			// Primary: minimize cumulative distance to line
			if (curr.cost < min.cost) {
				minIdx = i;
			} else if (Math.abs(curr.cost - min.cost) < 0.01) {
				// Secondary: minimize absolute sum of signed distances (prefer alternating)
				if (Math.abs(curr.signedDistSum) < Math.abs(min.signedDistSum)) {
					minIdx = i;
				}
			}
		}

		const current = queue.splice(minIdx, 1)[0];
		if (!current) break;

		const { vertex, cost: cumulativeCost, signedDistSum, pathLength } = current;
		const k = vertexKey(vertex);

		// Skip if already visited
		if (visited.has(k)) {
			continue;
		}
		visited.add(k);

		// Check if we reached the end
		const dx = vertex.x - end.x;
		const dy = vertex.y - end.y;
		if (dx * dx + dy * dy < 0.1) {
			// Reconstruct path
			const path: { x: number; y: number }[] = [];
			let curr: { x: number; y: number } | undefined = vertex;
			while (curr) {
				path.unshift(curr);
				curr = parent.get(vertexKey(curr));
			}
			return path;
		}

		// Explore adjacent vertices, but only if they're on allowed hexes
		const adjacent = getAdjacentVertices(vertex);
		for (const next of adjacent) {
			const nextKey = vertexKey(next);

			if (!allowedVertices.has(nextKey) || visited.has(nextKey)) {
				continue;
			}

			// Calculate cumulative cost: sum of all distances to line
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

	// No path found
	console.warn('No path found between vertices');
	return [];
};
