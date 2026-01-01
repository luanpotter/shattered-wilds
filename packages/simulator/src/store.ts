import { Check, CheckMode, CheckNature, StatModifier } from '@shattered-wilds/commons';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Character, Encounter, Modal, GridState, HexPosition } from './types/ui';

type AddCharacter = (character: Character) => void;
type UpdateCharacterName = (character: Character, newName: string) => void;
type UpdateCharacterProp = (character: Character, prop: string, value: string | undefined) => void;
type UpdateCharacterAutomaticMode = (character: Character, automaticMode: boolean) => void;
type RemoveCharacter = (id: string) => void;

type AddEncounter = (encounter: Encounter) => void;
type UpdateEncounter = (encounter: Encounter) => void;
type RemoveEncounter = (id: string) => void;
type UpdateCharacterPositionInEncounter = (encounterId: string, characterId: string, pos: HexPosition) => void;
type AddCharacterToEncounter = (encounterId: string, characterId: string, pos: HexPosition) => void;
type RemoveCharacterFromEncounter = (encounterId: string, characterId: string) => void;

type AddModal = (modal: Modal) => void;
type UpdateModal = (modal: Modal) => void;
type RemoveModal = (id: string) => void;
type UpdateGridState = (state: Partial<GridState>) => void;
type ToggleEditMode = () => void;

interface AppState {
	modals: Modal[];
	characters: Character[];
	encounters: Encounter[];
	gridState: GridState;
	editMode: boolean;
	uiState: Record<string, unknown>;
	addCharacter: AddCharacter;
	updateCharacterName: UpdateCharacterName;
	updateCharacterProp: UpdateCharacterProp;
	updateCharacterAutomaticMode: UpdateCharacterAutomaticMode;
	removeCharacter: RemoveCharacter;
	addEncounter: AddEncounter;
	updateEncounter: UpdateEncounter;
	removeEncounter: RemoveEncounter;
	updateCharacterPositionInEncounter: UpdateCharacterPositionInEncounter;
	addCharacterToEncounter: AddCharacterToEncounter;
	removeCharacterFromEncounter: RemoveCharacterFromEncounter;
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
					mode: CheckMode;
					descriptor: string;
					nature: CheckNature;
					statModifier: StatModifier;
				};
				return {
					...modal,
					check: new Check({
						mode: checkData.mode,
						descriptor: checkData.descriptor,
						nature: checkData.nature,
						statModifier: checkData.statModifier,
					}),
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
			encounters: [],
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
			updateCharacterAutomaticMode: (character, automaticMode) =>
				set(state => ({
					characters: state.characters.map(c => (c.id === character.id ? { ...c, automaticMode } : c)),
				})),
			removeCharacter: id =>
				set(state => ({
					characters: state.characters.filter(c => c.id !== id),
					modals: state.modals.filter(modal => !('characterId' in modal) || modal.characterId !== id),
					encounters: state.encounters.map(e => {
						const newPositions = { ...e.characterPositions };
						delete newPositions[id];
						return { ...e, characterPositions: newPositions };
					}),
				})),
			addEncounter: encounter =>
				set(state => ({
					encounters: [...state.encounters, encounter],
				})),
			updateEncounter: encounter =>
				set(state => ({
					encounters: state.encounters.map(e => (e.id === encounter.id ? encounter : e)),
				})),
			removeEncounter: id =>
				set(state => ({
					encounters: state.encounters.filter(e => e.id !== id),
				})),
			updateCharacterPositionInEncounter: (encounterId, characterId, pos) =>
				set(state => ({
					encounters: state.encounters.map(e =>
						e.id === encounterId ? { ...e, characterPositions: { ...e.characterPositions, [characterId]: pos } } : e,
					),
				})),
			addCharacterToEncounter: (encounterId, characterId, pos) =>
				set(state => ({
					encounters: state.encounters.map(e =>
						e.id === encounterId ? { ...e, characterPositions: { ...e.characterPositions, [characterId]: pos } } : e,
					),
				})),
			removeCharacterFromEncounter: (encounterId, characterId) =>
				set(state => ({
					encounters: state.encounters.map(e => {
						if (e.id !== encounterId) return e;
						const newPositions = { ...e.characterPositions };
						delete newPositions[characterId];
						return { ...e, characterPositions: newPositions };
					}),
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
			version: 2,
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
