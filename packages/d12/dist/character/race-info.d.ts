import { FeatInfo } from '../core/feats.js';
import { Race, Upbringing } from '../core/races.js';
import { Size } from '../core/size.js';
import { StatType } from '../stats/stat-type.js';
export declare class RaceInfo {
    primaryRace: Race;
    halfRace: Race | null;
    combineHalfRaceStats: boolean;
    upbringing: Upbringing;
    upbringingPlusModifier: StatType;
    upbringingMinusModifier: StatType;
    constructor(primaryRace: Race, upbringing: Upbringing, halfRace?: Race | null, combineHalfRaceStats?: boolean, upbringingPlusModifier?: StatType, upbringingMinusModifier?: StatType);
    get size(): Size;
    static from(props: Record<string, string>): RaceInfo;
    getCoreFeats(customCoreFeatParameters: Record<string, string>): FeatInfo<string | void>[];
    toString(): string;
}
//# sourceMappingURL=race-info.d.ts.map