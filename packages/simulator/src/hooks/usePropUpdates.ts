import { AppliedCircumstance, CharacterSheet, Condition, Consequence, Resource } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { Character } from '../types/ui';

export type PropUpdates = {
	updateResource: (resource: Resource, delta: number) => void;
	addCondition: (condition: AppliedCircumstance<Condition>) => void;
	removeCondition: (condition: Condition) => void;
	addConsequence: (consequence: AppliedCircumstance<Consequence>) => void;
	removeConsequence: (consequence: Consequence) => void;
};

export const usePropUpdates = (character: Character, sheet: CharacterSheet): PropUpdates => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const updateResource = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResource(resource, delta);
		updateCharacterProp(character, resource, newValue.toString());
	};

	const serializeConditions = (conditions: AppliedCircumstance<Condition>[]) => {
		const conditionsProp = conditions.map(c => `${c.name}:${c.rank}`).join(',');
		updateCharacterProp(character, 'conditions', conditionsProp);
	};

	const filterConditionOut = (condition: Condition) => {
		return sheet.circumstances.conditions.filter(c => c.name !== condition);
	};

	const addCondition = (condition: AppliedCircumstance<Condition>) => {
		const newConditions = [...filterConditionOut(condition.name), condition];
		serializeConditions(newConditions);
	};

	const removeCondition = (condition: Condition) => {
		const newConditions = filterConditionOut(condition);
		serializeConditions(newConditions);
	};

	const serializeConsequences = (consequences: AppliedCircumstance<Consequence>[]) => {
		const consequencesProp = consequences.map(c => `${c.name}:${c.rank}`).join(',');
		updateCharacterProp(character, 'consequences', consequencesProp);
	};

	const filterConsequenceOut = (consequence: Consequence) => {
		return sheet.circumstances.consequences.filter(c => c.name !== consequence);
	};

	const addConsequence = (consequence: AppliedCircumstance<Consequence>) => {
		const newConsequences = [...filterConsequenceOut(consequence.name), consequence];
		serializeConsequences(newConsequences);
	};

	const removeConsequence = (consequence: Consequence) => {
		const newConsequences = filterConsequenceOut(consequence);
		serializeConsequences(newConsequences);
	};

	return {
		updateResource,
		addCondition,
		removeCondition,
		addConsequence,
		removeConsequence,
	};
};
