import { ArcaneSpellComponentOption, ArcaneSpellComponentType } from '../core/arcane.js';
import { Trait } from '../core/traits.js';
import { ResourceCost } from '../stats/resources.js';
import { CircumstanceModifier } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus, Distance } from '../stats/value.js';
export declare enum SlotType {
    Armor = "Armor",
    OneHand = "One Hand",
    TwoHands = "Two Hands",
    Free = "Free",
    None = "None"
}
export declare const Slots: {
    /** Held items such as Weapons or Arcane Components must be either One Handed or Two Handed. */
    heldItemSlotByTraits: (traits: Trait[]) => SlotType;
    /** Mapping of slot types to number of hands it occupies. */
    slotToHands: (slot: SlotType) => number;
};
export declare enum PrimaryWeaponType {
    Unarmed = "Unarmed",
    Thrown = "Thrown",
    LightMelee = "Light Melee",
    Ranged = "Ranged",
    HeavyMelee = "Heavy Melee"
}
export interface PrimaryWeaponTypeDefinition {
    statType: StatType;
    rangeType: Trait.Melee | Trait.Ranged;
    powerTier: number;
}
export declare const PRIMARY_WEAPON_TYPES: Record<PrimaryWeaponType, PrimaryWeaponTypeDefinition>;
export declare enum ArmorType {
    LightArmor = "Light Armor",
    MediumArmor = "Medium Armor",
    HeavyArmor = "Heavy Armor"
}
export declare enum ShieldType {
    SmallShield = "Small Shield",
    LargeShield = "Large Shield"
}
export declare class ShieldTypeDefinition {
    shieldType: ShieldType;
    slotType: SlotType;
    constructor({ shieldType, slotType }: {
        shieldType: ShieldType;
        slotType: SlotType;
    });
}
export declare const SHIELD_TYPE_DEFINITIONS: Record<ShieldType, ShieldTypeDefinition>;
export declare enum ModeType {
    Weapon = "weapon",
    Armor = "armor",
    Shield = "shield",
    Arcane = "arcane"
}
export declare const MODE_TYPE_LABELS: Record<ModeType, string>;
/**
 * Returns the ModeType if all modes share the same type, null otherwise.
 * Use sparingly - most code should be multi-modal-agnostic.
 */
export declare const getItemType: (item: Item) => ModeType | null;
export interface ItemMode {
    modeType: ModeType;
    description: string;
    costs: ResourceCost[];
}
export declare class WeaponMode implements ItemMode {
    modeType: ModeType;
    type: PrimaryWeaponType;
    bonus: Bonus;
    range: Distance;
    costs: ResourceCost[];
    constructor({ type, bonus, range, costs, }: {
        type: PrimaryWeaponType;
        bonus: Bonus;
        range?: Distance | undefined;
        costs?: ResourceCost[];
    });
    get statType(): StatType;
    get rangeType(): Trait.Melee | Trait.Ranged;
    get description(): string;
    static simple({ name, type, bonus, range, traits, }: {
        name: string;
        type: PrimaryWeaponType;
        bonus: Bonus;
        range?: Distance;
        traits?: Trait[];
    }): Item;
}
export declare class ArmorMode implements ItemMode {
    modeType: ModeType;
    type: ArmorType;
    bonus: Bonus;
    dexPenalty: Bonus;
    costs: ResourceCost[];
    constructor({ type, bonus, dexPenalty }: {
        type: ArmorType;
        bonus: Bonus;
        dexPenalty: Bonus;
    });
    get description(): string;
    static simple({ name, type, bonus, dexPenalty, traits, }: {
        name: string;
        type: ArmorType;
        bonus: Bonus;
        dexPenalty: Bonus;
        traits?: Trait[];
    }): Item;
}
export declare class ShieldMode implements ItemMode {
    modeType: ModeType;
    type: ShieldType;
    bonus: Bonus;
    costs: ResourceCost[];
    constructor({ type, bonus, costs }: {
        type: ShieldType;
        bonus: Bonus;
        costs: ResourceCost[];
    });
    get description(): string;
    static simple({ name, type, bonus, traits, }: {
        name: string;
        type: ShieldType;
        bonus: Bonus;
        traits?: Trait[];
    }): Item;
}
export declare class ArcaneComponentMode implements ItemMode {
    modeType: ModeType;
    category: string;
    component: ArcaneSpellComponentType;
    bonus: Bonus;
    costs: ResourceCost[];
    constructor({ category, component, bonus, costs, }: {
        category: string;
        component: ArcaneSpellComponentType;
        bonus: Bonus;
        costs: ResourceCost[];
    });
    get description(): string;
    static simple({ name, category, component, bonus, costs, traits, }: {
        name: string;
        category: string;
        component: ArcaneSpellComponentType;
        bonus: Bonus;
        costs: ResourceCost[];
        traits?: Trait[];
    }): Item;
}
export declare class Item {
    name: string;
    slot: SlotType;
    isEquipped: boolean;
    traits: Trait[];
    modes: ItemMode[];
    constructor({ name, slot, isEquipped, traits, modes, }: {
        name: string;
        slot: SlotType;
        isEquipped?: boolean;
        traits?: Trait[];
        modes?: ItemMode[];
    });
    get isEquippable(): boolean;
    private modesDescriptor;
    get description(): string;
}
export declare class ItemModeOption<T extends ItemMode> {
    item: Item;
    mode: T;
    constructor({ item, mode }: {
        item: Item;
        mode: T;
    });
    get description(): string;
}
export declare class WeaponModeOption extends ItemModeOption<WeaponMode> {
    static readonly unarmed: WeaponModeOption;
    static readonly shieldBash: WeaponModeOption;
    constructor({ item, mode }: {
        item: Item;
        mode: WeaponMode;
    });
    getEquipmentModifier(): CircumstanceModifier;
    private static buildUnarmed;
    private static buildShieldBash;
}
export declare class ShieldModeOption extends ItemModeOption<ShieldMode> {
    constructor({ item, mode }: {
        item: Item;
        mode: ShieldMode;
    });
    getEquipmentModifier(): CircumstanceModifier;
}
export declare class ArmorModeOption extends ItemModeOption<ArmorMode> {
    constructor({ item, mode }: {
        item: Item;
        mode: ArmorMode;
    });
    getEquipmentModifier(): CircumstanceModifier;
}
export declare class ArcaneComponentModeOption extends ItemModeOption<ArcaneComponentMode> {
    constructor({ item, mode }: {
        item: Item;
        mode: ArcaneComponentMode;
    });
    getEquipmentModifier(): CircumstanceModifier;
    toOption(): ArcaneSpellComponentOption;
}
export declare class Equipment {
    items: Item[];
    constructor(items?: Item[]);
    warnings(): string[];
    shieldModes(): ShieldModeOption[];
    shieldOptions(): (ShieldModeOption | 'None')[];
    armorModes(): ArmorModeOption[];
    armorOptions(): (ArmorModeOption | 'None')[];
    weaponModes(): WeaponModeOption[];
    weaponOptions(): WeaponModeOption[];
    arcaneComponentModes(): ArcaneComponentModeOption[];
    defaultWeaponMode(): WeaponModeOption;
    defaultArmor(): ArmorModeOption | 'None';
    defaultShield(): ShieldModeOption | 'None';
    private itemsWithModes;
    private equippedItems;
    static from(prop: string | undefined): Equipment;
    toProp(): string;
}
export declare enum BasicEquipmentType {
    Javelin = "Javelin",
    Hatchet = "Hatchet",
    Dagger = "Dagger",
    Rapier = "Rapier",
    BowAndArrows = "Bow & Arrows",
    CrossbowAndDarts = "Crossbow & Darts",
    Spear = "Spear",
    Mace = "Mace",
    Longsword = "Longsword",
    LeatherArmor = "Leather Armor",
    Chainmail = "Chainmail",
    FullPlate = "Full Plate",
    SmallShield = "Small Shield",
    LargeShield = "Large Shield",
    Wand = "Wand",
    Staff = "Staff",
    PuzzleGearBox = "PuzzleGearBox",
    ConvolutedContraption = "Convoluted Contraption",
    Ocarina = "Ocarina",
    Lyre = "Lyre"
}
export declare class BasicEquipmentDefinition {
    generator: () => Item;
    alternativeNames: string[];
    constructor({ generator, alternativeNames }: {
        generator: () => Item;
        alternativeNames?: string[];
    });
}
export declare const BASIC_EQUIPMENT: Record<BasicEquipmentType, BasicEquipmentDefinition>;
//# sourceMappingURL=equipment.d.ts.map