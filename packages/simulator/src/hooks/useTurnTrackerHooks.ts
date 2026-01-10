import { useStore } from '../store';
import { Character, Encounter } from '../types/ui';

import { useEncounters } from './useEncounters';
import { useResetCharacterAP } from './useResetCharacterAP';

export interface CharacterWithInitiative {
	character: Character;
	initiative: number | null;
}

export const useTurnTrackerHooks = (): {
	sortCharactersByInitiative: (encounter: Encounter) => CharacterWithInitiative[];
	endTurn: (encounter: Encounter) => void;
} => {
	const characters = useStore(state => state.characters);
	const { updateEncounter } = useEncounters();

	const sortCharactersByInitiative = (encounter: Encounter): CharacterWithInitiative[] => {
		const turnTracker = encounter.turnTracker;

		const encounterCharacterIds = Object.keys(encounter.characterPositions);
		const withInitiatives = encounterCharacterIds
			.map(id => {
				const character = characters.find(c => c.id === id);
				const initiative = turnTracker?.initiatives[id] ?? null;
				return { character, initiative };
			})
			.filter((item): item is CharacterWithInitiative => item.character !== undefined);

		// Sort: characters with initiative (highest first), then characters without initiative
		return withInitiatives.sort((a, b) => {
			if (a.initiative === null && b.initiative === null) return 0;
			if (a.initiative === null) return 1;
			if (b.initiative === null) return -1;
			return b.initiative - a.initiative; // Descending order
		});
	};

	const resetCharacterAP = useResetCharacterAP();

	const endTurn = (encounter: Encounter) => {
		const { turnTracker } = encounter;
		if (!turnTracker) {
			return;
		}
		const sortedWithInit = sortCharactersByInitiative(encounter);
		if (sortedWithInit.length === 0) {
			return;
		}

		// Find current index
		const currentTurnCharacterId = turnTracker?.currentTurnCharacterId;
		const currentIdx = sortedWithInit.findIndex(c => c.character.id === currentTurnCharacterId);
		const nextIndex = (currentIdx + 1) % sortedWithInit.length;
		const nextCharacterId = sortedWithInit[nextIndex]?.character.id;

		// Reset Action Points for the current turn character
		if (currentTurnCharacterId) {
			resetCharacterAP(currentTurnCharacterId);
		}

		updateEncounter({
			...encounter,
			turnTracker: {
				...turnTracker,
				currentTurnCharacterId: nextCharacterId,
			},
		});
	};

	return { sortCharactersByInitiative, endTurn };
};
