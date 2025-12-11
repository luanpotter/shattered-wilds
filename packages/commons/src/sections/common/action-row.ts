import { CharacterSheet } from '../../character/character-sheet.js';
import { ArcaneSpellSchool } from '../../core/arcane.js';
import { Trait } from '../../core/traits.js';
import { Check } from '../../stats/check.js';
import { ResourceCost } from '../../stats/resources.js';
import { Value } from '../../stats/value.js';

export class ActionRowCost {
	characterId: string;
	characterSheet: CharacterSheet;
	name: string;
	actionCosts: ResourceCost[];
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
		actionCosts: ResourceCost[];
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
	inputValue: number;
	value: Value;

	constructor({ inputValue, value }: { inputValue: number; value: Value }) {
		this.inputValue = inputValue;
		this.value = value;
	}

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

	static fromCheck({
		key,
		check,
		targetDC,
		errors,
	}: {
		key: string;
		check: Check;
		targetDC: number | undefined;
		errors: ActionRowCheckBoxError[];
	}): ActionRowBox {
		const tooltip = [
			`Stat: ${check.statModifier.statType}`,
			check.statModifier.description,
			`Check type: ${check.mode}-${check.nature}`,
			targetDC && `Target DC: ${targetDC}`,
		]
			.filter(Boolean)
			.join('\n');

		const data = new ActionRowCheckBox({ check, targetDC, errors });

		const inherentModifier = check.statModifier.inherentModifier;
		const name = check.statModifier.statType;
		const title = `${name} (${inherentModifier.description})`;

		return new ActionRowBox({
			key,
			labels: [title],
			tooltip,
			data,
		});
	}
}

export class ActionRow {
	slug: string;
	cost: ActionRowCost | undefined;
	title: string;
	traits: (Trait | ArcaneSpellSchool)[] = [];
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
		traits: (Trait | ArcaneSpellSchool)[];
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
