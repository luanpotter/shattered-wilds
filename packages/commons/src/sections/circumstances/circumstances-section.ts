import { CharacterSheet } from '../../character/character-sheet.js';
import { Resource, ResourceValue } from '../../stats/resources.js';
import { mapEnumToRecord } from '../../utils/utils.js';

export class CircumstancesSection {
	resources: Record<Resource, ResourceValue>;

	constructor({ resources }: { resources: Record<Resource, ResourceValue> }) {
		this.resources = resources;
	}

	static create({ characterSheet }: { characterSheet: CharacterSheet }): CircumstancesSection {
		const currentResources = characterSheet.circumstances.currentResources;
		const statTree = characterSheet.getStatTree();

		const resources = mapEnumToRecord(Resource, resource => currentResources.get(statTree, resource));

		return new CircumstancesSection({
			resources,
		});
	}
}
