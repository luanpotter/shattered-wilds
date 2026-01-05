import { Action } from '@shattered-wilds/commons';

export enum GridActionTool {
	OpenCharacterSheet = 'Open Character Sheet',
	MeasureDistance = 'Measure Distance',
}

export interface GridActionSelectionData {
	action: Action | GridActionTool;
	// for Attack-type actions, the selected weapon mode index
	selectedWeaponModeIndex?: number;
}
