import { Check } from '@shattered-wilds/commons';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Character, Modal, GridState, HexPosition } from './types';

type AddCharacter = (character: Character) => void;
type UpdateCharacterName = (character: Character, newName: string) => void;
type UpdateCharacterProp = (character: Character, prop: string, value: string | undefined) => void;
type UpdateCharacterPos = (character: Character, pos: HexPosition) => void;
type UpdateCharacterAutomaticMode = (character: Character, automaticMode: boolean) => void;
type RemoveCharacter = (id: string) => void;
type AddModal = (modal: Modal) => void;
type UpdateModal = (modal: Modal) => void;
type RemoveModal = (id: string) => void;
type UpdateGridState = (state: Partial<GridState>) => void;
type ToggleEditMode = () => void;

interface AppState {
	modals: Modal[];
	characters: Character[];
	gridState: GridState;
	editMode: boolean;
	uiState: Record<string, unknown>; // Store component UI state by component key
	addCharacter: AddCharacter;
	updateCharacterName: UpdateCharacterName;
	updateCharacterProp: UpdateCharacterProp;
	updateCharacterPos: UpdateCharacterPos;
	updateCharacterAutomaticMode: UpdateCharacterAutomaticMode;
	removeCharacter: RemoveCharacter;
	addModal: AddModal;
	updateModal: UpdateModal;
	removeModal: RemoveModal;
	updateGridState: UpdateGridState;
	toggleEditMode: ToggleEditMode;
	setUIState: <T>(key: string, value: T | ((prev: T) => T)) => void;
}

// Rehydrator to reconstruct class instances after JSON deserialization
const rehydrateState = (persistedState: unknown): AppState | undefined => {
	if (!persistedState || typeof persistedState !== 'object') {
		return undefined;
	}

	const state = persistedState as AppState;

	// Reconstruct Check objects in modals
	if (state.modals) {
		state.modals = state.modals.map(modal => {
			if (modal.type === 'dice-roll' && modal.check && !(modal.check instanceof Check)) {
				// Reconstruct Check object from plain object
				const checkData = modal.check as {
					mode: unknown;
					nature: unknown;
					statModifier: unknown;
				};
				return {
					...modal,
					check: new Check({
						mode: checkData.mode,
						nature: checkData.nature,
						statModifier: checkData.statModifier,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} as any),
				};
			}
			return modal;
		});
	}

	return state;
};

export const useStore = create<AppState>()(
	persist(
		set => ({
			modals: [],
			characters: [],
			gridState: {
				scale: 1,
				offset: { x: 0, y: 0 },
			},
			editMode: true,
			uiState: {},
			addCharacter: character =>
				set(state => ({
					characters: [...state.characters, character],
				})),
			updateCharacterName: (character, newName) =>
				set(state => ({
					characters: state.characters.map(c =>
						c.id === character.id ? { ...c, props: { ...c.props, name: newName } } : c,
					),
				})),
			updateCharacterProp: (character, prop, value) =>
				set(state => ({
					characters: state.characters.map(c => {
						if (c.id === character.id) {
							const updatedProps = { ...c.props };
							if (value === undefined) {
								delete updatedProps[prop];
							} else {
								updatedProps[prop] = value;
							}
							return { ...c, props: updatedProps };
						}
						return c;
					}),
				})),
			updateCharacterPos: (character, pos) =>
				set(state => ({
					characters: state.characters.map(c => (c.id === character.id ? { ...c, position: pos } : c)),
				})),
			updateCharacterAutomaticMode: (character, automaticMode) =>
				set(state => ({
					characters: state.characters.map(c => (c.id === character.id ? { ...c, automaticMode } : c)),
				})),
			removeCharacter: id =>
				set(state => ({
					characters: state.characters.filter(c => c.id !== id),
					// Also close any modals associated with this character
					modals: state.modals.filter(modal => !('characterId' in modal) || modal.characterId !== id),
				})),
			addModal: modal =>
				set(state => ({
					modals: [...state.modals, modal],
				})),
			updateModal: modal =>
				set(state => ({
					modals: state.modals.map(m => (m.id === modal.id ? modal : m)),
				})),
			removeModal: id =>
				set(state => ({
					modals: state.modals.filter(modal => modal.id !== id),
				})),
			updateGridState: (gridState: Partial<GridState>) =>
				set(state => ({
					gridState: { ...state.gridState, ...gridState },
				})),
			toggleEditMode: () =>
				set(state => ({
					editMode: !state.editMode,
				})),
			setUIState: <T>(key: string, valueOrUpdater: T | ((prev: T) => T)) =>
				set(state => {
					const prev = state.uiState[key] as T;
					const next =
						typeof valueOrUpdater === 'function' ? (valueOrUpdater as (prev: T) => T)(prev) : (valueOrUpdater as T);
					return { uiState: { ...state.uiState, [key]: next } };
				}),
		}),
		{
			name: 'd12-simulator-storage',
			version: 1,
			onRehydrateStorage: () => state => {
				if (state) {
					const rehydrated = rehydrateState(state);
					if (rehydrated) {
						Object.assign(state, rehydrated);
					}
				}
			},
		},
	),
);
