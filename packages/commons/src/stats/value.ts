export interface Value {
	value: number;
	description: string;
}

export class Bonus implements Value {
	value: number;

	constructor({ value }: { value: number }) {
		this.value = value;
	}

	get isZero(): boolean {
		return this.value === 0;
	}

	get isNotZero(): boolean {
		return !this.isZero;
	}

	get description(): string {
		const sign = this.value >= 0 ? '+' : '-';
		return `${sign}${Math.abs(this.value)}`;
	}

	static add(values: Bonus[]): Bonus {
		return Bonus.of(values.reduce((sum, e) => sum + e.value, 0));
	}

	static of(value: number): Bonus {
		return new Bonus({ value });
	}

	static zero(): Bonus {
		return Bonus.of(0);
	}
}

export class Distance implements Value {
	value: number;

	constructor({ value }: { value: number }) {
		this.value = Math.max(value, 1);
	}

	get description(): string {
		if (this.value === 1) {
			return `${this.value} Hex`;
		} else {
			return `${this.value} Hexes`;
		}
	}

	isMelee(): boolean {
		return this.value === 1;
	}

	static of(value: number): Distance {
		return new Distance({ value });
	}

	static melee(): Distance {
		return Distance.of(1);
	}
}
