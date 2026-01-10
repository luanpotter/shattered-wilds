import { RESOURCES } from '../../stats/resources.js';
import { InputValueAdapter } from './section-inputs-adapters.js';
export class SectionInput {
    key;
    label;
    tooltip;
    constructor({ key, label, tooltip }) {
        this.key = key;
        this.label = label;
        this.tooltip = tooltip;
    }
}
export class FixedInput extends SectionInput {
    value;
    constructor({ key, label, tooltip, value }) {
        super({ key, label, tooltip });
        this.value = value;
    }
    getAsString() {
        return this.adapter().format(this.value);
    }
}
export class FixedNumberInput extends FixedInput {
    constructor({ key, label, tooltip, value }) {
        super({ key, label, tooltip, value });
    }
    adapter() {
        return InputValueAdapter.number;
    }
}
export class FixedBonusInput extends FixedInput {
    constructor({ key, label, tooltip, value }) {
        super({ key, label, tooltip, value });
    }
    adapter() {
        return InputValueAdapter.bonus;
    }
}
export class FixedDistanceInput extends FixedInput {
    constructor({ key, label, tooltip, value }) {
        super({ key, label, tooltip, value });
    }
    adapter() {
        return InputValueAdapter.distance;
    }
}
export class ResourceInput extends SectionInput {
    resource;
    constructor({ key, resource }) {
        super({
            key,
            label: RESOURCES[resource].shortName,
            tooltip: RESOURCES[resource].description,
        });
        this.resource = resource;
    }
}
export class TextInput extends SectionInput {
    getter;
    setter;
    constructor({ key, label, tooltip, getter, setter, }) {
        super({ key, label, tooltip });
        this.getter = getter;
        this.setter = setter;
    }
    getAsRaw() {
        return this.adapter().raw(this.getter());
    }
    getAsString() {
        return this.adapter().format(this.getter());
    }
    setFromString(value) {
        this.setter(this.adapter().parse(value));
    }
}
export class NumberInput extends TextInput {
    adapter() {
        return InputValueAdapter.number;
    }
}
export class BonusInput extends TextInput {
    adapter() {
        return InputValueAdapter.bonus;
    }
}
export class DistanceInput extends TextInput {
    adapter() {
        return InputValueAdapter.distance;
    }
}
export class DropdownInput extends SectionInput {
    options;
    describe;
    getter;
    setter;
    constructor({ key, label, tooltip, options, describe, getter, setter, }) {
        super({ key, label, tooltip });
        this.options = options;
        this.describe = describe;
        this.getter = getter;
        this.setter = setter;
    }
}
//# sourceMappingURL=section-inputs.js.map