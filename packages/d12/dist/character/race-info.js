import { FeatInfo, FEATS, FeatType } from '../core/feats.js';
import { Race, RACE_DEFINITIONS, Upbringing } from '../core/races.js';
import { StatType } from '../stats/stat-type.js';
export class RaceInfo {
    primaryRace;
    halfRace;
    combineHalfRaceStats;
    upbringing;
    upbringingPlusModifier;
    upbringingMinusModifier;
    constructor(primaryRace, upbringing, halfRace = null, combineHalfRaceStats = false, upbringingPlusModifier = StatType.INT, upbringingMinusModifier = StatType.WIS) {
        this.primaryRace = primaryRace;
        this.halfRace = halfRace;
        this.combineHalfRaceStats = combineHalfRaceStats;
        this.upbringing = upbringing;
        this.upbringingPlusModifier = upbringingPlusModifier;
        this.upbringingMinusModifier = upbringingMinusModifier;
    }
    get size() {
        return RACE_DEFINITIONS[this.primaryRace].size;
    }
    static from(props) {
        const primaryRace = props['race'] ?? Race.Human;
        const halfRace = props['race.half'] ? props['race.half'] : null;
        const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';
        const upbringing = props['upbringing'] ?? Upbringing.Urban;
        const upbringingPlusModifier = StatType.fromString(props['upbringing.plus'], StatType.INT);
        const upbringingMinusModifier = StatType.fromString(props['upbringing.minus'], StatType.WIS);
        return new RaceInfo(primaryRace, upbringing, halfRace, combineHalfRaceStats, upbringingPlusModifier, upbringingMinusModifier);
    }
    // Get the core feats that should be assigned to this race/upbringing combination
    getCoreFeats(customCoreFeatParameters) {
        const racialFeats = Object.values(FEATS)
            .filter(feat => feat.fitsRace(this.primaryRace, this.upbringing))
            .filter(feat => feat.type === FeatType.Core);
        const parameters = {
            race: this.primaryRace,
            upbringing: this.upbringing,
            'upbringing-favored-modifier': this.upbringingPlusModifier.name,
            'upbringing-disfavored-modifier': this.upbringingMinusModifier.name,
            ...customCoreFeatParameters,
        };
        return FeatInfo.hydrateFeatDefinitions(racialFeats, parameters);
    }
    toString() {
        if (this.halfRace) {
            return `Half ${this.primaryRace} / Half ${this.halfRace}`;
        }
        return this.primaryRace;
    }
}
//# sourceMappingURL=race-info.js.map