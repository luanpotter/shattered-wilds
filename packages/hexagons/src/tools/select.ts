import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, toScenePosition } from '../utils/vtt';
import { getHexVertices, findClosestVertex } from '../utils/hexes';

let highlightLayer: PIXI.Graphics | null = null;

let activeTool: HexSelectTool | null = null;

export const SelectTool = {
	toggle(active: boolean): void {
		if (active && isHexGrid()) {
			if (!activeTool) {
				activeTool = new HexSelectTool();
			}
		} else if (activeTool) {
			activeTool.destroy();
			activeTool = null;
		}
	},
};

class HexSelectTool {
	private dragging = false;
	private dragStart: PIXI.Point | null = null;
	private dragRect: PIXI.Graphics | null = null;
	private selected: Set<string> = new Set();
	private moveStart: { [id: string]: { x: number; y: number } } = {};
	private moveLattice: { [id: string]: { lattice: { x: number; y: number }[]; origin: { x: number; y: number } } } = {};
	private moving = false;
	private moveOrigin: PIXI.Point | null = null;

	constructor() {
		canvas!.stage!.on('pointerdown', this.onPointerDown);
		canvas!.stage!.on('pointermove', this.onPointerMove);
		canvas!.stage!.on('pointerup', this.onPointerUp);
	}

	destroy() {
		canvas!.stage!.off('pointerdown', this.onPointerDown);
		canvas!.stage!.off('pointermove', this.onPointerMove);
		canvas!.stage!.off('pointerup', this.onPointerUp);
		this.clearDragRect();
		if (highlightLayer && highlightLayer.parent) {
			highlightLayer.parent.removeChild(highlightLayer);
		}
		highlightLayer?.destroy();
		highlightLayer = null;
	}

	private onPointerDown = (event: FederatedPointerEvent) => {
		this.updateHighlight(this.selected);
		if (event.button !== 0) {
			return;
		}
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}

		const hit = this.getDrawingAt(pos);
		if (hit) {
			// Start moving selected drawings
			if (hit && !this.selected.has(hit.id!)) {
				this.selected.clear();
				this.selected.add(hit.id!);
			}
			this.moving = true;
			this.moveOrigin = pos;
			this.moveStart = {};
			for (const id of this.selected) {
				const drawing = canvas!.scene!.drawings.get(id);
				if (drawing) {
					this.moveStart[id] = { x: drawing.x, y: drawing.y };

					// Compute lattice vertices for each point in the line
					const shape = drawing.shape;
					if (shape?.type === 'p') {
						const points = shape.points;
						const lattice: { x: number; y: number }[] = [];
						for (let i = 0; i < points.length; i += 2) {
							const px = points[i]! + drawing.x;
							const py = points[i + 1]! + drawing.y;
							const vertices = getHexVertices({ x: px, y: py });
							const closest = findClosestVertex({ x: px, y: py }, vertices);
							if (closest) {
								lattice.push(closest);
							} else {
								lattice.push({ x: px, y: py });
							}
						}
						this.moveLattice[id] = { lattice, origin: { x: drawing.x, y: drawing.y } };
					}
				}
			}
		} else {
			// Start box selection
			this.dragging = true;
			this.dragStart = pos;
			this.clearDragRect();
			this.dragRect = new PIXI.Graphics();
			canvas!.controls!.addChild(this.dragRect);
		}
		event.stopPropagation();
		event.preventDefault();
	};

	private onPointerMove = (event: FederatedPointerEvent) => {
		this.updateHighlight(this.selected);
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}
		if (this.dragging && this.dragStart) {
			this.drawDragRect(this.dragStart, pos);
		}
		if (this.moving && this.moveOrigin) {
			const dx = pos.x - this.moveOrigin.x;
			const dy = pos.y - this.moveOrigin.y;
			for (const id of this.selected) {
				const drawing = canvas!.scene!.drawings.get(id);
				const latticeInfo = this.moveLattice[id];
				if (drawing && latticeInfo) {
					// Compute new origin by moving the first lattice vertex by the drag delta,
					// snapping to the nearest lattice vertex
					const origLattice = latticeInfo.lattice;
					if (origLattice.length === 0) {
						continue;
					}

					const origFirst = origLattice[0];
					if (!origFirst) {
						continue;
					}

					const movedFirst = { x: origFirst.x + dx, y: origFirst.y + dy };
					const vertices = getHexVertices(movedFirst);
					const snappedFirst = findClosestVertex(movedFirst, vertices) ?? movedFirst;

					// Compute offset between snappedFirst and origFirst
					const offsetX = snappedFirst.x - origFirst.x;
					const offsetY = snappedFirst.y - origFirst.y;

					// Move the drawing so all lattice points are offset by the same amount
					const newOrigin = { x: latticeInfo.origin.x + offsetX, y: latticeInfo.origin.y + offsetY };
					drawing.update({ x: newOrigin.x, y: newOrigin.y });
				}
			}
		}
	};

	private onPointerUp = (event: FederatedPointerEvent) => {
		this.updateHighlight(this.selected);
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}
		if (this.dragging && this.dragStart) {
			this.selected.clear();
			const rect = this.getRect(this.dragStart, pos);
			for (const d of this.getAllHexDrawings()) {
				if (this.drawingInRect(d, rect)) {
					this.selected.add(d.id!);
				}
			}
			this.clearDragRect();
			this.dragging = false;
			this.dragStart = null;
		}
		if (this.moving) {
			this.moving = false;
			this.moveOrigin = null;
			this.moveStart = {};
			this.moveLattice = {};
		}
	};

	private getDrawingAt(pos: PIXI.IPointData): DrawingDocument | null {
		for (const d of this.getAllHexDrawings()) {
			const shape = d.shape;
			if (shape?.type === 'p') {
				const points = shape.points;
				let minX = Infinity,
					minY = Infinity,
					maxX = -Infinity,
					maxY = -Infinity;
				for (let i = 0; i < points.length; i += 2) {
					const x = points[i]! + d.x;
					const y = points[i + 1]! + d.y;
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}
				if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
					return d;
				}
			}
		}
		return null;
	}

	private getAllHexDrawings(): DrawingDocument[] {
		return canvas!.scene!.drawings.filter(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(drawing: DrawingDocument) => (drawing as any).getFlag?.('hexagons', 'isHexagonsDrawing') === true,
		);
	}

	private drawingInRect(d: DrawingDocument, rect: { x: number; y: number; width: number; height: number }): boolean {
		const x0 = d.x;
		const y0 = d.y;
		const x1 = d.x + d.shape!.width!;
		const y1 = d.y + d.shape!.height!;
		return x0 >= rect.x && y0 >= rect.y && x1 <= rect.x + rect.width && y1 <= rect.y + rect.height;
	}

	private getRect(a: PIXI.IPointData, b: PIXI.IPointData) {
		const x = Math.min(a.x, b.x);
		const y = Math.min(a.y, b.y);
		const width = Math.abs(a.x - b.x);
		const height = Math.abs(a.y - b.y);
		return { x, y, width, height };
	}

	private drawDragRect(a: PIXI.IPointData, b: PIXI.IPointData) {
		if (!this.dragRect) {
			return;
		}
		const { x, y, width, height } = this.getRect(a, b);
		this.dragRect.clear();
		this.dragRect.lineStyle(2, 0x00aaff, 0.7);
		this.dragRect.beginFill(0x00aaff, 0.1);
		this.dragRect.drawRect(x, y, width, height);
		this.dragRect.endFill();
	}

	private clearDragRect() {
		if (this.dragRect && this.dragRect.parent) {
			this.dragRect.parent.removeChild(this.dragRect);
		}
		this.dragRect?.destroy();
		this.dragRect = null;
	}

	private updateHighlight(selected: Set<string>) {
		if (!highlightLayer) {
			highlightLayer = new PIXI.Graphics();
			canvas!.controls!.addChild(highlightLayer);
		}
		highlightLayer.clear();
		for (const id of selected) {
			const drawing = canvas!.scene!.drawings.get(id);
			if (!drawing) {
				continue;
			}
			const shape = drawing.shape;
			if (shape?.type === 'p' && Array.isArray(shape.points)) {
				const points = shape.points as number[];
				highlightLayer.lineStyle(6, 0x00aaff, 0.7);
				highlightLayer.drawPolygon(points.map((v, i) => (i % 2 === 0 ? v + drawing.x : v + drawing.y)));
			}
		}
	}
}
