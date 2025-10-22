declare interface AllHooks {
	getSceneControlButtons: (controls: Record<string, foundry.applications.ui.SceneControls.Control>) => void;
}

declare global {
	interface SettingConfig {
		'hexagons.lineColor': string;
	}
}
