import { FeatInfo, FEATS, FeatType } from '../core/feats.js';
import { Race, RACE_DEFINITIONS, Upbringing } from '../core/races.js';
import { Size } from '../core/size.js';
import { StatType } from '../stats/stat-type.js';

export class RaceInfo {
	primaryRace: Race;
	halfRace: Race | null;
	combineHalfRaceStats: boolean;
	upbringing: Upbringing;
	upbringingPlusModifier: StatType;
	upbringingMinusModifier: StatType;

	constructor(
		primaryRace: Race,
		upbringing: Upbringing,
		halfRace: Race | null = null,
		combineHalfRaceStats: boolean = false,
		upbringingPlusModifier: StatType = StatType.INT,
		upbringingMinusModifier: StatType = StatType.WIS,
	) {
		this.primaryRace = primaryRace;
		this.halfRace = halfRace;
		this.combineHalfRaceStats = combineHalfRaceStats;
		this.upbringing = upbringing;
		this.upbringingPlusModifier = upbringingPlusModifier;
		this.upbringingMinusModifier = upbringingMinusModifier;
	}

	get size(): Size {
		return RACE_DEFINITIONS[this.primaryRace].size;
	}

	static from(props: Record<string, string>): RaceInfo {
		const primaryRace = (props['race'] as Race) ?? Race.Human;
		const halfRace = props['race.half'] ? (props['race.half'] as Race) : null;
		const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';
		const upbringing = (props['upbringing'] as Upbringing) ?? Upbringing.Urban;
		const upbringingPlusModifier = StatType.fromString(props['upbringing.plus'], StatType.INT);
		const upbringingMinusModifier = StatType.fromString(props['upbringing.minus'], StatType.WIS);

		return new RaceInfo(
			primaryRace,
			upbringing,
			halfRace,
			combineHalfRaceStats,
			upbringingPlusModifier,
			upbringingMinusModifier,
		);
	}

	// Get the core feats that should be assigned to this race/upbringing combination
	getCoreFeats(): FeatInfo<string | void>[] {
		const racialFeats = Object.values(FEATS)
			.filter(feat => feat.fitsRace(this.primaryRace, this.upbringing))
			.filter(feat => feat.type === FeatType.Core);

		const parameters = {
			race: this.primaryRace,
			upbringing: this.upbringing,
			'upbringing-favored-modifier': this.upbringingPlusModifier.name,
			'upbringing-disfavored-modifier': this.upbringingMinusModifier.name,
		};
		return FeatInfo.hydrateFeatDefinitions(racialFeats, parameters);
	}

	toString(): string {
		if (this.halfRace) {
			return `Half ${this.primaryRace} / Half ${this.halfRace}`;
		}
		return this.primaryRace;
	}
}
