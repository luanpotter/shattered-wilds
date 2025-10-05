import { Check, CheckMode, CheckNature } from './check.js';
import { DERIVED_STATS, DerivedStatType } from './derived-stat.js';
import { CircumstanceModifier, ModifierSource, StatModifier } from './stat-tree.js';
import { StatType, StatTypeName } from './stat-type.js';
import { Bonus } from './value.js';

/**
 * This is a transport-friendly representation of a dice roll requests;
 * used to "copy" rolls into VTT contexts.
 */
export interface DiceRoll {
	characterName: string; // name of the character to roll for (display purposes only)
	check: Check; // the check to roll
	extra: // whether to add the extra die, and if so, the parameters
	| {
				name: string; // name of the extra attribute (e.g. "STR", "DEX")
				value: number; // the value of the attribute to check if the extra die is valid
		  }
		| undefined;
	luck: // whether to add the luck die, and if so, the parameters
	| {
				value: number; // the value of the attribute to check if the luck die is valid
		  }
		| undefined;
	targetDC: number | undefined; // the target DC to check if the roll is successful (optional)
}

// This is an internal, simplified version of DiceRoll used for JSON serialization
interface DiceRollJson {
	characterName: string;
	check: {
		mode: CheckMode;
		nature: CheckNature;
		descriptor: string;
		statModifier: {
			statTypeName: StatTypeName | DerivedStatType;
			baseValue: number;
			appliedModifiers: {
				name: string;
				source: ModifierSource;
				value: number;
			}[];
			value: number;
			overrideDescription: string | undefined;
		};
	};
	extra:
		| {
				name: string;
				value: number;
		  }
		| undefined;
	luck:
		| {
				value: number;
		  }
		| undefined;
	targetDC: number | undefined;
}

/**
 * We encode dice rolls in the format:
 * /d12 {json}
 * But we strip some of the more complex objects (e.g. StatType) into just strings for simplicity.
 */
export const DiceRollEncoder = {
	encode(roll: DiceRoll): string {
		const json: DiceRollJson = {
			characterName: roll.characterName,
			check: {
				mode: roll.check.mode,
				nature: roll.check.nature,
				descriptor: roll.check.descriptor,
				statModifier: {
					statTypeName: roll.check.statModifier.name,
					baseValue: roll.check.statModifier.baseValue.value,
					appliedModifiers: roll.check.statModifier.appliedModifiers.map(mod => ({
						name: mod.name,
						source: mod.source,
						value: mod.value.value,
					})),
					value: roll.check.statModifier.value.value,
					overrideDescription: roll.check.statModifier.overrideDescription,
				},
			},
			extra: roll.extra
				? {
						name: roll.extra.name,
						value: roll.extra.value,
					}
				: undefined,
			luck: roll.luck
				? {
						value: roll.luck.value,
					}
				: undefined,
			targetDC: roll.targetDC,
		};
		return `/d12 ${JSON.stringify(json)}`;
	},

	decode(command: string, { fallbackCharacterName }: { fallbackCharacterName?: string }): DiceRoll {
		const match = command.trim().match(/^\/d12\s+(.+)$/);
		const data = match ? match[1] : null;
		if (!data) {
			throw new Error(`Invalid dice roll command format: ${command}`);
		}

		try {
			const json = JSON.parse(data) as DiceRollJson;
			// need to rehydrate the Check instance
			return <DiceRoll>{
				...json,
				characterName: json.characterName || fallbackCharacterName || 'Unknown',
				check: new Check({
					mode: json.check.mode,
					nature: json.check.nature,
					descriptor: json.check.descriptor,
					statModifier: new StatModifier({
						statType: rehydrateStat(json.check.statModifier.statTypeName),
						baseValue: Bonus.of(json.check.statModifier.baseValue),
						appliedModifiers: json.check.statModifier.appliedModifiers.map(
							mod =>
								new CircumstanceModifier({
									name: mod.name,
									source: mod.source,
									value: Bonus.of(mod.value),
								}),
						),
						value: Bonus.of(json.check.statModifier.value),
						overrideDescription: json.check.statModifier.overrideDescription,
					}),
				}),
			};
		} catch (err) {
			throw new Error(`Failed to parse dice roll command JSON: ${err}`);
		}
	},
};

const rehydrateStat = (stat: string): StatType | DerivedStatType => {
	const result = StatType.values.find(s => s.name === stat) ?? DERIVED_STATS[stat as keyof typeof DERIVED_STATS]?.type;
	if (!result) {
		throw new Error(`Unknown stat type: ${stat}`);
	}
	return result;
};
