import { AppliedCircumstance, CharacterSheet, Condition, Consequence, Resource } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { Character } from '../types/ui';

export type PropUpdates = {
	updateResourceByDelta: (resource: Resource, delta: number) => void;
	updateResourceToMax: (resource: Resource) => void;
	updateResourceToValue: (resource: Resource, value: number) => void;
	addCondition: (condition: AppliedCircumstance<Condition>) => void;
	removeCondition: (condition: Condition) => void;
	removeAllConditions: () => void;
	addConsequence: (consequence: AppliedCircumstance<Consequence>) => void;
	addToConsequenceRank: (consequence: Consequence, delta: number) => void;
	removeConsequence: (consequence: Consequence) => void;
};

export const usePropUpdates = (character: Character, sheet: CharacterSheet): PropUpdater => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	return new PropUpdater({ character, sheet, updateCharacterProp });
};

export class PropUpdater {
	private character: Character;
	private sheet: CharacterSheet;
	private updateCharacterProp: (character: Character, prop: string, value: string) => void;

	constructor({
		character,
		sheet,
		updateCharacterProp,
	}: {
		character: Character;
		sheet: CharacterSheet;
		updateCharacterProp: (character: Character, prop: string, value: string) => void;
	}) {
		this.character = character;
		this.sheet = sheet;
		this.updateCharacterProp = updateCharacterProp;
	}

	updateResourceProp = (resource: Resource, value: number) => {
		this.updateCharacterProp(this.character, resource, value.toString());
	};

	updateResourceToValue = (resource: Resource, value: number) => {
		const newValue = this.sheet.updateResourceToValue(resource, value);
		this.updateResourceProp(resource, newValue);
	};

	updateResourceToMax = (resource: Resource) => {
		const newValue = this.sheet.updateResourceToMax(resource);
		this.updateResourceProp(resource, newValue);
	};

	updateResourceByDelta = (resource: Resource, delta: number) => {
		const newValue = this.sheet.updateResourceByDelta(resource, delta);
		this.updateResourceProp(resource, newValue);
	};

	serializeConditions = (conditions: AppliedCircumstance<Condition>[]) => {
		const conditionsProp = conditions.map(c => `${c.name}:${c.rank}`).join(',');
		this.updateCharacterProp(this.character, 'conditions', conditionsProp);
	};

	filterConditionOut = (condition: Condition) => {
		return this.sheet.circumstances.conditions.filter(c => c.name !== condition);
	};

	addCondition = (condition: AppliedCircumstance<Condition>) => {
		const newConditions = [...this.filterConditionOut(condition.name), condition];
		this.serializeConditions(newConditions);
	};

	removeCondition = (condition: Condition) => {
		const newConditions = this.filterConditionOut(condition);
		this.serializeConditions(newConditions);
	};

	removeAllConditions = () => {
		this.serializeConditions([]);
	};

	serializeConsequences = (consequences: AppliedCircumstance<Consequence>[]) => {
		const consequencesProp = consequences.map(c => `${c.name}:${c.rank}`).join(',');
		this.updateCharacterProp(this.character, 'consequences', consequencesProp);
	};

	filterConsequenceOut = (consequence: Consequence) => {
		return this.sheet.circumstances.consequences.filter(c => c.name !== consequence);
	};

	addConsequence = (consequence: AppliedCircumstance<Consequence>) => {
		const newConsequences = [...this.filterConsequenceOut(consequence.name), consequence];
		this.serializeConsequences(newConsequences);
	};

	removeConsequence = (consequence: Consequence) => {
		const newConsequences = this.filterConsequenceOut(consequence);
		this.serializeConsequences(newConsequences);
	};

	addToConsequenceRank = (consequence: Consequence, delta: number) => {
		const existing = this.sheet.circumstances.consequences.find(c => c.name === consequence);
		const newRank = (existing?.rank ?? 0) + delta;
		if (newRank <= 0) {
			this.removeConsequence(consequence);
		} else {
			const newConsequences = existing
				? [...this.filterConsequenceOut(consequence), { ...existing, rank: newRank }]
				: [...this.sheet.circumstances.consequences, { name: consequence, rank: newRank }];
			this.serializeConsequences(newConsequences);
		}
	};
}
