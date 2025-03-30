import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Character, Window, GridState } from './types';

type AddCharacter = (character: Character) => void;
type UpdateCharacter = (character: Character) => void;
type RemoveCharacter = (id: string) => void;
type AddWindow = (window: Window) => void;
type UpdateWindow = (window: Window) => void;
type RemoveWindow = (id: string) => void;
type UpdateGridState = (state: Partial<GridState>) => void;

interface AppState {
	characters: Character[];
	windows: Window[];
	gridState: GridState;
	addCharacter: AddCharacter;
	updateCharacter: UpdateCharacter;
	removeCharacter: RemoveCharacter;
	addWindow: AddWindow;
	updateWindow: UpdateWindow;
	removeWindow: RemoveWindow;
	updateGridState: UpdateGridState;
}

// Migrate any old characters data structure to the new one with sheet
const migrate = (state: any): AppState => {
	// If there are any characters
	if (state?.characters?.length) {
		// Map over each character and ensure it has a sheet property
		const migratedCharacters = state.characters.map((character: any) => {
			// If character already has a sheet, return it as is
			if (character.sheet) return character;

			// Otherwise, create a sheet with the name from the character
			return {
				...character,
				sheet: { name: character.name || 'Unknown Character' },
			};
		});

		return { ...state, characters: migratedCharacters };
	}

	return state as AppState;
};

export const useStore = create<AppState>()(
	persist(
		set => ({
			characters: [],
			windows: [],
			gridState: {
				scale: 1,
				offset: { x: 0, y: 0 },
			},
			addCharacter: character =>
				set(state => ({
					characters: [...state.characters, character],
				})),
			updateCharacter: character =>
				set(state => ({
					characters: state.characters.map(c => (c.id === character.id ? character : c)),
				})),
			removeCharacter: id =>
				set(state => ({
					characters: state.characters.filter(c => c.id !== id),
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
			updateGridState: state =>
				set(prev => ({
					gridState: { ...prev.gridState, ...state },
				})),
		}),
		{
			name: 'd12-simulator-storage',
			version: 1, // Adding a version to help with future migrations
			migrate,
		}
	)
);
