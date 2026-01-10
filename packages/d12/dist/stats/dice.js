import { Check } from './check.js';
/**
 * We encode dice rolls in the format:
 * /d12 {json}
 * JSON.stringify naturally serializes the class instances.
 */
export const DiceRollEncoder = {
    encode(roll) {
        return `/d12 ${JSON.stringify(roll)}`;
    },
    decode(command, { fallbackCharacterName }) {
        const match = command.trim().match(/^\/d12\s+(.+)$/);
        const data = match ? match[1] : null;
        if (!data) {
            throw new Error(`Invalid dice roll command format: ${command}`);
        }
        try {
            const json = JSON.parse(data);
            return {
                characterName: json.characterName || fallbackCharacterName || 'Unknown',
                check: Check.fromJSON(json.check),
                extra: json.extra,
                luck: json.luck,
                targetDC: json.targetDC,
            };
        }
        catch (err) {
            throw new Error(`Failed to parse dice roll command JSON: ${err}`);
        }
    },
};
//# sourceMappingURL=dice.js.map