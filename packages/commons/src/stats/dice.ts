import { Check } from './check.js';

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

/**
 * JSON-serialized shape of DiceRoll - this is what JSON.stringify produces.
 * Used for type safety when parsing JSON.
 */
interface DiceRollJson {
	characterName: string;
	check: Parameters<typeof Check.fromJSON>[0];
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
 * JSON.stringify naturally serializes the class instances.
 */
export const DiceRollEncoder = {
	encode(roll: DiceRoll): string {
		return `/d12 ${JSON.stringify(roll)}`;
	},

	decode(command: string, { fallbackCharacterName }: { fallbackCharacterName?: string }): DiceRoll {
		const match = command.trim().match(/^\/d12\s+(.+)$/);
		const data = match ? match[1] : null;
		if (!data) {
			throw new Error(`Invalid dice roll command format: ${command}`);
		}

		try {
			const json = JSON.parse(data) as DiceRollJson;
			return {
				characterName: json.characterName || fallbackCharacterName || 'Unknown',
				check: Check.fromJSON(json.check),
				extra: json.extra,
				luck: json.luck,
				targetDC: json.targetDC,
			};
		} catch (err) {
			throw new Error(`Failed to parse dice roll command JSON: ${err}`);
		}
	},
};
