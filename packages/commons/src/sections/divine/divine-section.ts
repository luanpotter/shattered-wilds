import { CharacterSheet } from '../../character/character-sheet.js';
import { ActionCost } from '../../core/actions.js';
import { Trait } from '../../core/traits.js';
import { CheckFactory } from '../../engine/check-factory.js';
import { CheckMode, CheckNature } from '../../stats/check.js';
import { DerivedStatType } from '../../stats/derived-stat.js';
import { Resource } from '../../stats/resources.js';
import { StatModifier } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Distance } from '../../stats/value.js';
import { ActionRow, ActionRowBox, ActionRowCost } from '../common/action-row.js';

export class DivineSection {
	baseModifier: StatModifier;
	influenceRange: { value: Distance; description: string };
	pureDivineChanneling: ActionRow;

	constructor({
		baseModifier,
		influenceRange,
		pureDivineChanneling,
	}: {
		baseModifier: StatModifier;
		influenceRange: { value: Distance; description: string };
		pureDivineChanneling: ActionRow;
	}) {
		this.baseModifier = baseModifier;
		this.influenceRange = influenceRange;
		this.pureDivineChanneling = pureDivineChanneling;
	}

	static create({
		characterId,
		characterSheet,
	}: {
		characterId: string;
		characterSheet: CharacterSheet;
	}): DivineSection | undefined {
		const { primaryAttribute } = characterSheet.characterClass.definition;
		if (!StatType.soulAttributes.includes(primaryAttribute.name)) {
			return undefined; // not a mystic
		}

		const tree = characterSheet.getStatTree();
		const influenceRange = tree.getDistance(DerivedStatType.InfluenceRange);
		const baseModifier = tree.getModifier(primaryAttribute);

		const costs = [
			new ActionCost({ resource: Resource.ActionPoint, amount: 2 }),
			new ActionCost({ resource: Resource.SpiritPoint, amount: 1 }),
		];

		const cost = new ActionRowCost({
			characterId,
			characterSheet,
			name: 'Divine Channeling',
			actionCosts: costs,
		});

		const checkFactory = new CheckFactory({ characterSheet });
		const check = checkFactory.create({
			mode: CheckMode.Contested,
			descriptor: 'Divine Channeling',
			nature: CheckNature.Active,
			statModifier: baseModifier,
		});

		const key = 'divine-channeling';

		const pureDivineChanneling = new ActionRow({
			slug: 'Divine_Channeling',
			title: 'Pure Divine Channeling',
			traits: [Trait.Channel],
			description:
				'A plea to the forces of the beyond to grant a desired effect. The vaguer the request, the more likely it is for it to succeed in some form or another.',
			cost,
			boxes: [ActionRowBox.fromCheck({ key, check, targetDC: undefined, errors: [] })],
		});

		return new DivineSection({ baseModifier, influenceRange, pureDivineChanneling });
	}
}
