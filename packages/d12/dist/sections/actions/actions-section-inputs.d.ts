import { CharacterSheet } from '../../character/character-sheet.js';
import { ArmorModeOption, ShieldModeOption, WeaponModeOption } from '../../character/equipment.js';
import { ActionType } from '../../core/actions.js';
import { PassiveCoverType } from '../../core/cover.js';
import { CircumstanceModifier } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Distance } from '../../stats/value.js';
import { SectionInput } from '../common/section-inputs.js';
export declare class ActionTabInputValues {
    selectedWeaponMode: WeaponModeOption;
    selectedRangeValue: number;
    selectedDefenseRealm: StatType;
    selectedPassiveCover: PassiveCoverType;
    heightIncrements: number;
    selectedArmor: ArmorModeOption | 'None';
    selectedShield: ShieldModeOption | 'None';
    constructor({ selectedWeaponMode, selectedRangeValue, selectedDefenseRealm, selectedPassiveCover, heightIncrements, selectedArmor, selectedShield, }: {
        selectedWeaponMode: WeaponModeOption;
        selectedRangeValue: number;
        selectedDefenseRealm: StatType;
        selectedPassiveCover: PassiveCoverType;
        heightIncrements: number;
        selectedArmor: ArmorModeOption | 'None';
        selectedShield: ShieldModeOption | 'None';
    });
    copyWith({ selectedWeapon, selectedRangeValue, selectedDefenseRealm, selectedPassiveCover, heightIncrements, selectedArmor, selectedShield, }: {
        selectedWeapon?: WeaponModeOption;
        selectedRangeValue?: number;
        selectedDefenseRealm?: StatType;
        selectedPassiveCover?: PassiveCoverType;
        heightIncrements?: number;
        selectedArmor?: ArmorModeOption | 'None';
        selectedShield?: ShieldModeOption | 'None';
    }): ActionTabInputValues;
    selectedRange: () => Distance;
    weaponModifier: () => CircumstanceModifier | null;
    rangeIncrementModifier: () => CircumstanceModifier | null;
    passiveCoverModifier: () => CircumstanceModifier | null;
    heightIncrementsModifier: () => CircumstanceModifier | null;
}
export declare class ActionsSectionInputFactory {
    sheet: CharacterSheet;
    inputValues: ActionTabInputValues;
    update: (current: ActionTabInputValues) => void;
    movementValue: {
        value: Distance;
        description: string;
    };
    weaponModes: WeaponModeOption[];
    armors: (ArmorModeOption | 'None')[];
    shields: (ShieldModeOption | 'None')[];
    constructor({ sheet, inputValues, update, }: {
        sheet: CharacterSheet;
        inputValues: ActionTabInputValues;
        update: (current: ActionTabInputValues) => void;
    });
    getInputsForActionType(type: ActionType): SectionInput[];
    private getInputsForActionTypeOrUndefined;
    private movement;
    private resource;
    private weaponMode;
    private rangeIncrement;
    private rangeCM;
    private target;
    private passiveCover;
    private heightIncrements;
    private heightIncrementsModifier;
    private defenseRealm;
    private armor;
    private shield;
}
//# sourceMappingURL=actions-section-inputs.d.ts.map