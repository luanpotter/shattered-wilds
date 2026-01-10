import { filterInstanceOf } from '@shattered-wilds/commons';
import { ArcaneSpellComponentType } from '../core/arcane.js';
import { Trait } from '../core/traits.js';
import { Resource, ResourceCost } from '../stats/resources.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus, Distance } from '../stats/value.js';
import { EquipmentSerializer } from './equipment-serializer.js';
export var SlotType;
(function (SlotType) {
    SlotType["Armor"] = "Armor";
    SlotType["OneHand"] = "One Hand";
    SlotType["TwoHands"] = "Two Hands";
    SlotType["Free"] = "Free";
    SlotType["None"] = "None";
})(SlotType || (SlotType = {}));
export const Slots = {
    /** Held items such as Weapons or Arcane Components must be either One Handed or Two Handed. */
    heldItemSlotByTraits: (traits) => {
        return traits.includes(Trait.TwoHanded) ? SlotType.TwoHands : SlotType.OneHand;
    },
    /** Mapping of slot types to number of hands it occupies. */
    slotToHands: (slot) => {
        switch (slot) {
            case SlotType.OneHand:
                return 1;
            case SlotType.TwoHands:
                return 2;
            default:
                return 0;
        }
    },
};
export var PrimaryWeaponType;
(function (PrimaryWeaponType) {
    PrimaryWeaponType["Unarmed"] = "Unarmed";
    PrimaryWeaponType["Thrown"] = "Thrown";
    PrimaryWeaponType["LightMelee"] = "Light Melee";
    PrimaryWeaponType["Ranged"] = "Ranged";
    PrimaryWeaponType["HeavyMelee"] = "Heavy Melee";
})(PrimaryWeaponType || (PrimaryWeaponType = {}));
export const PRIMARY_WEAPON_TYPES = {
    [PrimaryWeaponType.Unarmed]: { statType: StatType.STR, rangeType: Trait.Melee, powerTier: 0 },
    [PrimaryWeaponType.Thrown]: { statType: StatType.STR, rangeType: Trait.Ranged, powerTier: 1 },
    [PrimaryWeaponType.LightMelee]: { statType: StatType.DEX, rangeType: Trait.Melee, powerTier: 2 },
    [PrimaryWeaponType.Ranged]: { statType: StatType.DEX, rangeType: Trait.Ranged, powerTier: 2 },
    [PrimaryWeaponType.HeavyMelee]: { statType: StatType.STR, rangeType: Trait.Melee, powerTier: 3 },
};
export var ArmorType;
(function (ArmorType) {
    ArmorType["LightArmor"] = "Light Armor";
    ArmorType["MediumArmor"] = "Medium Armor";
    ArmorType["HeavyArmor"] = "Heavy Armor";
})(ArmorType || (ArmorType = {}));
export var ShieldType;
(function (ShieldType) {
    ShieldType["SmallShield"] = "Small Shield";
    ShieldType["LargeShield"] = "Large Shield";
})(ShieldType || (ShieldType = {}));
export class ShieldTypeDefinition {
    shieldType;
    slotType;
    constructor({ shieldType, slotType }) {
        this.shieldType = shieldType;
        this.slotType = slotType;
    }
}
export const SHIELD_TYPE_DEFINITIONS = {
    [ShieldType.SmallShield]: new ShieldTypeDefinition({
        shieldType: ShieldType.SmallShield,
        slotType: SlotType.OneHand,
    }),
    [ShieldType.LargeShield]: new ShieldTypeDefinition({
        shieldType: ShieldType.LargeShield,
        slotType: SlotType.TwoHands,
    }),
};
export var ModeType;
(function (ModeType) {
    ModeType["Weapon"] = "weapon";
    ModeType["Armor"] = "armor";
    ModeType["Shield"] = "shield";
    ModeType["Arcane"] = "arcane";
})(ModeType || (ModeType = {}));
export const MODE_TYPE_LABELS = {
    [ModeType.Weapon]: 'Weapon',
    [ModeType.Armor]: 'Armor',
    [ModeType.Shield]: 'Shield',
    [ModeType.Arcane]: 'Arcane Component',
};
/**
 * Returns the ModeType if all modes share the same type, null otherwise.
 * Use sparingly - most code should be multi-modal-agnostic.
 */
export const getItemType = (item) => {
    const firstMode = item.modes[0];
    if (!firstMode)
        return null;
    const firstModeType = firstMode.modeType;
    return item.modes.every(mode => mode.modeType === firstModeType) ? firstModeType : null;
};
export class WeaponMode {
    modeType = ModeType.Weapon;
    type;
    bonus;
    range;
    costs;
    constructor({ type, bonus, range, costs = [], }) {
        this.type = type;
        this.bonus = bonus;
        this.range = range ?? Distance.melee();
        this.costs = costs;
    }
    get statType() {
        return PRIMARY_WEAPON_TYPES[this.type].statType;
    }
    get rangeType() {
        return PRIMARY_WEAPON_TYPES[this.type].rangeType;
    }
    get description() {
        return `${this.type} (${this.bonus.description}, ${this.range.description})`;
    }
    static simple({ name, type, bonus, range, traits = [], }) {
        const mode = new WeaponMode({ type, bonus, range, costs: [] });
        const slot = Slots.heldItemSlotByTraits(traits);
        return new Item({ name, slot, modes: [mode], traits });
    }
}
export class ArmorMode {
    modeType = ModeType.Armor;
    type;
    bonus;
    dexPenalty;
    // can't image an armor mode having costs!
    costs = [];
    constructor({ type, bonus, dexPenalty }) {
        this.type = type;
        this.bonus = bonus;
        this.dexPenalty = dexPenalty;
    }
    get description() {
        const dexPenalty = this.dexPenalty.isNotZero ? `, DEX Penalty: ${this.dexPenalty.description}` : '';
        return `${this.type} ${this.bonus.description}${dexPenalty}`;
    }
    static simple({ name, type, bonus, dexPenalty, traits = [], }) {
        const mode = new ArmorMode({ type, bonus, dexPenalty });
        const slot = SlotType.Armor;
        return new Item({ name, slot, modes: [mode], traits });
    }
}
export class ShieldMode {
    modeType = ModeType.Shield;
    type;
    bonus;
    costs = [];
    constructor({ type, bonus, costs }) {
        this.type = type;
        this.bonus = bonus;
        this.costs = costs;
    }
    get description() {
        return `${this.type} ${this.bonus.description}`;
    }
    static simple({ name, type, bonus, traits = [], }) {
        const mode = new ShieldMode({ type, bonus, costs: [] });
        const slot = SHIELD_TYPE_DEFINITIONS[type].slotType;
        return new Item({ name, slot, modes: [mode], traits });
    }
}
export class ArcaneComponentMode {
    modeType = ModeType.Arcane;
    category;
    component;
    bonus;
    costs;
    constructor({ category, component, bonus, costs, }) {
        this.category = category;
        this.component = component;
        this.bonus = bonus;
        this.costs = costs;
    }
    get description() {
        return `${this.category} (${this.bonus.description})`;
    }
    static simple({ name, category, component, bonus, costs, traits = [], }) {
        const mode = new ArcaneComponentMode({ category, component, bonus, costs });
        const slot = Slots.heldItemSlotByTraits(traits);
        return new Item({ name, slot, modes: [mode], traits });
    }
}
export class Item {
    name;
    slot;
    isEquipped;
    traits;
    modes;
    constructor({ name, slot, isEquipped = false, traits = [], modes = [], }) {
        this.name = name;
        this.slot = slot;
        this.isEquipped = isEquipped;
        this.traits = traits;
        this.modes = modes;
    }
    get isEquippable() {
        return this.slot !== SlotType.None;
    }
    modesDescriptor() {
        if (this.modes.length === 0) {
            return undefined;
        }
        return `${this.modes.map(mode => mode.description).join(' / ')}`;
    }
    get description() {
        const modesDesc = this.modesDescriptor();
        return `${this.name} ${modesDesc ? `(${modesDesc})` : ''}`;
    }
}
export class ItemModeOption {
    item;
    mode;
    constructor({ item, mode }) {
        this.item = item;
        this.mode = mode;
    }
    get description() {
        return `${this.item.name} / ${this.mode.description}`;
    }
}
export class WeaponModeOption extends ItemModeOption {
    static unarmed = WeaponModeOption.buildUnarmed();
    static shieldBash = WeaponModeOption.buildShieldBash();
    constructor({ item, mode }) {
        super({ item, mode });
    }
    getEquipmentModifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Equipment,
            name: this.description,
            value: this.mode.bonus,
        });
    }
    static buildUnarmed() {
        const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(0), costs: [] });
        const item = new Item({
            name: 'Unarmed',
            slot: SlotType.None,
            modes: [mode],
        });
        return new WeaponModeOption({ item, mode });
    }
    static buildShieldBash() {
        const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(1), costs: [] });
        const item = new Item({
            name: 'Shield Bash',
            slot: SlotType.None,
            modes: [mode],
        });
        return new WeaponModeOption({ item, mode });
    }
}
export class ShieldModeOption extends ItemModeOption {
    constructor({ item, mode }) {
        super({ item, mode });
    }
    getEquipmentModifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Equipment,
            name: `${this.item.name} / ${this.mode.description}`,
            value: this.mode.bonus,
        });
    }
}
export class ArmorModeOption extends ItemModeOption {
    constructor({ item, mode }) {
        super({ item, mode });
    }
    getEquipmentModifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Equipment,
            name: `${this.item.name} / ${this.mode.description}`,
            value: this.mode.bonus,
        });
    }
}
export class ArcaneComponentModeOption extends ItemModeOption {
    constructor({ item, mode }) {
        super({ item, mode });
    }
    getEquipmentModifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Equipment,
            name: `${this.item.name} [${this.mode.description}]`,
            value: this.mode.bonus,
        });
    }
    toOption() {
        const { item, mode } = this;
        return {
            name: item.name,
            type: mode.component,
            cost: this.mode.costs.map(cost => cost.shortDescription).join(', '),
            toComponentModifier: () => this.getEquipmentModifier(),
        };
    }
}
export class Equipment {
    items;
    constructor(items = []) {
        this.items = items;
    }
    warnings() {
        const equipment = this.equippedItems();
        const invalidEquip = equipment.some(item => !item.isEquippable);
        const excessArmor = equipment.filter(item => item.slot === SlotType.Armor).length > 1;
        const slotToHands = (slot) => {
            switch (slot) {
                case SlotType.OneHand:
                    return 1;
                case SlotType.TwoHands:
                    return 2;
                default:
                    return 0;
            }
        };
        const excessHands = equipment.map(item => slotToHands(item.slot)).reduce((a, b) => a + b, 0) > 2;
        const warnings = [
            invalidEquip ? 'One or more equipped items cannot be equipped.' : null,
            excessArmor ? 'More than one item in the Armor slot is equipped.' : null,
            excessHands ? 'More than two hands worth of items are equipped.' : null,
        ];
        return warnings.filter(warning => warning !== null);
    }
    shieldModes() {
        return this.itemsWithModes(ShieldMode, ShieldModeOption);
    }
    shieldOptions() {
        const shields = this.shieldModes();
        return ['None', ...shields];
    }
    armorModes() {
        return this.itemsWithModes(ArmorMode, ArmorModeOption);
    }
    armorOptions() {
        const armorModes = this.armorModes();
        return ['None', ...armorModes];
    }
    weaponModes() {
        return this.itemsWithModes(WeaponMode, WeaponModeOption);
    }
    weaponOptions() {
        const hasShield = this.shieldOptions().length > 1;
        const weaponModes = this.weaponModes();
        return [WeaponModeOption.unarmed, ...(hasShield ? [WeaponModeOption.shieldBash] : []), ...weaponModes];
    }
    arcaneComponentModes() {
        return this.itemsWithModes(ArcaneComponentMode, ArcaneComponentModeOption);
    }
    defaultWeaponMode() {
        return this.weaponModes()[0] ?? WeaponModeOption.unarmed;
    }
    defaultArmor() {
        return this.armorModes()[0] ?? 'None';
    }
    defaultShield() {
        return this.shieldModes()[0] ?? 'None';
    }
    itemsWithModes(ctor, modeCtor) {
        return this.equippedItems().flatMap(item => filterInstanceOf(item.modes, ctor).map(mode => new modeCtor({ item, mode })));
    }
    equippedItems() {
        return this.items.filter(item => item.isEquipped);
    }
    static from(prop) {
        if (!prop) {
            return new Equipment();
        }
        const items = EquipmentSerializer.deserialize(prop);
        return new Equipment(items);
    }
    toProp() {
        return EquipmentSerializer.serialize(this.items);
    }
}
export var BasicEquipmentType;
(function (BasicEquipmentType) {
    // Weapons
    BasicEquipmentType["Javelin"] = "Javelin";
    BasicEquipmentType["Hatchet"] = "Hatchet";
    BasicEquipmentType["Dagger"] = "Dagger";
    BasicEquipmentType["Rapier"] = "Rapier";
    BasicEquipmentType["BowAndArrows"] = "Bow & Arrows";
    BasicEquipmentType["CrossbowAndDarts"] = "Crossbow & Darts";
    BasicEquipmentType["Spear"] = "Spear";
    BasicEquipmentType["Mace"] = "Mace";
    BasicEquipmentType["Longsword"] = "Longsword";
    // Armor
    BasicEquipmentType["LeatherArmor"] = "Leather Armor";
    BasicEquipmentType["Chainmail"] = "Chainmail";
    BasicEquipmentType["FullPlate"] = "Full Plate";
    // Shields
    BasicEquipmentType["SmallShield"] = "Small Shield";
    BasicEquipmentType["LargeShield"] = "Large Shield";
    // Arcane Foci
    BasicEquipmentType["Wand"] = "Wand";
    BasicEquipmentType["Staff"] = "Staff";
    // Arcane Tools
    BasicEquipmentType["PuzzleGearBox"] = "PuzzleGearBox";
    BasicEquipmentType["ConvolutedContraption"] = "Convoluted Contraption";
    // Instruments
    BasicEquipmentType["Ocarina"] = "Ocarina";
    BasicEquipmentType["Lyre"] = "Lyre";
})(BasicEquipmentType || (BasicEquipmentType = {}));
export class BasicEquipmentDefinition {
    generator;
    alternativeNames;
    constructor({ generator, alternativeNames }) {
        this.generator = generator;
        this.alternativeNames = alternativeNames ?? [];
    }
}
export const BASIC_EQUIPMENT = {
    // Weapons
    [BasicEquipmentType.Javelin]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Javelin',
            type: PrimaryWeaponType.Thrown,
            bonus: Bonus.of(2),
            range: Distance.of(6),
        }),
        alternativeNames: ['Darts'],
    }),
    [BasicEquipmentType.Hatchet]: new BasicEquipmentDefinition({
        generator: () => new Item({
            name: 'Hatchet',
            slot: SlotType.OneHand,
            modes: [
                new WeaponMode({
                    type: PrimaryWeaponType.LightMelee,
                    bonus: Bonus.of(2),
                }),
                new WeaponMode({
                    type: PrimaryWeaponType.Thrown,
                    bonus: Bonus.of(3),
                    range: Distance.of(3),
                }),
            ],
        }),
        alternativeNames: ['Hand Axe'],
    }),
    [BasicEquipmentType.Dagger]: new BasicEquipmentDefinition({
        generator: () => new Item({
            name: 'Dagger',
            slot: SlotType.OneHand,
            modes: [
                new WeaponMode({
                    type: PrimaryWeaponType.LightMelee,
                    bonus: Bonus.of(3),
                }),
                new WeaponMode({
                    type: PrimaryWeaponType.Thrown,
                    bonus: Bonus.of(2),
                    range: Distance.of(3),
                }),
            ],
            traits: [Trait.Concealable],
        }),
        alternativeNames: ['Knife'],
    }),
    [BasicEquipmentType.Rapier]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Rapier',
            type: PrimaryWeaponType.LightMelee,
            bonus: Bonus.of(4),
        }),
        alternativeNames: ['Short Sword'],
    }),
    [BasicEquipmentType.BowAndArrows]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Bow & Arrows',
            type: PrimaryWeaponType.Ranged,
            bonus: Bonus.of(4),
            range: Distance.of(12),
            traits: [Trait.TwoHanded],
        }),
        alternativeNames: ['Shortbow', 'Longbow', 'Composite Bow'],
    }),
    [BasicEquipmentType.CrossbowAndDarts]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Crossbow & Darts',
            type: PrimaryWeaponType.Ranged,
            bonus: Bonus.of(5),
            range: Distance.of(12),
            traits: [Trait.Reloadable],
        }),
        alternativeNames: ['Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow'],
    }),
    [BasicEquipmentType.Spear]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Spear',
            type: PrimaryWeaponType.HeavyMelee,
            bonus: Bonus.of(4),
            range: Distance.of(2),
            traits: [Trait.Polearm],
        }),
        alternativeNames: ['Glaive', 'Halberd', 'Pike'],
    }),
    [BasicEquipmentType.Mace]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Mace',
            type: PrimaryWeaponType.HeavyMelee,
            bonus: Bonus.of(5),
            range: Distance.of(1),
        }),
        alternativeNames: ['Club', 'Mace', 'Morningstar'],
    }),
    [BasicEquipmentType.Longsword]: new BasicEquipmentDefinition({
        generator: () => WeaponMode.simple({
            name: 'Longsword',
            type: PrimaryWeaponType.HeavyMelee,
            bonus: Bonus.of(6),
            traits: [Trait.TwoHanded],
        }),
        alternativeNames: ['Bastard Sword', 'Claymore'],
    }),
    // Armor
    [BasicEquipmentType.LeatherArmor]: new BasicEquipmentDefinition({
        generator: () => ArmorMode.simple({
            name: 'Leather Armor',
            type: ArmorType.LightArmor,
            bonus: Bonus.of(1),
            dexPenalty: Bonus.zero(),
        }),
        alternativeNames: ['Padded Armor', 'Hide'],
    }),
    [BasicEquipmentType.Chainmail]: new BasicEquipmentDefinition({
        generator: () => ArmorMode.simple({
            name: 'Chainmail',
            type: ArmorType.MediumArmor,
            bonus: Bonus.of(3),
            dexPenalty: Bonus.of(-1),
        }),
        alternativeNames: ['Half Plate'],
    }),
    [BasicEquipmentType.FullPlate]: new BasicEquipmentDefinition({
        generator: () => ArmorMode.simple({
            name: 'Full Plate',
            type: ArmorType.HeavyArmor,
            bonus: Bonus.of(5),
            dexPenalty: Bonus.of(-3),
        }),
    }),
    // Shields
    [BasicEquipmentType.SmallShield]: new BasicEquipmentDefinition({
        generator: () => ShieldMode.simple({
            name: 'Small Shield',
            type: ShieldType.SmallShield,
            bonus: Bonus.of(3),
        }),
    }),
    [BasicEquipmentType.LargeShield]: new BasicEquipmentDefinition({
        generator: () => ShieldMode.simple({
            name: 'Large Shield',
            type: ShieldType.LargeShield,
            bonus: Bonus.of(6),
            traits: [Trait.TwoHanded],
        }),
    }),
    // Arcane Foci
    [BasicEquipmentType.Wand]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Wand',
            category: 'Typical One-Handed Focus',
            component: ArcaneSpellComponentType.Focal,
            bonus: Bonus.of(2),
            costs: [new ResourceCost({ resource: Resource.SpiritPoint, amount: 1 })],
        }),
    }),
    [BasicEquipmentType.Staff]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Staff',
            category: 'Typical Two-Handed Focus',
            component: ArcaneSpellComponentType.Focal,
            bonus: Bonus.of(3),
            traits: [Trait.TwoHanded],
            costs: [new ResourceCost({ resource: Resource.SpiritPoint, amount: 1 })],
        }),
    }),
    // Arcane Tools
    [BasicEquipmentType.PuzzleGearBox]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Puzzle Gear Box',
            category: 'Typical One-Handed Tool',
            component: ArcaneSpellComponentType.Somatic,
            bonus: Bonus.of(2),
            costs: [],
        }),
    }),
    [BasicEquipmentType.ConvolutedContraption]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Convoluted Contraption',
            category: 'Typical Two-Handed Tool',
            component: ArcaneSpellComponentType.Somatic,
            bonus: Bonus.of(3),
            traits: [Trait.TwoHanded],
            costs: [],
        }),
    }),
    // Instruments
    [BasicEquipmentType.Ocarina]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Ocarina',
            category: 'Typical One-Handed Instrument',
            component: ArcaneSpellComponentType.Verbal,
            bonus: Bonus.of(2),
            costs: [],
        }),
        alternativeNames: ['Horn', 'Bell', 'Simple Flute'],
    }),
    [BasicEquipmentType.Lyre]: new BasicEquipmentDefinition({
        generator: () => ArcaneComponentMode.simple({
            name: 'Lyre',
            category: 'Typical Two-Handed Instrument',
            component: ArcaneSpellComponentType.Verbal,
            bonus: Bonus.of(3),
            traits: [Trait.TwoHanded],
            costs: [],
        }),
        alternativeNames: ['Lute', 'Harp'],
    }),
};
//# sourceMappingURL=equipment.js.map