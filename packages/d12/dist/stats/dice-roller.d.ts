import { DiceRoll } from './dice.js';
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
    valid?: boolean;
    type: 'base' | 'extra' | 'luck';
}
/**
 * Results from a dice roll, including the entropy context
 * @template T - The type of context from the entropy provider
 */
export interface RollResults<T = void> {
    dice: DieResult[];
    selectedDice: number[];
    autoFail: boolean;
    total: number;
    critModifiers: number;
    critShifts: number;
    success: boolean | undefined;
    hasPairOfOnes: boolean;
    context: T;
}
/**
 * Calculate results from dice values
 * Crits are always calculated across ALL dice (even invalid ones)
 * Selected dice are always the two highest valid dice
 */
export declare const calculateResults: (dice: DieResult[], roll: DiceRoll) => Omit<RollResults, "dice" | "context">;
/**
 * DiceRoller - handles the mechanics of rolling dice
 * Decoupled from UI rendering
 * @template T - The type of context returned by the entropy provider
 */
export declare class DiceRoller<T = void> {
    private entropyProvider;
    constructor(entropyProvider: EntropyProvider<T>);
    /**
     * Roll dice according to the DiceRoll request
     * Returns complete results including selected dice, calculations, and entropy context
     */
    roll(roll: DiceRoll): Promise<RollResults<T>>;
}
//# sourceMappingURL=dice-roller.d.ts.map