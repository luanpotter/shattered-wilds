import type { Point } from '@shattered-wilds/commons';
import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, toScenePosition } from '../utils/vtt';
import { getHexVertices, findClosestVertex } from '../utils/hexes';
import { getAllHexagonsDrawings } from '../utils/drawings';

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

	getSelectedDrawings(): DrawingDocument[] {
		return activeTool?.getSelectedDrawings() ?? [];
	},

	refreshHighlight(): void {
		activeTool?.refreshHighlight();
	},
};

class HexSelectTool {
	private handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (this.selected.size > 0) {
				const ids = Array.from(this.selected);
				this.selected.clear();
				this.updateHighlight(this.selected);
				void canvas!.scene!.deleteEmbeddedDocuments('Drawing', ids);
			}
		}
	};

	private dragging = false;
	private dragStart: PIXI.Point | null = null;
	private dragRect: PIXI.Graphics | null = null;
	private selected: Set<string> = new Set();
	private moveStart: { [id: string]: Point } = {};
	private moveLattice: { [id: string]: { lattice: Point[]; origin: Point } } = {};
	private moving = false;
	private moveOrigin: PIXI.Point | null = null;

	constructor() {
		canvas!.stage!.on('pointerdown', this.onPointerDown);
		canvas!.stage!.on('pointermove', this.onPointerMove);
		canvas!.stage!.on('pointerup', this.onPointerUp);
		window.addEventListener('keydown', this.handleKeyDown);
	}

	destroy() {
		canvas!.stage!.off('pointerdown', this.onPointerDown);
		canvas!.stage!.off('pointermove', this.onPointerMove);
		canvas!.stage!.off('pointerup', this.onPointerUp);
		window.removeEventListener('keydown', this.handleKeyDown);
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

					const shape = drawing.shape;
					if (shape.points.length > 0) {
						// Polygon: compute lattice points for all vertices
						const points = shape.points;
						const lattice: { x: number; y: number }[] = [];
						for (let i = 0; i < points.length; i += 2) {
							const px = points[i]! + drawing.x;
							const py = points[i + 1]! + drawing.y;

							const vertices = getHexVertices({ x: px, y: py });
							const closest = findClosestVertex({ x: px, y: py }, vertices);
							lattice.push(closest ?? { x: px, y: py });
						}
						this.moveLattice[id] = { lattice, origin: { x: drawing.x, y: drawing.y } };
					} else {
						// Icon: always snap to the center of the hex containing the icon's center
						const cx = drawing.x + (shape.width ?? 0) / 2;
						const cy = drawing.y + (shape.height ?? 0) / 2;
						const vertices = getHexVertices({ x: cx, y: cy });

						const hexCenter = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
						hexCenter.x /= vertices.length;
						hexCenter.y /= vertices.length;
						this.moveLattice[id] = { lattice: [hexCenter], origin: { x: drawing.x, y: drawing.y } };
					}
				}
			}
		} else {
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
				if (!drawing || !latticeInfo) {
					continue;
				}
				const origin = latticeInfo.lattice[0];
				if (!origin) {
					continue;
				}

				const moved = { x: origin.x + dx, y: origin.y + dy };
				const vertices = getHexVertices(moved);

				const shape = drawing.shape;
				if (shape.points.length > 0) {
					// Polygon: align to the nearest lattice vertex
					const snapped = findClosestVertex(moved, vertices) ?? moved;
					const offsetX = snapped.x - origin.x;
					const offsetY = snapped.y - origin.y;
					const newOrigin = {
						x: latticeInfo.origin.x + offsetX,
						y: latticeInfo.origin.y + offsetY,
					};
					drawing.update(newOrigin);
				} else {
					// Icon: move center to center of nearest hex
					const center = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });

					const width = shape.width ?? 0;
					const height = shape.height ?? 0;
					const newOrigin = {
						x: center.x / vertices.length - width / 2,
						y: center.y / vertices.length - height / 2,
					};
					drawing.update(newOrigin);
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
			for (const d of getAllHexagonsDrawings()) {
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
		for (const drawing of getAllHexagonsDrawings()) {
			const { x, y } = drawing;
			const { width, height } = drawing.shape;
			if (!width || !height) {
				continue;
			}
			if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
				return drawing;
			}
		}
		return null;
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
			highlightLayer.lineStyle(6, 0x00aaff, 0.7);
			if (shape.points.length > 0) {
				// Polygon: highlight the shape
				highlightLayer.drawPolygon(shape.points.map((v, i) => (i % 2 === 0 ? v! + drawing.x : v! + drawing.y)));
			} else {
				// Icon: highlight the aabb
				const x = drawing.x;
				const y = drawing.y;
				const w = shape.width ?? 0;
				const h = shape.height ?? 0;
				highlightLayer.drawRect(x, y, w, h);
			}
		}
	}

	getSelectedDrawings(): DrawingDocument[] {
		if (!canvas?.scene) {
			return [];
		}
		const drawings: DrawingDocument[] = [];
		for (const id of this.selected) {
			const drawing = canvas.scene.drawings.get(id);
			if (drawing) {
				drawings.push(drawing);
			}
		}
		return drawings;
	}

	refreshHighlight(): void {
		this.updateHighlight(this.selected);
	}
}
