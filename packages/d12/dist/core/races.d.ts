import { Size } from './size.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';
export declare enum Race {
    Human = "Human",
    Elf = "Elf",
    Dwarf = "Dwarf",
    Orc = "Orc",
    Fey = "Fey",
    Goliath = "Goliath",
    Goblin = "Goblin"
}
export declare enum Upbringing {
    Urban = "Urban",
    Nomadic = "Nomadic",
    Tribal = "Tribal",
    Sylvan = "Sylvan",
    Telluric = "Telluric"
}
export interface UpbringingDefinition {
    name: Upbringing;
    description: string;
}
export declare const UPBRINGING_DEFINITIONS: Record<Upbringing, UpbringingDefinition>;
export interface RacialStatModifier {
    statType: StatType;
    value: Bonus;
}
export interface RaceDefinition {
    name: Race;
    size: Size;
    modifiers: RacialStatModifier[];
    typicalUpbringings: Upbringing[];
}
export declare const RACE_DEFINITIONS: Record<Race, RaceDefinition>;
//# sourceMappingURL=races.d.ts.map