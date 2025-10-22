import { MODULE_ID } from './consts';
import { ConfigModal } from './tools/config';
import { HexLine } from './tools/line';
import { isHexGrid, rerenderSceneControls } from './utils/vtt';
import { SelectTool } from './tools/select';
import { HexagonsSettings } from './utils/settings';

const createHexagonControls = (visible: boolean): SceneControls.Control => {
	return {
		name: MODULE_ID,
		title: 'Hexagon Tools',
		icon: 'fas fa-hexagon',
		order: 95,
		visible,
		activeTool: 'hexagons:select',
		tools: {
			'hexagons:select': {
				name: 'hexagons:select',
				title: 'Select',
				icon: 'fas fa-mouse-pointer',
				order: 1,
				onChange: (_, active: boolean) => {
					SelectTool.toggle(active);
				},
			},
			'hexagons:line': {
				name: 'hexagons:line',
				title: 'Trace Line',
				icon: 'fas fa-hexagon-nodes',
				order: 2,
				onChange: (_, active: boolean) => {
					HexLine.toggle(active);
				},
			},
			'hexagons:config': {
				name: 'hexagons:config',
				title: 'Configure',
				icon: 'fas fa-gear',
				order: 99,
				button: true,
				onChange: (_, active: boolean) => {
					if (active) {
						ConfigModal.open();
					}
				},
			},
		},
	};
};

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
			HexLine.toggle(false);
		}
		rerenderSceneControls();
		HexLine.onCanvasReady();
	});
};

Hooks.on('init', () => {
	HexagonsSettings.register();
});

registerHexagonToolbar();
