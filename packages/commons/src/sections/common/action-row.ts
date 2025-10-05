import { CharacterSheet } from '../../character/character-sheet.js';
import { ActionCost } from '../../core/actions.js';
import { Trait } from '../../core/traits.js';
import { Check } from '../../stats/check.js';
import { Value } from '../../stats/value.js';

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

export class ActionRowValueBox {
	value: Value;

	constructor({ value }: { value: Value }) {
		this.value = value;
	}

	hasErrors(): boolean {
		return false;
	}
}

export class ActionRowVariableBox {
	// TODO

	hasErrors(): boolean {
		return false;
	}
}

export class ActionRowCheckBoxError {
	title: string;
	tooltip: string;
	text: string;

	constructor({ title, tooltip, text }: { title: string; tooltip: string; text: string }) {
		this.title = title;
		this.tooltip = tooltip;
		this.text = text;
	}
}

export class ActionRowCheckBox {
	check: Check;
	targetDC: number | undefined;
	errors: ActionRowCheckBoxError[];

	constructor({
		check,
		targetDC,
		errors,
	}: {
		check: Check;
		targetDC: number | undefined;
		errors: ActionRowCheckBoxError[];
	}) {
		this.check = check;
		this.targetDC = targetDC;
		this.errors = errors;
	}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}
}

export class ActionRowBox {
	key: string;
	labels: string[];
	tooltip: string;
	data: ActionRowValueBox | ActionRowVariableBox | ActionRowCheckBox;

	constructor({
		key,
		labels,
		tooltip,
		data,
	}: {
		key: string;
		labels: string[];
		tooltip: string;
		data: ActionRowValueBox | ActionRowCheckBox;
	}) {
		this.key = key;
		this.labels = labels;
		this.tooltip = tooltip;
		this.data = data;
	}

	hasErrors(): boolean {
		return this.data.hasErrors();
	}
}

export class ActionRow {
	slug: string;
	cost: ActionRowCost | undefined;
	title: string;
	traits: Trait[] = [];
	description: string;
	boxes: ActionRowBox[];

	constructor({
		slug,
		cost,
		title,
		traits,
		description,
		boxes,
	}: {
		slug: string;
		cost: ActionRowCost | undefined;
		title: string;
		traits: Trait[];
		description: string;
		boxes: ActionRowBox[];
	}) {
		this.slug = slug;
		this.cost = cost;
		this.title = title;
		this.traits = traits;
		this.description = description;
		this.boxes = boxes;
	}

	hasErrors(): boolean {
		if (this.cost !== undefined && !this.cost.canAfford) {
			return true;
		}
		return this.boxes.some(box => box.hasErrors());
	}
}
