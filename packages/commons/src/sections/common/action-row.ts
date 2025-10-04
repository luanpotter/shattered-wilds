import { CharacterSheet } from '../../character/character-sheet.js';
import { ActionCost } from '../../core/actions.js';
import { Trait } from '../../core/traits.js';

export class ActionRowCost {
	characterId: string;
	characterSheet: CharacterSheet;
	name: string;
	actionCosts: ActionCost[];
	canAfford: boolean;

	constructor({
		characterId,
		characterSheet,
		name,
		actionCosts,
	}: {
		characterId: string;
		characterSheet: CharacterSheet;
		name: string;
		actionCosts: ActionCost[];
	}) {
		this.characterId = characterId;
		this.characterSheet = characterSheet;
		this.name = name;
		this.actionCosts = actionCosts;
		this.canAfford = actionCosts.every(cost => characterSheet.getResource(cost.resource).current >= cost.amount);
	}
}

export class ActionRowBox {
	label: string;

	constructor({ label }: { label: string }) {
		this.label = label;
	}
}

export class ActionRow {
	key: string;
	cost: ActionRowCost | undefined;
	title: string;
	traits: Trait[] = [];
	description: string;
	boxes: ActionRowBox[];

	constructor({
		key,
		cost,
		title,
		traits,
		description,
		boxes,
	}: {
		key: string;
		cost: ActionRowCost | undefined;
		title: string;
		traits: Trait[];
		description: string;
		boxes: ActionRowBox[];
	}) {
		this.key = key;
		this.cost = cost;
		this.title = title;
		this.traits = traits;
		this.description = description;
		this.boxes = boxes;
	}
}
