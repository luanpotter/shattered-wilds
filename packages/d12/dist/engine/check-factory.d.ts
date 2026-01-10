import { CharacterSheet } from '../character/character-sheet.js';
import { ArmorModeOption, ShieldModeOption, WeaponModeOption } from '../character/equipment.js';
import { Check, CheckMode, CheckNature } from '../stats/check.js';
import { DerivedStatType } from '../stats/derived-stat.js';
import { CircumstanceModifier, StatModifier } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
export declare class CheckFactory {
    private characterSheet;
    private statTree;
    constructor({ characterSheet }: {
        characterSheet: CharacterSheet;
    });
    initiative(): Check;
    weapon({ weaponMode }: {
        weaponMode: WeaponModeOption;
    }): Check;
    armor({ armor }: {
        armor: ArmorModeOption;
    }): Check;
    shield({ armor, shield }: {
        armor: ArmorModeOption | 'None';
        shield: ShieldModeOption;
    }): Check;
    action({ mode, nature, descriptor, statType, circumstanceModifiers, }: {
        mode: CheckMode;
        nature: CheckNature;
        descriptor: string;
        statType: StatType | DerivedStatType;
        circumstanceModifiers?: CircumstanceModifier[];
    }): Check;
    spell({ spellName, statModifier }: {
        spellName: string;
        statModifier: StatModifier;
    }): Check;
    divineChanneling({ baseModifier }: {
        baseModifier: StatModifier;
    }): Check;
    stat({ mode, nature, statType, circumstanceModifiers, }: {
        mode: CheckMode;
        nature: CheckNature;
        statType: StatType | DerivedStatType;
        circumstanceModifiers?: CircumstanceModifier[];
    }): Check;
    private create;
}
//# sourceMappingURL=check-factory.d.ts.map