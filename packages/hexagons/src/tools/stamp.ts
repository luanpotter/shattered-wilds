import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, toScenePosition } from '../utils/vtt';
import { getHexVertices } from '../utils/hexes';

let highlightLayer: PIXI.Graphics | null = null;
let lastIcon: string | null = null;
let activeStampTool: HexStampTool | null = null;

export const StampTool = {
	toggle(active: boolean): void {
		if (active && isHexGrid()) {
			if (!activeStampTool) {
				activeStampTool = new HexStampTool();
			}
		} else if (activeStampTool) {
			activeStampTool.destroy();
			activeStampTool = null;
		}
	},
};

class HexStampTool {
	constructor() {
		const stage = canvas!.stage!;
		stage.on('pointermove', this.onPointerMove);
		stage.on('pointerdown', this.onPointerDown);
		stage.on('rightdown', this.onRightDown);
	}

	destroy() {
		const stage = canvas!.stage!;
		stage.off('pointermove', this.onPointerMove);
		stage.off('pointerdown', this.onPointerDown);
		stage.off('rightdown', this.onRightDown);
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
		highlightLayer.beginFill(0x00aaff, 0.1);
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
		const center = {
			x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
			y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
		};
		if (lastIcon) {
			await this.createIconDrawing(center, vertices, lastIcon);
		} else {
			this.openIconModal(center, vertices);
		}
	};

	private onRightDown = (event: FederatedPointerEvent) => {
		const pos = toScenePosition(event);
		if (!pos) {
			return;
		}
		const vertices = getHexVertices(pos);
		const center = {
			x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
			y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
		};
		this.openIconModal(center, vertices);
		event.stopPropagation();
		event.preventDefault();
	};

	private openIconModal(center: { x: number; y: number }, vertices: { x: number; y: number }[]) {
		const emojis = [
			'☠️',
			'⭐',
			'❤️',
			'🔥',
			'⚡',
			'🛡️',
			'👑',
			'🐉',
			'🎲',
			'🎯',
			'🧙',
			'🦄',
			'🗡️',
			'🏹',
			'🧟',
			'🧙‍♂️',
			'🧙‍♀️',
			'🦅',
			'🦾',
			'🧲',
		];
		const iconOptions = emojis.map(e => `<option value="${e}">${e}</option>`).join('');
		new foundry.applications.api.DialogV2({
			window: {
				title: 'Pick Stamp',
				icon: 'fas fa-stamp',
			},
			content: `<div class="form-group" style="width: 320px;">
				<label for="hexagons-stamp-icon">Stamp</label>
				<select id="hexagons-stamp-icon" name="icon">${iconOptions}</select>
			</div>`,
			buttons: [
				{
					icon: '<i class="fas fa-check"></i>',
					label: 'Stamp',
					action: 'stamp',
					callback: (_, button: HTMLButtonElement) => {
						const form = button.closest('form') as HTMLFormElement;
						const icon = (form.querySelector('select[name="icon"]') as HTMLSelectElement).value;
						lastIcon = icon;
						this.createIconDrawing(center, vertices, icon);
					},
				},
				{
					icon: '<i class="fas fa-times"></i>',
					label: 'Cancel',
					action: 'cancel',
				},
			],
		}).render({ force: true });
	}

	private async createIconDrawing(
		center: { x: number; y: number },
		vertices: { x: number; y: number }[],
		icon: string,
	) {
		const size =
			Math.min(
				Math.max(...vertices.map(v => v.x)) - Math.min(...vertices.map(v => v.x)),
				Math.max(...vertices.map(v => v.y)) - Math.min(...vertices.map(v => v.y)),
			) * 0.5;
		const drawingData = {
			x: center.x - size / 2,
			y: center.y - size / 2,
			shape: {
				type: 'r' as const,
				width: size,
				height: size,
			},
			text: icon,
			fontSize: size,
			strokeWidth: 0,
			strokeAlpha: 0,
			fillType: CONST.DRAWING_FILL_TYPES.NONE,
			fillAlpha: 0,
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
	}
}
