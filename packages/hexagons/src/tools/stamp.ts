import { FederatedPointerEvent } from 'pixi.js';
import { isHexGrid, toScenePosition } from '../utils/vtt';
import { getHexVertices } from '../utils/hexes';
import { getEmojiSuggestions, recordEmojiUsage } from '../utils/emoji';

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
		let inputElement: HTMLInputElement | null = null;
		let suggestionsElement: HTMLDivElement | null = null;
		const escapeHtml = (value: string) =>
			value
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		const dialog = new foundry.applications.api.DialogV2({
			window: {
				title: 'Pick Stamp',
				icon: 'fas fa-stamp',
			},
			content: `<div class="form-group" style="width: 360px; display: flex; flex-direction: column;">
				<input type="text" id="hexagons-stamp-icon" name="icon" value="${lastIcon ? escapeHtml(lastIcon) : ''}" autocomplete="off" placeholder="Type emoji or text">
				<div class="hexagons-stamp-suggestions" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;"></div>
			</div>`,
			buttons: [
				{
					icon: '<i class="fas fa-check"></i>',
					label: 'Stamp',
					action: 'stamp',
					callback: async () => {
						const icon = inputElement?.value ?? '';
						if (!icon) {
							return;
						}
						lastIcon = icon;
						recordEmojiUsage(icon);
						await this.createIconDrawing(center, vertices, icon);
						dialog.close();
					},
				},
				{
					icon: '<i class="fas fa-times"></i>',
					label: 'Cancel',
					action: 'cancel',
				},
			],
		});
		void dialog.render({ force: true }).then(() => {
			const element = dialog.element as HTMLElement | null;
			if (!element) {
				return;
			}
			inputElement = element.querySelector<HTMLInputElement>('input[name="icon"]');
			suggestionsElement = element.querySelector<HTMLDivElement>('.hexagons-stamp-suggestions');
			if (!inputElement || !suggestionsElement) {
				return;
			}
			const applyEmoji = (emoji: string) => {
				if (!inputElement) {
					return;
				}
				inputElement.value = emoji;
				lastIcon = emoji;
				recordEmojiUsage(emoji);
				void this.createIconDrawing(center, vertices, emoji).then(() => dialog.close());
			};
			const renderSuggestions = () => {
				if (!suggestionsElement || !inputElement) {
					return;
				}
				const suggestions = getEmojiSuggestions(inputElement.value, 5);
				if (!suggestions.length) {
					suggestionsElement.textContent = 'No matches found.';
					return;
				}
				const buttons: HTMLButtonElement[] = [];
				for (const suggestion of suggestions) {
					const button = document.createElement('button');
					button.type = 'button';
					button.className = 'hexagons-stamp-suggestion';
					button.style.cssText =
						'display: flex; align-items: center; justify-content: center; flex: 1 1 56px; height: 56px; font-size: 32px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.06); cursor: pointer;';
					button.textContent = suggestion.emoji;
					const label = suggestion.canonicalName || suggestion.keywords[0] || suggestion.emoji;
					button.title = label;
					button.setAttribute('aria-label', label);
					button.addEventListener('click', () => applyEmoji(suggestion.emoji));
					buttons.push(button);
				}
				suggestionsElement.replaceChildren(...buttons);
			};
			inputElement.addEventListener('input', renderSuggestions);
			renderSuggestions();
			inputElement.focus();
			inputElement.select();
		});
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
