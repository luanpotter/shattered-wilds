import { CharacterSheet } from '../../character/character-sheet.js';
import { ArcaneSpellSchool } from '../../core/arcane.js';
import { Trait } from '../../core/traits.js';
import { Check } from '../../stats/check.js';
import { ResourceCost } from '../../stats/resources.js';
import { Value } from '../../stats/value.js';
export declare class ActionRowCost {
    characterId: string;
    characterSheet: CharacterSheet;
    name: string;
    actionCosts: ResourceCost[];
    canAfford: boolean;
    constructor({ characterId, characterSheet, name, actionCosts, }: {
        characterId: string;
        characterSheet: CharacterSheet;
        name: string;
        actionCosts: ResourceCost[];
    });
}
export declare class ActionRowValueBox {
    value: Value;
    constructor({ value }: {
        value: Value;
    });
    hasErrors(): boolean;
}
export declare class ActionRowVariableBox {
    inputValue: number;
    value: Value;
    constructor({ inputValue, value }: {
        inputValue: number;
        value: Value;
    });
    hasErrors(): boolean;
}
export declare class ActionRowCheckBoxError {
    title: string;
    tooltip: string;
    text: string;
    constructor({ title, tooltip, text }: {
        title: string;
        tooltip: string;
        text: string;
    });
}
export declare class ActionRowCheckBox {
    check: Check;
    targetDC: number | undefined;
    errors: ActionRowCheckBoxError[];
    constructor({ check, targetDC, errors, }: {
        check: Check;
        targetDC: number | undefined;
        errors: ActionRowCheckBoxError[];
    });
    hasErrors(): boolean;
}
export declare class ActionRowBox {
    key: string;
    labels: string[];
    tooltip: string;
    data: ActionRowValueBox | ActionRowVariableBox | ActionRowCheckBox;
    constructor({ key, labels, tooltip, data, }: {
        key: string;
        labels: string[];
        tooltip: string;
        data: ActionRowValueBox | ActionRowCheckBox;
    });
    hasErrors(): boolean;
    static fromCheck({ key, check, targetDC, errors, }: {
        key: string;
        check: Check;
        targetDC: number | undefined;
        errors: ActionRowCheckBoxError[];
    }): ActionRowBox;
}
export declare class ActionRow {
    slug: string;
    cost: ActionRowCost | undefined;
    title: string;
    traits: (Trait | ArcaneSpellSchool)[];
    description: string;
    boxes: ActionRowBox[];
    constructor({ slug, cost, title, traits, description, boxes, }: {
        slug: string;
        cost: ActionRowCost | undefined;
        title: string;
        traits: (Trait | ArcaneSpellSchool)[];
        description: string;
        boxes: ActionRowBox[];
    });
    hasErrors(): boolean;
}
//# sourceMappingURL=action-row.d.ts.map