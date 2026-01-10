export class Bonus {
    value;
    constructor({ value }) {
        this.value = value;
    }
    get isZero() {
        return this.value === 0;
    }
    get isNotZero() {
        return !this.isZero;
    }
    get description() {
        const sign = this.value >= 0 ? '+' : '-';
        return `${sign}${Math.abs(this.value)}`;
    }
    static add(values) {
        return Bonus.of(values.reduce((sum, e) => sum + e.value, 0));
    }
    static of(value) {
        return new Bonus({ value });
    }
    static zero() {
        return Bonus.of(0);
    }
    static fromJSON(data) {
        if (data instanceof Bonus)
            return data;
        return Bonus.of(data.value);
    }
}
export class Distance {
    value;
    constructor({ value }) {
        this.value = Math.max(value, 1);
    }
    get description() {
        if (this.value === 1) {
            return `${this.value} Hex`;
        }
        else {
            return `${this.value} Hexes`;
        }
    }
    times(factor) {
        return Distance.of(this.value * factor);
    }
    isMelee() {
        return this.value === 1;
    }
    static of(value) {
        return new Distance({ value });
    }
    static melee() {
        return Distance.of(1);
    }
}
//# sourceMappingURL=value.js.map