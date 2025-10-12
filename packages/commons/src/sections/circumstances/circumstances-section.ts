import { asc } from 'type-comparator/build/comparators/index.js';
import { CharacterSheet } from '../../character/character-sheet.js';
import { Condition } from '../../core/conditions.js';
import { Consequence } from '../../core/consequences.js';
import { Resource, ResourceValue } from '../../stats/resources.js';
import { mapEnumToRecord } from '../../utils/utils.js';
import { map } from 'type-comparator';

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

	constructor({
		resources,
		conditions,
		consequences,
	}: {
		resources: Record<Resource, ResourceValue>;
		conditions: CharacterCondition[];
		consequences: CharacterConsequence[];
	}) {
		this.resources = resources;
		this.conditions = conditions;
		this.consequences = consequences;
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

		return new CircumstancesSection({
			resources,
			conditions,
			consequences,
		});
	}
}
