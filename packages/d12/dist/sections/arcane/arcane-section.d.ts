import { CharacterSheet } from '../../character/character-sheet.js';
import { ArcaneSpellComponentOption, ArcaneSpellComponentType, ArcaneSpellSchool } from '../../core/arcane.js';
import { Check } from '../../stats/check.js';
import { CircumstanceModifier, StatModifier } from '../../stats/stat-tree.js';
import { Bonus, Distance } from '../../stats/value.js';
import { ActionRow, ActionRowBox, ActionRowCost } from '../common/action-row.js';
export type ArcaneSectionSchoolOption = 'All Schools' | ArcaneSpellSchool;
export type ArcaneSectionCastingTimeOption = {
    name: string;
    value: number;
    modifier: Bonus;
    maxFocusCost?: number;
};
export type ArcaneSectionFocusCostOption = {
    name: string;
    value: number;
    modifier: Bonus;
};
export type ArcaneSectionAttackOption = 'All Spells' | 'Only Attacks' | 'Only Utility';
export type ArcaneSectionInfluenceRange = {
    value: Distance;
    description: string;
    rangeIncrementModifier: CircumstanceModifier;
};
export type ArcaneSectionInputValues = {
    selectedRange: Distance;
    selectedSchool: ArcaneSectionSchoolOption;
    selectedAttackOption: ArcaneSectionAttackOption;
    selectedCastingTime: ArcaneSectionCastingTimeOption;
    selectedFocusCost: ArcaneSectionFocusCostOption;
    selectedSomaticComponent: ArcaneSpellComponentOption | null;
    selectedVerbalComponent: ArcaneSpellComponentOption | null;
    selectedFocalComponent: ArcaneSpellComponentOption | null;
    spellAugmentationValues: Record<string, Record<string, number>>;
};
export declare class ArcaneSectionDefaults {
    static readonly INITIAL_RANGE: Distance;
    static readonly INITIAL_SCHOOL: ArcaneSectionSchoolOption;
    static readonly INITIAL_ATTACK_OPTION: ArcaneSectionAttackOption;
    static readonly INITIAL_CASTING_TIME_INDEX = 1;
    static readonly INITIAL_FOCUS_COST_INDEX = 0;
    static createDefaultInputValues(componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>): ArcaneSectionInputValues;
}
export declare class ArcaneSectionSpellAugmentation {
    key: string;
    type: string;
    typeValue: string;
    shortDescription: string;
    variable: boolean;
    value: number;
    bonus: Bonus;
    tooltip: string;
    constructor({ key, type, typeValue, shortDescription, variable, value, bonus, tooltip, }: {
        key: string;
        type: string;
        typeValue: string;
        shortDescription: string;
        variable: boolean;
        value: number;
        bonus: Bonus;
        tooltip: string;
    });
    get description(): string;
    toModifier(): CircumstanceModifier;
    toBox(): ActionRowBox;
}
export declare class ArcaneSection {
    static readonly allSchoolOptions: readonly ArcaneSectionSchoolOption[];
    static readonly allAttackOptions: readonly ArcaneSectionAttackOption[];
    static readonly allCastingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
    static readonly allFocusCostOptions: readonly ArcaneSectionFocusCostOption[];
    static getAvailableFocusCostOptions(selectedCastingTime: ArcaneSectionCastingTimeOption): readonly ArcaneSectionFocusCostOption[];
    private static componentsForFlavor;
    static getComponentsForFlavor(sheet: CharacterSheet): Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
    private static computeInfluenceRange;
    private static filterSpells;
    private static computeSpells;
    schoolOptions: readonly ArcaneSectionSchoolOption[];
    castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
    focusCostOptions: readonly ArcaneSectionFocusCostOption[];
    componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
    attackOptions: readonly ArcaneSectionAttackOption[];
    influenceRange: ArcaneSectionInfluenceRange;
    baseModifier: StatModifier;
    combinedModifier: StatModifier;
    fundamentalCheck: Check;
    fundamentalSpellCost: ActionRowCost;
    spells: ActionRow[];
    constructor({ schoolOptions, castingTimeOptions, focusCostOptions, componentOptions, influenceRange, baseModifier, combinedModifier, fundamentalCheck, fundamentalSpellCost, spells, }: {
        schoolOptions: readonly ArcaneSectionSchoolOption[];
        castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
        focusCostOptions: readonly ArcaneSectionFocusCostOption[];
        componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
        influenceRange: ArcaneSectionInfluenceRange;
        baseModifier: StatModifier;
        combinedModifier: StatModifier;
        fundamentalCheck: Check;
        fundamentalSpellCost: ActionRowCost;
        spells: ActionRow[];
    });
    static create({ characterId, sheet, inputValues, }: {
        characterId: string;
        sheet: CharacterSheet;
        inputValues: ArcaneSectionInputValues;
    }): ArcaneSection;
}
//# sourceMappingURL=arcane-section.d.ts.map