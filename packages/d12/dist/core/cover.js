import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';
export var PassiveCoverType;
(function (PassiveCoverType) {
    PassiveCoverType["None"] = "None";
    PassiveCoverType["Lesser"] = "Lesser";
    PassiveCoverType["Standard"] = "Standard";
    PassiveCoverType["Greater"] = "Greater";
})(PassiveCoverType || (PassiveCoverType = {}));
export class PassiveCoverDefinition {
    type;
    examples;
    bonus;
    constructor({ type, examples, bonus }) {
        this.type = type;
        this.examples = examples;
        this.bonus = bonus;
    }
    get modifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Circumstance,
            name: `Passive Cover (${this.type})`,
            value: this.bonus,
        });
    }
    get description() {
        return `Passive Cover - ${this.type} (${this.examples})`;
    }
}
export const COVER_TYPES = {
    [PassiveCoverType.None]: new PassiveCoverDefinition({
        type: PassiveCoverType.None,
        examples: 'No obstruction.',
        bonus: Bonus.zero(),
    }),
    [PassiveCoverType.Lesser]: new PassiveCoverDefinition({
        type: PassiveCoverType.Lesser,
        examples: 'Creatures on the way, 1m-tall obstacle, etc.',
        bonus: Bonus.of(-1),
    }),
    [PassiveCoverType.Standard]: new PassiveCoverDefinition({
        type: PassiveCoverType.Standard,
        examples: 'Line of sight is blocked by the corners of obstacles.',
        bonus: Bonus.of(-3),
    }),
    [PassiveCoverType.Greater]: new PassiveCoverDefinition({
        type: PassiveCoverType.Greater,
        examples: 'Line of sight is almost completely obstructed.',
        bonus: Bonus.of(-6),
    }),
};
//# sourceMappingURL=cover.js.map