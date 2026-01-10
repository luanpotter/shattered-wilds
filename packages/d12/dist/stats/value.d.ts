export interface Value {
    value: number;
    description: string;
}
export declare class Bonus implements Value {
    value: number;
    constructor({ value }: {
        value: number;
    });
    get isZero(): boolean;
    get isNotZero(): boolean;
    get description(): string;
    static add(values: Bonus[]): Bonus;
    static of(value: number): Bonus;
    static zero(): Bonus;
    static fromJSON(data: {
        value: number;
    }): Bonus;
}
export declare class Distance implements Value {
    value: number;
    constructor({ value }: {
        value: number;
    });
    get description(): string;
    times(factor: number): Distance;
    isMelee(): boolean;
    static of(value: number): Distance;
    static melee(): Distance;
}
//# sourceMappingURL=value.d.ts.map