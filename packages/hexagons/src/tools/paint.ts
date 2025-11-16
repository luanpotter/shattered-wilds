import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, toScenePosition } from '../utils/vtt';
import { getHexVertices } from '../utils/hexes';
import { HexagonsSettings } from '../utils/settings';

let highlightLayer: PIXI.Graphics | null = null;

export const PaintTool = {
	toggle(active: boolean): void {
		if (active && isHexGrid()) {
			if (!activePaintTool) {
				activePaintTool = new HexPaintTool();
			}
		} else if (activePaintTool) {
			activePaintTool.destroy();
			activePaintTool = null;
		}
	},
};

let activePaintTool: HexPaintTool | null = null;

class HexPaintTool {
	constructor() {
		canvas!.stage!.on('pointermove', this.onPointerMove);
		canvas!.stage!.on('pointerdown', this.onPointerDown);
	}

	destroy() {
		canvas!.stage!.off('pointermove', this.onPointerMove);
		canvas!.stage!.off('pointerdown', this.onPointerDown);
		if (highlightLayer && highlightLayer.parent) {
			highlightLayer.parent.removeChild(highlightLayer);
		}
		highlightLayer?.destroy();
		highlightLayer = null;
	}

	private onPointerMove = (event: FederatedPointerEvent) => {
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}
		const vertices = getHexVertices(pos);
		if (!highlightLayer) {
			highlightLayer = new PIXI.Graphics();
			canvas!.controls!.addChild(highlightLayer);
		}
		highlightLayer.clear();
		highlightLayer.lineStyle(2, 0x00aaff, 0.7);
		const fillColor = HexagonsSettings.get('fillColor');
		highlightLayer.beginFill(fillColor, 0.2);
		highlightLayer.drawPolygon(vertices.map(v => [v.x, v.y]).flat());
		highlightLayer.endFill();
	};

	private onPointerDown = async (event: FederatedPointerEvent) => {
		if (event.button !== 0) {
			return;
		}
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}
		const vertices = getHexVertices(pos);
		if (vertices.length !== 6) {
			return;
		}
		const minX = Math.min(...vertices.map(v => v.x));
		const minY = Math.min(...vertices.map(v => v.y));
		const points = vertices.map(v => [v.x - minX, v.y - minY]).flat();
		const width = Math.max(...vertices.map(v => v.x)) - minX;
		const height = Math.max(...vertices.map(v => v.y)) - minY;
		const fillColor = HexagonsSettings.get('fillColor');
		const lineWidth = HexagonsSettings.get('lineWidth');
		const drawingData = {
			shape: {
				type: 'p' as const,
				points,
				width,
				height,
			},
			x: minX,
			y: minY,
			strokeWidth: lineWidth,
			strokeColor: fillColor,
			strokeAlpha: 1.0,
			fillType: CONST.DRAWING_FILL_TYPES.SOLID,
			fillColor: fillColor,
			fillAlpha: 0.2,
			bezierFactor: 0,
			locked: false,
			hidden: false,
			flags: {
				hexagons: {
					isHexagonsDrawing: true,
				},
			},
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await canvas!.scene!.createEmbeddedDocuments('Drawing', [drawingData as any]);
	};
}
