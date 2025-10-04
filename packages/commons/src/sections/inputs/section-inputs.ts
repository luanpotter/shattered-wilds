import { Resource, RESOURCES } from '../../stats/resources.js';
import { Bonus, Distance } from '../../stats/value.js';
import { InputValue, InputValueAdapter } from './section-inputs-adapters.js';

export abstract class SectionInput {
	key: string;
	label: string;
	tooltip: string;

	constructor({ key, label, tooltip }: { key: string; label: string; tooltip: string }) {
		this.key = key;
		this.label = label;
		this.tooltip = tooltip;
	}
}

export abstract class FixedInput<T extends InputValue> extends SectionInput {
	value: T;

	constructor({ key, label, tooltip, value }: { key: string; label: string; tooltip: string; value: T }) {
		super({ key, label, tooltip });
		this.value = value;
	}

	abstract adapter(): InputValueAdapter<T>;

	getAsString(): string {
		return this.adapter().format(this.value);
	}
}

export class FixedNumberInput extends FixedInput<number> {
	constructor({ key, label, tooltip, value }: { key: string; label: string; tooltip: string; value: number }) {
		super({ key, label, tooltip, value });
	}

	adapter(): InputValueAdapter<number> {
		return InputValueAdapter.number;
	}
}

export class FixedBonusInput extends FixedInput<Bonus> {
	constructor({ key, label, tooltip, value }: { key: string; label: string; tooltip: string; value: Bonus }) {
		super({ key, label, tooltip, value });
	}

	adapter(): InputValueAdapter<Bonus> {
		return InputValueAdapter.bonus;
	}
}

export class FixedDistanceInput extends FixedInput<Distance> {
	constructor({ key, label, tooltip, value }: { key: string; label: string; tooltip: string; value: Distance }) {
		super({ key, label, tooltip, value });
	}

	adapter(): InputValueAdapter<Distance> {
		return InputValueAdapter.distance;
	}
}

export class ResourceInput extends SectionInput {
	resource: Resource;

	constructor({ key, resource }: { key: string; resource: Resource }) {
		super({
			key,
			label: RESOURCES[resource].shortName,
			tooltip: RESOURCES[resource].description,
		});
		this.resource = resource;
	}
}

export abstract class TextInput<T extends InputValue> extends SectionInput {
	getter: () => T;
	setter: (value: T) => void;

	constructor({
		key,
		label,
		tooltip,
		getter,
		setter,
	}: {
		key: string;
		label: string;
		tooltip: string;
		getter: () => T;
		setter: (value: T) => void;
	}) {
		super({ key, label, tooltip });
		this.getter = getter;
		this.setter = setter;
	}

	abstract adapter(): InputValueAdapter<T>;

	getAsRaw(): string {
		return this.adapter().raw(this.getter());
	}

	getAsString(): string {
		return this.adapter().format(this.getter());
	}

	setFromString(value: string) {
		this.setter(this.adapter().parse(value));
	}
}

export class NumberInput extends TextInput<number> {
	adapter(): InputValueAdapter<number> {
		return InputValueAdapter.number;
	}
}

export class BonusInput extends TextInput<Bonus> {
	adapter(): InputValueAdapter<Bonus> {
		return InputValueAdapter.bonus;
	}
}

export class DistanceInput extends TextInput<Distance> {
	adapter(): InputValueAdapter<Distance> {
		return InputValueAdapter.distance;
	}
}

export class DropdownInput<T> extends SectionInput {
	options: T[];
	describe: (option: T) => string;
	getter: () => T;
	setter: (value: T) => void;

	constructor({
		key,
		label,
		tooltip,
		options,
		describe,
		getter,
		setter,
	}: {
		key: string;
		label: string;
		tooltip: string;
		options: T[];
		describe: (option: T) => string;
		getter: () => T;
		setter: (value: T) => void;
	}) {
		super({ key, label, tooltip });
		this.options = options;
		this.describe = describe;
		this.getter = getter;
		this.setter = setter;
	}
}
