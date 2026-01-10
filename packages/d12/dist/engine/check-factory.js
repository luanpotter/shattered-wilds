import { Check, CheckMode, CheckNature } from '../stats/check.js';
import { DerivedStatType } from '../stats/derived-stat.js';
import { StatType } from '../stats/stat-type.js';
export class CheckFactory {
    characterSheet;
    statTree;
    constructor({ characterSheet }) {
        this.characterSheet = characterSheet;
        this.statTree = characterSheet.getStatTree();
    }
    initiative() {
        const initiativeModifier = this.statTree.getModifier(DerivedStatType.Initiative);
        return this.create({
            mode: CheckMode.Contested,
            nature: CheckNature.Resisted,
            descriptor: 'Initiative',
            statModifier: initiativeModifier,
        });
    }
    weapon({ weaponMode }) {
        const attackStat = weaponMode.mode.statType;
        const weaponModifier = weaponMode.getEquipmentModifier();
        const cms = weaponModifier ? [weaponModifier] : [];
        const statModifier = this.statTree.getModifier(attackStat, cms);
        return this.create({
            mode: CheckMode.Contested,
            nature: CheckNature.Active,
            descriptor: weaponMode.item.name,
            statModifier,
        });
    }
    armor({ armor }) {
        const armorModifier = armor.getEquipmentModifier();
        return this.action({
            mode: CheckMode.Contested,
            nature: CheckNature.Resisted,
            descriptor: 'Basic Body Defense',
            statType: StatType.Body,
            circumstanceModifiers: [armorModifier],
        });
    }
    shield({ armor, shield }) {
        const armorModifier = armor === 'None' ? undefined : armor.getEquipmentModifier();
        const shieldModifier = shield.getEquipmentModifier();
        return this.action({
            mode: CheckMode.Contested,
            nature: CheckNature.Resisted,
            descriptor: 'Shield Block',
            statType: StatType.Body,
            circumstanceModifiers: [armorModifier, shieldModifier].filter(e => e !== undefined),
        });
    }
    action({ mode, nature, descriptor, statType, circumstanceModifiers = [], }) {
        const statModifier = this.statTree.getModifier(statType, circumstanceModifiers);
        return this.create({ mode, nature, descriptor, statModifier });
    }
    spell({ spellName, statModifier }) {
        return this.create({
            mode: CheckMode.Contested,
            nature: CheckNature.Active,
            descriptor: spellName,
            statModifier,
        });
    }
    divineChanneling({ baseModifier }) {
        return this.create({
            mode: CheckMode.Contested,
            descriptor: 'Divine Channeling',
            nature: CheckNature.Active,
            statModifier: baseModifier,
        });
    }
    stat({ mode, nature, statType, circumstanceModifiers = [], }) {
        const statModifier = this.statTree.getModifier(statType, circumstanceModifiers);
        const descriptor = statType.toString();
        return this.create({ mode, nature, descriptor, statModifier });
    }
    create({ mode, descriptor, nature, statModifier, }) {
        const finalModifier = this.characterSheet.circumstances.applyCircumstanceModifiers(statModifier);
        return new Check({
            mode,
            descriptor,
            nature,
            statModifier: finalModifier,
        });
    }
}
//# sourceMappingURL=check-factory.js.map