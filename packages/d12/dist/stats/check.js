import { StatModifier } from './stat-tree.js';
import { StatType } from './stat-type.js';
export var CheckMode;
(function (CheckMode) {
    CheckMode["Static"] = "Static";
    CheckMode["Contested"] = "Contested";
})(CheckMode || (CheckMode = {}));
export var CheckNature;
(function (CheckNature) {
    CheckNature["Active"] = "Active";
    CheckNature["Resisted"] = "Resisted";
})(CheckNature || (CheckNature = {}));
export const CHECK_TYPES = Object.values(CheckMode).flatMap(mode => Object.values(CheckNature).map(nature => `${mode}-${nature}`));
export class Check {
    mode;
    nature;
    descriptor;
    statModifier;
    constructor({ mode, descriptor, nature, statModifier, }) {
        this.mode = mode;
        this.nature = nature;
        this.descriptor = descriptor;
        this.statModifier = statModifier;
    }
    get type() {
        return `${this.mode}-${this.nature}`;
    }
    get modifierValue() {
        return this.statModifier.value;
    }
    get name() {
        if (this.statModifier.statType instanceof StatType) {
            return this.statModifier.statType.name;
        }
        return this.statModifier.statType;
    }
    // NOTE: we typically try to build the check with all the parameters it needs at once,
    // but these withX methods are used for "last mile" adjustments (e.g., on the Dice Roll dialog itself)
    withAdditionalCM(cm) {
        const newStatModifier = this.statModifier.withAdditionalCM(cm);
        return new Check({
            mode: this.mode,
            nature: this.nature,
            descriptor: this.descriptor,
            statModifier: newStatModifier,
        });
    }
    withType(type) {
        const [mode, nature] = type.split('-');
        return new Check({
            mode,
            nature,
            descriptor: this.descriptor,
            statModifier: this.statModifier,
        });
    }
    static fromJSON(data) {
        if (data instanceof Check)
            return data;
        return new Check({
            mode: data.mode,
            nature: data.nature,
            descriptor: data.descriptor,
            statModifier: StatModifier.fromJSON(data.statModifier),
        });
    }
}
//# sourceMappingURL=check.js.map