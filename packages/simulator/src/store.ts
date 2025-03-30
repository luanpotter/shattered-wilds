import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Character, Window, GridState, AttributeMap, DerivedStats } from './types';
import { calculateDerivedStats, calculateModifiers } from './utils';

type AddCharacter = (character: Character) => void;
type UpdateCharacter = (character: Character) => void;
type RemoveCharacter = (id: string) => void;
type AddWindow = (window: Window) => void;
type UpdateWindow = (window: Window) => void;
type RemoveWindow = (id: string) => void;
type UpdateGridState = (state: Partial<GridState>) => void;
type UpdateCharacterStats = (characterId: string, derivedStats: Partial<DerivedStats>) => void;
type UpdateCharacterAttributes = (characterId: string, attributes: AttributeMap) => void;

interface AppState {
	windows: Window[];
	characters: Character[];
	gridState: GridState;
	addCharacter: AddCharacter;
	updateCharacter: UpdateCharacter;
	removeCharacter: RemoveCharacter;
	addWindow: AddWindow;
	updateWindow: UpdateWindow;
	removeWindow: RemoveWindow;
	updateGridState: UpdateGridState;
	updateCharacterStats: UpdateCharacterStats;
	updateCharacterAttributes: UpdateCharacterAttributes;
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
			windows: [],
			characters: [],
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
			updateCharacterStats: (characterId, partialStats) =>
				set(state => ({
					characters: state.characters.map(character => {
						if (character.id === characterId && character.sheet.derivedStats) {
							return {
								...character,
								sheet: {
									...character.sheet,
									derivedStats: {
										...character.sheet.derivedStats,
										...partialStats,
									},
								},
							};
						}
						return character;
					}),
				})),
			updateCharacterAttributes: (characterId, attributes) =>
				set(state => ({
					characters: state.characters.map(character => {
						if (character.id === characterId) {
							// Recalculate modifiers
							calculateModifiers(attributes);

							// Recalculate derived stats
							const derivedStats = calculateDerivedStats(attributes);

							return {
								...character,
								sheet: {
									...character.sheet,
									attributes,
									derivedStats,
								},
							};
						}
						return character;
					}),
				})),
		}),
		{
			name: 'd12-simulator-storage',
			version: 1, // Adding a version to help with future migrations
			migrate,
		}
	)
);
