import { Check } from './check.js';
/**
 * This is a transport-friendly representation of a dice roll requests;
 * used to "copy" rolls into VTT contexts.
 */
export interface DiceRoll {
    characterName: string;
    check: Check;
    extra: {
        name: string;
        value: number;
    } | undefined;
    luck: {
        value: number;
    } | undefined;
    targetDC: number | undefined;
}
/**
 * We encode dice rolls in the format:
 * /d12 {json}
 * JSON.stringify naturally serializes the class instances.
 */
export declare const DiceRollEncoder: {
    encode(roll: DiceRoll): string;
    decode(command: string, { fallbackCharacterName }: {
        fallbackCharacterName?: string;
    }): DiceRoll;
};
//# sourceMappingURL=dice.d.ts.map