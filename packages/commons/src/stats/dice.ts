import { Check } from './check.js';
import { CircumstanceModifier, StatModifier } from './stat-tree.js';
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

export const DiceRollEncoder = {
	encode(roll: DiceRoll): string {
		// encode in the format:
		// /d12 { ...json... }
		const json = JSON.stringify(roll);
		return `/d12 ${json}`;
	},

	decode(command: string, { fallbackCharacterName }: { fallbackCharacterName?: string }): DiceRoll {
		const match = command.match(/^\/d12\s+(.+)$/);
		const data = match ? match[1] : null;
		if (!data) {
			throw new Error(`Invalid dice roll command format: ${command}`);
		}

		try {
			const json = JSON.parse(data) as DiceRoll;
			// need to rehydrate the Check instance
			return {
				...json,
				characterName: json.characterName || fallbackCharacterName || 'Unknown',
				check: new Check({
					mode: json.check.mode,
					nature: json.check.nature,
					statModifier: new StatModifier({
						statType: json.check.statModifier.statType,
						baseValue: Bonus.of(json.check.statModifier.baseValue.value),
						appliedModifiers: json.check.statModifier.appliedModifiers.map(
							mod =>
								new CircumstanceModifier({
									name: mod.name,
									source: mod.source,
									value: Bonus.of(mod.value.value),
								}),
						),
						value: Bonus.of(json.check.statModifier.value.value),
						overrideDescription: json.check.statModifier.overrideDescription,
					}),
				}),
			};
		} catch (err) {
			throw new Error(`Failed to parse dice roll command JSON: ${err}`);
		}
	},
};
