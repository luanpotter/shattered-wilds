import { Bonus, Distance } from '../../stats/value.js';
export type InputValue = Distance | Bonus | number;
export declare abstract class InputValueAdapter<T extends InputValue> {
    abstract raw(value: T): string;
    abstract format(value: T): string;
    abstract parse(value: string): T;
    static number: NumberInputAdapter;
    static bonus: BonusInputAdapter;
    static distance: DistanceInputAdapter;
}
declare class NumberInputAdapter extends InputValueAdapter<number> {
    raw(value: number): string;
    format(value: number): string;
    parse(value: string): number;
}
declare class BonusInputAdapter extends InputValueAdapter<Bonus> {
    raw(value: Bonus): string;
    format(value: Bonus): string;
    parse(value: string): Bonus;
}
declare class DistanceInputAdapter extends InputValueAdapter<Distance> {
    raw(value: Distance): string;
    format(value: Distance): string;
    parse(value: string): Distance;
}
export {};
//# sourceMappingURL=section-inputs-adapters.d.ts.map