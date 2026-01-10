import { Resource } from '../../stats/resources.js';
import { Bonus, Distance } from '../../stats/value.js';
import { InputValue, InputValueAdapter } from './section-inputs-adapters.js';
export declare abstract class SectionInput {
    key: string;
    label: string;
    tooltip: string;
    constructor({ key, label, tooltip }: {
        key: string;
        label: string;
        tooltip: string;
    });
}
export declare abstract class FixedInput<T extends InputValue> extends SectionInput {
    value: T;
    constructor({ key, label, tooltip, value }: {
        key: string;
        label: string;
        tooltip: string;
        value: T;
    });
    abstract adapter(): InputValueAdapter<T>;
    getAsString(): string;
}
export declare class FixedNumberInput extends FixedInput<number> {
    constructor({ key, label, tooltip, value }: {
        key: string;
        label: string;
        tooltip: string;
        value: number;
    });
    adapter(): InputValueAdapter<number>;
}
export declare class FixedBonusInput extends FixedInput<Bonus> {
    constructor({ key, label, tooltip, value }: {
        key: string;
        label: string;
        tooltip: string;
        value: Bonus;
    });
    adapter(): InputValueAdapter<Bonus>;
}
export declare class FixedDistanceInput extends FixedInput<Distance> {
    constructor({ key, label, tooltip, value }: {
        key: string;
        label: string;
        tooltip: string;
        value: Distance;
    });
    adapter(): InputValueAdapter<Distance>;
}
export declare class ResourceInput extends SectionInput {
    resource: Resource;
    constructor({ key, resource }: {
        key: string;
        resource: Resource;
    });
}
export declare abstract class TextInput<T extends InputValue> extends SectionInput {
    getter: () => T;
    setter: (value: T) => void;
    constructor({ key, label, tooltip, getter, setter, }: {
        key: string;
        label: string;
        tooltip: string;
        getter: () => T;
        setter: (value: T) => void;
    });
    abstract adapter(): InputValueAdapter<T>;
    getAsRaw(): string;
    getAsString(): string;
    setFromString(value: string): void;
}
export declare class NumberInput extends TextInput<number> {
    adapter(): InputValueAdapter<number>;
}
export declare class BonusInput extends TextInput<Bonus> {
    adapter(): InputValueAdapter<Bonus>;
}
export declare class DistanceInput extends TextInput<Distance> {
    adapter(): InputValueAdapter<Distance>;
}
export declare class DropdownInput<T> extends SectionInput {
    options: T[];
    describe: (option: T) => string;
    getter: () => T;
    setter: (value: T) => void;
    constructor({ key, label, tooltip, options, describe, getter, setter, }: {
        key: string;
        label: string;
        tooltip: string;
        options: T[];
        describe: (option: T) => string;
        getter: () => T;
        setter: (value: T) => void;
    });
}
//# sourceMappingURL=section-inputs.d.ts.map