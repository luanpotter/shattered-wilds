import { CharacterSheet } from '../../character/character-sheet.js';
import { ActionCheckParameter, ActionDefinition, ActionType, ActionValueParameter, IncludeEquipmentModifier, StandardCheck } from '../../core/actions.js';
import { CheckFactory } from '../../engine/check-factory.js';
import { Check } from '../../stats/check.js';
import { CircumstanceModifier } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { ActionRow, ActionRowBox } from '../common/action-row.js';
import { SectionInput } from '../common/section-inputs.js';
import { ActionTabInputValues } from './actions-section-inputs.js';
export { ActionTabInputValues };
export declare class ActionsSection {
    tabs: Record<ActionType, ActionTab>;
    inputValues: ActionTabInputValues;
    constructor({ tabs, inputValues }: {
        tabs: Record<ActionType, ActionTab>;
        inputValues: ActionTabInputValues;
    });
    static create({ characterId, characterSheet, showAll, inputValues, update, }: {
        characterId: string;
        characterSheet: CharacterSheet;
        showAll: boolean;
        inputValues: ActionTabInputValues;
        update: (inputValues: ActionTabInputValues) => void;
    }): ActionsSection;
}
export declare class ActionTab {
    type: ActionType;
    inputs: SectionInput[];
    actions: ActionRow[];
    constructor({ type, inputs: inputs, actions }: {
        type: ActionType;
        inputs: SectionInput[];
        actions: ActionRow[];
    });
}
export declare const ActionTabParameterCalculator: {
    computeCheck: ({ checkFactory, action, parameter, inputValues, }: {
        checkFactory: CheckFactory;
        action: ActionDefinition;
        parameter: ActionCheckParameter;
        inputValues: ActionTabInputValues;
    }) => Check;
    computeStatType: (statType: StatType | StandardCheck, inputValues: ActionTabInputValues) => StatType;
    computeIncludedModifiers: (includeModifierFor: IncludeEquipmentModifier, inputValues: ActionTabInputValues) => CircumstanceModifier[];
    createBoxForCheck: ({ key, checkFactory, action, parameter, inputValues, }: {
        key: string;
        checkFactory: CheckFactory;
        action: ActionDefinition;
        parameter: ActionCheckParameter;
        inputValues: ActionTabInputValues;
    }) => ActionRowBox;
    createBoxForValue: ({ key, characterSheet, parameter, }: {
        key: string;
        characterSheet: CharacterSheet;
        action: ActionDefinition;
        parameter: ActionValueParameter;
        inputValues: ActionTabInputValues;
    }) => ActionRowBox;
};
//# sourceMappingURL=actions-section.d.ts.map