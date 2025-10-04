import { CharacterSheet } from '../../character/character-sheet.js';
import { ActionCost } from '../../core/actions.js';
import { Resource } from '../../stats/resources.js';
import { ActionRowCost } from '../common/action-row.js';

export class DivineSection {
	cost: ActionRowCost;

	constructor({ cost }: { cost: ActionRowCost }) {
		this.cost = cost;
	}

	static create({ characterId, characterSheet }: { characterId: string; characterSheet: CharacterSheet }) {
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

		return new DivineSection({ cost });
	}
}
