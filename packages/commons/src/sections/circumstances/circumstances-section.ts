import { CharacterSheet, CurrentResources } from '../../character/character-sheet';

export class CircumstancesSection {
	currentResources: CurrentResources;

	constructor({ currentResources }: { currentResources: CurrentResources }) {
		this.currentResources = currentResources;
	}

	static create({ characterSheet }: { characterSheet: CharacterSheet }): CircumstancesSection {
		const currentResources = characterSheet.currentResources;

		return new CircumstancesSection({
			currentResources,
		});
	}
}
