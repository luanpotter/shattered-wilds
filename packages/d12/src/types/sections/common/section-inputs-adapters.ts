import { Bonus, Distance } from '../../stats/value.js';

export type InputValue = Distance | Bonus | number;

export abstract class InputValueAdapter<T extends InputValue> {
	abstract raw(value: T): string;
	abstract format(value: T): string;
	abstract parse(value: string): T;

	static number: NumberInputAdapter;
	static bonus: BonusInputAdapter;
	static distance: DistanceInputAdapter;
}

class NumberInputAdapter extends InputValueAdapter<number> {
	raw(value: number): string {
		return `${value}`;
	}

	format(value: number): string {
		return `${value}`;
	}

	parse(value: string): number {
		const parsed = parseInt(value);
		if (isNaN(parsed)) {
			return 0;
		}
		return parsed;
	}
}

class BonusInputAdapter extends InputValueAdapter<Bonus> {
	raw(value: Bonus): string {
		return InputValueAdapter.number.raw(value.value);
	}

	format(value: Bonus): string {
		return value.description;
	}

	parse(value: string): Bonus {
		return Bonus.of(InputValueAdapter.number.parse(value));
	}
}

class DistanceInputAdapter extends InputValueAdapter<Distance> {
	raw(value: Distance): string {
		return InputValueAdapter.number.raw(value.value);
	}

	format(value: Distance): string {
		return value.description;
	}

	parse(value: string): Distance {
		return Distance.of(InputValueAdapter.number.parse(value));
	}
}

InputValueAdapter.number = new NumberInputAdapter();
InputValueAdapter.bonus = new BonusInputAdapter();
InputValueAdapter.distance = new DistanceInputAdapter();
