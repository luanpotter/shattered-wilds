import { asc } from 'type-comparator/build/comparators/index.js';
import { map } from 'type-comparator';
import { AppliedCircumstance } from '../../character/circumstances.js';
import { CharacterSheet } from '../../character/character-sheet.js';
import { Condition } from '../../core/conditions.js';
import { Consequence } from '../../core/consequences.js';
import { Resource, ResourceValue } from '../../stats/resources.js';
import { mapEnumToRecord } from '../../utils/utils.js';

export type CharacterCondition = {
	condition: Condition;
	rank: number;
};

export type CharacterConsequence = {
	consequence: Consequence;
	rank: number;
};

export class CircumstancesSection {
	resources: Record<Resource, ResourceValue>;
	conditions: CharacterCondition[];
	consequences: CharacterConsequence[];
	otherCircumstances: string[];

	constructor({
		resources,
		conditions,
		consequences,
		otherCircumstances,
	}: {
		resources: Record<Resource, ResourceValue>;
		conditions: CharacterCondition[];
		consequences: CharacterConsequence[];
		otherCircumstances: string[];
	}) {
		this.resources = resources;
		this.conditions = conditions;
		this.consequences = consequences;
		this.otherCircumstances = otherCircumstances;
	}

	static create({ characterSheet }: { characterSheet: CharacterSheet }): CircumstancesSection {
		const currentResources = characterSheet.circumstances.currentResources;
		const statTree = characterSheet.getStatTree();

		const resources = mapEnumToRecord(Resource, resource => currentResources.get(statTree, resource));

		const conditions = characterSheet.circumstances.conditions
			.sort(map(c => c.name, asc))
			.map(c => ({ condition: c.name, rank: c.rank }));

		const consequences = characterSheet.circumstances.consequences
			.sort(map(c => c.name, asc))
			.map(c => ({ consequence: c.name, rank: c.rank }));

		const otherCircumstances = characterSheet.circumstances.otherCircumstances;

		return new CircumstancesSection({
			resources,
			conditions,
			consequences,
			otherCircumstances,
		});
	}

	static serializeConditions(conditions: AppliedCircumstance<Condition>[]): string {
		return conditions.map(c => `${c.name}:${c.rank}`).join(',');
	}

	static serializeConsequences(consequences: AppliedCircumstance<Consequence>[]): string {
		return consequences.map(c => `${c.name}:${c.rank}`).join(',');
	}

	static serializeOtherCircumstances(circumstances: string[]): string {
		return circumstances.join('\n');
	}
}
