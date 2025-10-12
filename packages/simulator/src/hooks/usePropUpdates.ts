import { CharacterSheet, Condition, Resource } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { Character } from '../types/ui';

export type PropUpdates = {
	updateResource: (resource: Resource, delta: number) => void;
	updateExhaustion: (delta: number) => void;
	addCondition: (condition: Condition) => void;
	removeCondition: (condition: Condition) => void;
};

export const usePropUpdates = (character: Character, sheet: CharacterSheet): PropUpdates => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const updateResource = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResource(resource, delta);
		updateCharacterProp(character, resource, newValue.toString());
	};

	const addCondition = (condition: Condition) => {
		const newConditions = Array.from(new Set([...sheet.circumstances.conditions, condition]));
		updateCharacterProp(character, 'conditions', newConditions.join(','));
	};

	const removeCondition = (condition: Condition) => {
		const newConditions = sheet.circumstances.conditions.filter(c => c !== condition);
		updateCharacterProp(character, 'conditions', newConditions.join(','));
	};

	const updateExhaustion = (delta: number) => {
		const newRank = Math.max(0, sheet.circumstances.exhaustionRank + delta);
		updateCharacterProp(character, 'exhaustionRank', newRank.toString());
	};

	return {
		updateResource,
		updateExhaustion,
		addCondition,
		removeCondition,
	};
};
