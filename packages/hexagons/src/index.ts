import { FederatedPointerEvent } from 'pixi.js';

const MODULE_ID = 'hexagons';

let activeHexLineTool: HexLineTool | null = null;

const rerenderSceneControls = (): void => {
	ui.controls?.render({ force: true });
};

const isHexGrid = (): boolean => {
	const gridType = canvas?.grid?.type;
	if (typeof gridType !== 'number') {
		return false;
	}

	const hexTypes = new Set<number>([
		CONST.GRID_TYPES.HEXEVENQ,
		CONST.GRID_TYPES.HEXEVENR,
		CONST.GRID_TYPES.HEXODDQ,
		CONST.GRID_TYPES.HEXODDR,
	]);

	return hexTypes.has(gridType);
};

const createHexagonControls = (visible: boolean): SceneControls.Control => {
	return {
		name: MODULE_ID,
		title: 'Hexagon Tools',
		icon: 'fas fa-hexagon',
		order: 95,
		visible,
		activeTool: 'hexagons:line',
		tools: {
			'hexagons:line': {
				name: 'hexagons:line',
				title: 'Trace Line',
				icon: 'fas fa-hexagon-nodes',
				order: 1,
				onChange: (_, active: boolean) => {
					toggleHexLineTool(active);
				},
			},
		},
	};
};

const toggleHexLineTool = (active: boolean, { refresh = true }: { refresh?: boolean } = {}): void => {
	let desiredState = active;
	if (desiredState && !isHexGrid()) {
		console.warn(`[${MODULE_ID}] hex line tool is only available on hex scenes`);
		desiredState = false;
	}

	const currentlyActive = Boolean(activeHexLineTool);
	if (desiredState === currentlyActive) {
		if (refresh && desiredState) {
			rerenderSceneControls();
		}
		return;
	}

	console.debug(`[${MODULE_ID}] toggling hex line tool`, { desiredState, currentlyActive });

	if (desiredState) {
		if (!activeHexLineTool) {
			activeHexLineTool = new HexLineTool();
		}
		// Disable the default drawing tool behavior by deactivating the layer
		if (canvas?.drawings?.active) {
			canvas.drawings.deactivate();
		}
	} else {
		if (activeHexLineTool) {
			activeHexLineTool.destroy();
			activeHexLineTool = null;
		}
		// Re-activate the drawings layer if it was previously active
		if (canvas?.drawings) {
			canvas.drawings.activate();
		}
	}

	if (refresh) {
		rerenderSceneControls();
	}
};

const toScenePosition = (event: FederatedPointerEvent): PIXI.Point | null => {
	const stage = canvas?.stage;
	if (!stage) {
		return null;
	}

	const globalPoint = event?.global ?? { x: event?.clientX, y: event?.clientY };
	const point = new PIXI.Point(globalPoint.x, globalPoint.y);
	return stage.worldTransform.applyInverse(point, point);
};

const getHexVertices = (point: PIXI.IPointData): { x: number; y: number }[] => {
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

const findClosestVertex = (
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

const getAdjacentVertices = (vertex: { x: number; y: number }): { x: number; y: number }[] => {
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

const getHexesAlongLine = (start: { x: number; y: number }, end: { x: number; y: number }): Set<string> => {
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

const distanceToLine = (
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

const signedDistanceToLine = (
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

const findVertexPath = (start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] => {
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

class HexLineTool {
	private preview: PIXI.Graphics | null = null;
	private boundStage: PIXI.Container | null = null;
	private keyListenerBound = false;
	private startVertex: { x: number; y: number } | null = null;

	private readonly handlePointerDown = (event: FederatedPointerEvent) => {
		void this.onPointerDown(event);
	};

	private readonly handlePointerMove = (event: FederatedPointerEvent) => {
		this.onPointerMove(event);
	};

	private readonly handleRightDown = (event: FederatedPointerEvent) => {
		this.cancel();
		event?.stopPropagation?.();
		event?.preventDefault?.();
	};

	private readonly handlePointerUp = async (event: FederatedPointerEvent) => {
		if (event?.button === 0 && this.startVertex) {
			// Find the end vertex
			const scenePos = toScenePosition(event);
			if (!scenePos) {
				this.startVertex = null;
				this.clearPreview();
				return;
			}

			const vertices = getHexVertices(scenePos);
			if (vertices.length === 0) {
				this.startVertex = null;
				this.clearPreview();
				return;
			}

			const endVertex = findClosestVertex(scenePos, vertices);
			if (!endVertex) {
				this.startVertex = null;
				this.clearPreview();
				return;
			}

			// Find the path
			const path = findVertexPath(this.startVertex, endVertex);

			if (path.length > 1) {
				// Create a permanent drawing
				await this.createDrawing(path);
			}

			// End the drag
			console.log('Finished drag');
			this.startVertex = null;
			this.clearPreview();
		}
	};

	private async createDrawing(path: { x: number; y: number }[]): Promise<void> {
		if (!canvas?.scene) {
			return;
		}

		// Find bounding box (AABB) to set the drawing's origin and dimensions
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const vertex of path) {
			minX = Math.min(minX, vertex.x);
			minY = Math.min(minY, vertex.y);
			maxX = Math.max(maxX, vertex.x);
			maxY = Math.max(maxY, vertex.y);
		}

		const width = maxX - minX;
		const height = maxY - minY;

		// Convert path to shape points format [x1, y1, x2, y2, ...], relative to the origin
		const points: number[] = [];
		for (const vertex of path) {
			points.push(vertex.x - minX, vertex.y - minY);
		}

		// Create the drawing document
		const drawingData = {
			shape: {
				type: 'p' as const, // polygon/polyline
				points: points,
				width: width,
				height: height,
			},
			x: minX,
			y: minY,
			strokeWidth: 4,
			strokeColor: '#ff8800',
			strokeAlpha: 1.0,
			fillType: CONST.DRAWING_FILL_TYPES.NONE,
			fillColor: '#ff8800',
			fillAlpha: 0,
			bezierFactor: 0,
			locked: false,
			hidden: false,
		};

		try {
			await canvas.scene.createEmbeddedDocuments('Drawing', [drawingData]);
		} catch (error) {
			console.error('Failed to create drawing:', error);
		}
	}

	private clearPreview(): void {
		if (this.preview) {
			this.preview.clear();
		}
	}

	private readonly handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			this.cancel();
			toggleHexLineTool(false);
		}
	};

	constructor() {
		this.attach();
	}

	onCanvasReady() {
		this.attach();
	}

	destroy() {
		this.detach();
		if (this.preview) {
			this.preview.destroy?.({ children: true });
			this.preview = null;
		}
	}

	private getPreview(): PIXI.Graphics {
		if (this.preview) {
			return this.preview;
		}
		const preview = new PIXI.Graphics();
		preview.eventMode = 'none';
		this.preview = preview;
		return preview;
	}

	private attach() {
		if (!canvas?.stage) {
			return;
		}

		const preview = this.getPreview();

		if (canvas.controls?.addChild && preview.parent !== canvas.controls) {
			canvas.controls.addChild(preview);
		}

		if (this.boundStage !== canvas.stage) {
			this.boundStage?.off('pointerdown', this.handlePointerDown);
			this.boundStage?.off('pointermove', this.handlePointerMove);
			this.boundStage?.off('pointerup', this.handlePointerUp);
			this.boundStage?.off('rightdown', this.handleRightDown);
			canvas.stage.on('pointerdown', this.handlePointerDown);
			canvas.stage.on('pointermove', this.handlePointerMove);
			canvas.stage.on('pointerup', this.handlePointerUp);
			canvas.stage.on('rightdown', this.handleRightDown);
			this.boundStage = canvas.stage;
		}

		if (!this.keyListenerBound) {
			window.addEventListener('keydown', this.handleKeyDown);
			this.keyListenerBound = true;
		}
	}

	private detach() {
		this.boundStage?.off('pointerdown', this.handlePointerDown);
		this.boundStage?.off('pointermove', this.handlePointerMove);
		this.boundStage?.off('pointerup', this.handlePointerUp);
		this.boundStage?.off('rightdown', this.handleRightDown);
		this.boundStage = null;

		if (this.keyListenerBound) {
			window.removeEventListener('keydown', this.handleKeyDown);
			this.keyListenerBound = false;
		}

		if (this.preview?.parent) {
			this.preview.parent.removeChild?.(this.preview);
		}
	}

	private async onPointerDown(event: FederatedPointerEvent) {
		if (event?.button !== 0) {
			return;
		}

		const scenePos = toScenePosition(event);
		if (!scenePos) {
			return;
		}

		const vertices = getHexVertices(scenePos);
		if (vertices.length === 0) {
			return;
		}

		// Find the closest vertex to click position
		const closestVertex = findClosestVertex(scenePos, vertices);

		if (closestVertex) {
			console.log('Started drag at vertex:', closestVertex);
			this.startVertex = closestVertex;
		}

		event?.stopPropagation?.();
		event?.preventDefault?.();
	}

	private onPointerMove(event: FederatedPointerEvent) {
		const scenePos = toScenePosition(event);
		if (!scenePos) {
			return;
		}

		const vertices = getHexVertices(scenePos);
		if (vertices.length === 0) {
			return;
		}

		// Find the closest vertex to mouse position
		const closestVertex = findClosestVertex(scenePos, vertices);

		if (!closestVertex) {
			return;
		}

		// If we're dragging, draw a line from start to current vertex
		if (this.startVertex) {
			this.drawLine(this.startVertex, closestVertex);
		} else {
			// Just show the closest vertex
			this.drawClosestVertex(closestVertex);
		}
	}

	private drawLine(start: { x: number; y: number }, end: { x: number; y: number }) {
		const preview = this.preview;
		if (!preview) {
			return;
		}

		preview.clear();

		// Find path along hex edges
		const path = findVertexPath(start, end);

		// Draw the path
		if (path.length > 1) {
			preview.lineStyle?.(4, 0xff8800, 0.9);
			preview.moveTo?.(path[0]!.x, path[0]!.y);
			for (let i = 1; i < path.length; i++) {
				preview.lineTo?.(path[i]!.x, path[i]!.y);
			}
		}

		// Draw dots at all vertices in path
		preview.beginFill?.(0xff8800, 0.9);
		for (const vertex of path) {
			preview.drawCircle?.(vertex.x, vertex.y, 8);
		}
		preview.endFill?.();
	}

	private drawClosestVertex(vertex: { x: number; y: number }) {
		const preview = this.preview;
		if (!preview) {
			return;
		}

		preview.clear();
		preview.beginFill?.(0xff8800, 0.9);
		preview.drawCircle?.(vertex.x, vertex.y, 8);
		preview.endFill?.();
	}

	private cancel() {
		this.startVertex = null;
		const preview = this.preview;
		if (preview) {
			preview.clear();
		}
	}
}

export const registerHexagonToolbar = (): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(Hooks.on as any)(
		'getSceneControlButtons',
		(controls: Record<string, foundry.applications.ui.SceneControls.Control>) => {
			const hexScene = isHexGrid();
			const hexagons = createHexagonControls(hexScene);
			controls.hexagons = hexagons;
		},
	);

	Hooks.on('canvasReady', () => {
		const isHexScene = isHexGrid();
		if (!isHexScene) {
			toggleHexLineTool(false);
		}
		rerenderSceneControls();
		activeHexLineTool?.onCanvasReady();
	});
};

registerHexagonToolbar();
