import { AppliedCircumstance, CharacterSheet, Condition, Consequence, Resource } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { Character } from '../types/ui';

export type PropUpdates = {
	updateResourceByDelta: (resource: Resource, delta: number) => void;
	updateResourceToMax: (resource: Resource) => void;
	updateResourceToValue: (resource: Resource, value: number) => void;
	addCondition: (condition: AppliedCircumstance<Condition>) => void;
	removeCondition: (condition: Condition) => void;
	addConsequence: (consequence: AppliedCircumstance<Consequence>) => void;
	addToConsequenceRank: (consequence: Consequence, delta: number) => void;
	removeConsequence: (consequence: Consequence) => void;
};

export const usePropUpdates = (character: Character, sheet: CharacterSheet): PropUpdates => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const updateResourceProp = (resource: Resource, value: number) => {
		updateCharacterProp(character, resource, value.toString());
	};

	const updateResourceToValue = (resource: Resource, value: number) => {
		const newValue = sheet.updateResourceToValue(resource, value);
		updateResourceProp(resource, newValue);
	};

	const updateResourceToMax = (resource: Resource) => {
		const newValue = sheet.updateResourceToMax(resource);
		updateResourceProp(resource, newValue);
	};

	const updateResourceByDelta = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResourceByDelta(resource, delta);
		updateResourceProp(resource, newValue);
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

	const addToConsequenceRank = (consequence: Consequence, delta: number) => {
		const existing = sheet.circumstances.consequences.find(c => c.name === consequence);
		const newRank = (existing?.rank ?? 0) + delta;
		if (newRank <= 0) {
			removeConsequence(consequence);
		} else {
			const newConsequences = existing
				? [...filterConsequenceOut(consequence), { ...existing, rank: newRank }]
				: [...sheet.circumstances.consequences, { name: consequence, rank: newRank }];
			serializeConsequences(newConsequences);
		}
	};

	return {
		updateResourceByDelta,
		updateResourceToMax,
		updateResourceToValue,
		addCondition,
		removeCondition,
		addConsequence,
		addToConsequenceRank,
		removeConsequence,
	};
};
