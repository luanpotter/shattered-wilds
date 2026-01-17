import { Action } from '@shattered-wilds/d12';

import { Character } from '../../types/ui';

export const ATTACK_ACTIONS = [Action.Strike, Action.Stun, Action.Feint, Action.FocusedStrike];

export enum GridActionTool {
	OpenCharacterSheet = 'Open Character Sheet',
	MeasureDistance = 'Measure Distance',
	EndTurn = 'End Turn',
}

export interface GridActionSelectionData {
	action: Action | GridActionTool;
	// for Attack-type actions, the selected weapon mode index
	selectedWeaponModeIndex?: number;
}

export type GridActionHandler = (character: Character, data: GridActionSelectionData) => void;

/**
 * Global registry for the grid action handler.
 * This allows the OmniBox to trigger grid actions.
 * The HexGrid registers its handler when mounted and clears it when unmounted.
 */
class GridActionRegistry {
	private handler: GridActionHandler | null = null;

	register(handler: GridActionHandler): void {
		this.handler = handler;
	}

	unregister(): void {
		this.handler = null;
	}

	isRegistered(): boolean {
		return this.handler !== null;
	}

	triggerAction(character: Character, data: GridActionSelectionData) {
		this.handler?.(character, data);
	}
}

export const gridActionRegistry = new GridActionRegistry();
