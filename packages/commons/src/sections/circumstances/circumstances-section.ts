import { CharacterSheet } from '../../character/character-sheet.js';
import { Condition } from '../../core/conditions.js';
import { Exhaustion, ExhaustionData } from '../../core/consequences.js';
import { Resource, ResourceValue } from '../../stats/resources.js';
import { mapEnumToRecord } from '../../utils/utils.js';

export class CircumstancesSection {
	resources: Record<Resource, ResourceValue>;
	exhaustion: ExhaustionData;
	conditions: Condition[];

	constructor({
		resources,
		exhaustion,
		conditions,
	}: {
		resources: Record<Resource, ResourceValue>;
		exhaustion: ExhaustionData;
		conditions: Condition[];
	}) {
		this.resources = resources;
		this.exhaustion = exhaustion;
		this.conditions = conditions;
	}

	static create({ characterSheet }: { characterSheet: CharacterSheet }): CircumstancesSection {
		const currentResources = characterSheet.circumstances.currentResources;
		const statTree = characterSheet.getStatTree();

		const resources = mapEnumToRecord(Resource, resource => currentResources.get(statTree, resource));

		const exhaustion = Exhaustion.fromRank(characterSheet.circumstances.exhaustionRank);
		const conditions = characterSheet.circumstances.conditions;

		return new CircumstancesSection({
			resources,
			exhaustion,
			conditions,
		});
	}
}
