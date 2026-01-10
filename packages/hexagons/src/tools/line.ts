import { findClosestVertex, type Point } from '@shattered-wilds/commons';
import { MODULE_ID } from '../consts';
import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, rerenderSceneControls, toScenePosition } from '../utils/vtt';
import { findVertexPath, getHexVertices } from '../utils/hexes';
import { HexagonsSettings } from '../utils/settings';

let activeHexLineTool: HexLineTool | null = null;

export const HexLine = {
	onCanvasReady() {
		activeHexLineTool?.onCanvasReady();
	},

	toggle(active: boolean, { refresh = true }: { refresh?: boolean } = {}): void {
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
		} else if (activeHexLineTool) {
			activeHexLineTool.destroy();
			activeHexLineTool = null;
		}

		if (refresh) {
			rerenderSceneControls();
		}
	},
};

export class HexLineTool {
	private preview: PIXI.Graphics | null = null;
	private boundStage: PIXI.Container | null = null;
	private keyListenerBound = false;
	private startVertex: Point | null = null;

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
			const path = findVertexPath(this.startVertex, endVertex);

			if (path.length > 1) {
				// Create a permanent drawing
				await this.createDrawing(path);
			}

			// End the drag
			this.startVertex = null;
			this.clearPreview();
		}
	};

	private async createDrawing(path: Point[]): Promise<void> {
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

		const lineColor = HexagonsSettings.get('lineColor');
		const lineWidth = HexagonsSettings.get('lineWidth');

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
			strokeWidth: lineWidth,
			strokeColor: lineColor,
			strokeAlpha: 1.0,
			fillType: CONST.DRAWING_FILL_TYPES.NONE,
			fillColor: lineColor,
			fillAlpha: 0,
			bezierFactor: 0,
			locked: false,
			hidden: false,
			flags: {
				hexagons: {
					isHexagonsDrawing: true,
				},
			},
		};

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await canvas.scene.createEmbeddedDocuments('Drawing', [drawingData as any]);
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
			HexLine.toggle(false);
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
		this.startVertex = closestVertex;

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

		// If we're dragging, draw a line from start to current vertex
		if (this.startVertex) {
			this.drawLine(this.startVertex, closestVertex);
		} else {
			// Just show the closest vertex
			this.drawClosestVertex(closestVertex);
		}
	}

	private drawLine(start: Point, end: Point) {
		const preview = this.preview;
		if (!preview) {
			return;
		}

		preview.clear();

		// Find path along hex edges
		const path = findVertexPath(start, end);

		// Draw the path
		if (path.length > 1) {
			const width = HexagonsSettings.get('lineWidth');
			preview.lineStyle?.(width, 0xff8800, 0.9);
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

	private drawClosestVertex(vertex: Point) {
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
