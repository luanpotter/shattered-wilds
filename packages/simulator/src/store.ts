import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Character, Window, GridState, HexPosition } from './types';

type AddCharacter = (character: Character) => void;
type UpdateCharacterName = (character: Character, newName: string) => void;
type UpdateCharacterProp = (character: Character, prop: string, value: string) => void;
type UpdateCharacterPos = (character: Character, pos: HexPosition) => void;
type UpdateCharacterAutomaticMode = (character: Character, automaticMode: boolean) => void;
type RemoveCharacter = (id: string) => void;
type AddWindow = (window: Window) => void;
type UpdateWindow = (window: Window) => void;
type RemoveWindow = (id: string) => void;
type UpdateGridState = (state: Partial<GridState>) => void;
type ToggleEditMode = () => void;

interface AppState {
	windows: Window[];
	characters: Character[];
	gridState: GridState;
	editMode: boolean;
	addCharacter: AddCharacter;
	updateCharacterName: UpdateCharacterName;
	updateCharacterProp: UpdateCharacterProp;
	updateCharacterPos: UpdateCharacterPos;
	updateCharacterAutomaticMode: UpdateCharacterAutomaticMode;
	removeCharacter: RemoveCharacter;
	addWindow: AddWindow;
	updateWindow: UpdateWindow;
	removeWindow: RemoveWindow;
	updateGridState: UpdateGridState;
	toggleEditMode: ToggleEditMode;
}

export const useStore = create<AppState>()(
	persist(
		set => ({
			windows: [],
			characters: [],
			gridState: {
				scale: 1,
				offset: { x: 0, y: 0 },
			},
			editMode: true,
			addCharacter: character =>
				set(state => ({
					characters: [...state.characters, character],
				})),
			updateCharacterName: (character, newName) =>
				set(state => ({
					characters: state.characters.map(c =>
						c.id === character.id ? { ...c, props: { ...c.props, name: newName } } : c
					),
				})),
			updateCharacterProp: (character, prop, value) =>
				set(state => ({
					characters: state.characters.map(c =>
						c.id === character.id ? { ...c, props: { ...c.props, [prop]: value } } : c
					),
				})),
			updateCharacterPos: (character, pos) =>
				set(state => ({
					characters: state.characters.map(c =>
						c.id === character.id ? { ...c, position: pos } : c
					),
				})),
			updateCharacterAutomaticMode: (character, automaticMode) =>
				set(state => ({
					characters: state.characters.map(c =>
						c.id === character.id ? { ...c, automaticMode } : c
					),
				})),
			removeCharacter: id =>
				set(state => ({
					characters: state.characters.filter(c => c.id !== id),
					// Also close any windows associated with this character
					windows: state.windows.filter(w => w.characterId !== id),
				})),
			addWindow: window =>
				set(state => ({
					windows: [...state.windows, window],
				})),
			updateWindow: window =>
				set(state => ({
					windows: state.windows.map(w => (w.id === window.id ? window : w)),
				})),
			removeWindow: id =>
				set(state => ({
					windows: state.windows.filter(w => w.id !== id),
				})),
			updateGridState: (gridState: Partial<GridState>) =>
				set(state => ({
					gridState: { ...state.gridState, ...gridState },
				})),
			toggleEditMode: () =>
				set(state => ({
					editMode: !state.editMode,
				})),
		}),
		{
			name: 'd12-simulator-storage',
			version: 1,
		}
	)
);
