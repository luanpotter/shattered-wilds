import { CheckNature, CheckType } from './check.js';

/**
 * Output from an entropy provider roll.
 * Contains the dice values and an optional context for the caller.
 * @template T - The type of context returned (e.g., FoundryRoll for VTT, void for simulator)
 */
export interface RollOutput<T = void> {
	values: number[];
	context: T;
}

/**
 * An async function that rolls multiple d12s at once.
 * Returns both the dice values and an optional context object.
 * @template T - The type of context returned alongside the dice values
 */
export type EntropyProvider<T = void> = (count: number) => Promise<RollOutput<T>>;

/**
 * Represents a single die result
 */
export interface DieResult {
	value: number;
	valid?: boolean; // For extra/luck dice, whether the roll is valid (below threshold)
	type: 'base' | 'extra' | 'luck';
}

/**
 * Configuration for extra die
 */
export interface ExtraDieConfig {
	name: string; // Name of the attribute (e.g. "STR", "DEX")
	value: number; // The threshold value - roll must be <= this to be valid
}

/**
 * Configuration for luck die
 */
export interface LuckDieConfig {
	value: number; // Fortune threshold value - roll must be <= this to be valid
}

/**
 * Complete configuration for a dice roll
 */
export interface DiceRollConfig {
	modifierValue: number; // The total modifier to add to the roll
	checkType: CheckType; // The type of check being made
	targetDC: number | null; // The target DC (if applicable)
	extra?: ExtraDieConfig; // Extra die configuration (if using)
	luck?: LuckDieConfig; // Luck die configuration (if using)
}

/**
 * Results from a dice roll, including the entropy context
 * @template T - The type of context from the entropy provider
 */
export interface RollResults<T = void> {
	dice: DieResult[];
	selectedDice: number[]; // The two highest valid dice values (for display)
	autoFail: boolean;
	total: number;
	critModifiers: number;
	critShifts: number;
	success: boolean | undefined;
	hasPairOfOnes: boolean;
	context: T; // The context from the entropy provider (e.g., FoundryRoll)
}

/**
 * Calculate shifts based on excess over DC
 * Shifting window: +6, then +12, then +18, ...
 */
const calculateShifts = (excess: number): number => {
	if (excess < 6) return 0;
	let shifts = 0;
	let next = 6;
	let add = 6;
	while (excess >= next) {
		shifts++;
		add += 6;
		next += add; // 6, 18, 36, ...
	}
	return shifts;
};

/**
 * Check if auto-fail is possible for this check type
 * Auto-fail only applies to Active checks
 */
const canAutoFail = (checkType: CheckType): boolean => checkType.endsWith(`-${CheckNature.Active}`);

/**
 * Check if this is an active check
 */
const isActiveCheck = (checkType: CheckType): boolean => checkType.endsWith(`-${CheckNature.Active}`);

/**
 * Get valid dice (base dice are always valid, extra/luck only if they passed threshold)
 */
const getValidDice = (dice: DieResult[]): DieResult[] => {
	return dice.filter(die => die.type === 'base' || die.valid);
};

/**
 * Get the two highest valid dice values (sorted descending)
 */
const getSelectedDiceValues = (dice: DieResult[]): number[] => {
	const validDice = getValidDice(dice);
	return validDice
		.map(die => die.value)
		.sort((a, b) => b - a)
		.slice(0, 2);
};

/**
 * Calculate results from dice values
 * Crits are always calculated across ALL dice (even invalid ones)
 * Selected dice are always the two highest valid dice
 */
export const calculateResults = (dice: DieResult[], config: DiceRollConfig): Omit<RollResults, 'dice' | 'context'> => {
	const { modifierValue, checkType, targetDC } = config;

	// For crits and auto-fail we must use ALL dice, even invalid ones
	const allValues = dice.map(die => die.value);

	// Check for pair of 1s (uses all dice)
	const hasPairOfOnes = allValues.filter(v => v === 1).length >= 2;
	const autoFail = hasPairOfOnes && canAutoFail(checkType);

	// Calculate crit modifiers (uses all dice)
	let critModifiers = 0;

	// +6 for any 12
	if (allValues.includes(12)) critModifiers += 6;

	// +6 for any pair (regardless of value)
	const valueCounts = new Map<number, number>();
	for (const val of allValues) {
		valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
	}
	const hasPair = Array.from(valueCounts.values()).some(count => count >= 2);
	if (hasPair) critModifiers += 6;

	// Get the two highest valid dice
	const selectedDice = getSelectedDiceValues(dice);
	const baseTotal = selectedDice.reduce((sum, val) => sum + val, 0) + modifierValue;
	const total = baseTotal + critModifiers;

	// Calculate success and shifts
	let success: boolean | undefined;
	let critShifts = 0;

	if (!autoFail && targetDC !== null) {
		if (isActiveCheck(checkType)) {
			// Active checks: must beat DC, or tie with crit
			success = total > targetDC || (total === targetDC && critModifiers > 0);
		} else {
			// Resisted checks: must meet or beat DC
			success = total >= targetDC;
		}

		if (success) {
			critShifts = calculateShifts(total - targetDC);
		}
	}

	return { selectedDice, autoFail, total, critModifiers, critShifts, success, hasPairOfOnes };
};

/**
 * DiceRoller - handles the mechanics of rolling dice
 * Decoupled from UI rendering
 * @template T - The type of context returned by the entropy provider
 */
export class DiceRoller<T = void> {
	private entropyProvider: EntropyProvider<T>;

	constructor(entropyProvider: EntropyProvider<T>) {
		this.entropyProvider = entropyProvider;
	}

	/**
	 * Roll dice according to configuration
	 * Returns complete results including selected dice, calculations, and entropy context
	 */
	async roll(config: DiceRollConfig): Promise<RollResults<T>> {
		// Calculate how many dice we need
		const diceCount = 2 + (config.extra ? 1 : 0) + (config.luck ? 1 : 0);

		// Roll all dice at once
		const { values, context } = await this.entropyProvider(diceCount);

		// Build dice results
		const dice: DieResult[] = [
			{ value: values[0]!, type: 'base' },
			{ value: values[1]!, type: 'base' },
		];

		let rollIndex = 2;

		// Add extra die if configured
		if (config.extra) {
			const extraRoll = values[rollIndex++]!;
			dice.push({
				value: extraRoll,
				valid: extraRoll <= config.extra.value,
				type: 'extra',
			});
		}

		// Add luck die if configured
		if (config.luck) {
			const luckRoll = values[rollIndex++]!;
			dice.push({
				value: luckRoll,
				valid: luckRoll <= config.luck.value,
				type: 'luck',
			});
		}

		const results = calculateResults(dice, config);

		return {
			dice,
			...results,
			context,
		};
	}
}
