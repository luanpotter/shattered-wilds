import { Check, DiceRoll, DiceRoller, EntropyProvider } from '@shattered-wilds/d12';

const entropyProvider: EntropyProvider<void> = async (count: number) => ({
	values: Array.from({ length: count }, () => Math.floor(Math.random() * 12) + 1),
	context: undefined,
});

export const diceRoller = new DiceRoller(entropyProvider);

/**
 * Roll a check and return the total and shifts.
 * This is a simplified helper for when you just need the result without the full modal UI.
 */
export const rollCheck = async (
	check: Check,
	options?: { characterName?: string; targetDC?: number },
): Promise<{ total: number; shifts: number }> => {
	const roll: DiceRoll = {
		characterName: options?.characterName ?? 'Unknown',
		check,
		targetDC: options?.targetDC,
		extra: undefined,
		luck: undefined,
	};

	const result = await diceRoller.roll(roll);

	return {
		total: result.total,
		shifts: result.critShifts,
	};
};
