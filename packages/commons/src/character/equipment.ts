import { ArcaneSpellComponentOption, ArcaneSpellComponentType } from '../core/arcane.js';
import { Trait } from '../core/traits.js';
import { Resource, ResourceCost } from '../stats/resources.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus, Distance } from '../stats/value.js';
import { filterInstanceOf } from '../utils/utils.js';
import { EquipmentSerializer } from './equipment-serializer.js';

export enum PrimaryWeaponType {
	Unarmed = 'Unarmed',
	Thrown = 'Thrown',
	LightMelee = 'Light Melee',
	Ranged = 'Ranged',
	HeavyMelee = 'Heavy Melee',
}

export interface PrimaryWeaponTypeDefinition {
	statType: StatType;
	rangeType: Trait.Melee | Trait.Ranged;
	powerTier: number;
}

export const PRIMARY_WEAPON_TYPES: Record<PrimaryWeaponType, PrimaryWeaponTypeDefinition> = {
	[PrimaryWeaponType.Unarmed]: { statType: StatType.STR, rangeType: Trait.Melee, powerTier: 0 },
	[PrimaryWeaponType.Thrown]: { statType: StatType.STR, rangeType: Trait.Ranged, powerTier: 1 },
	[PrimaryWeaponType.LightMelee]: { statType: StatType.DEX, rangeType: Trait.Melee, powerTier: 2 },
	[PrimaryWeaponType.Ranged]: { statType: StatType.DEX, rangeType: Trait.Ranged, powerTier: 2 },
	[PrimaryWeaponType.HeavyMelee]: { statType: StatType.STR, rangeType: Trait.Melee, powerTier: 3 },
};

export enum ArmorType {
	LightArmor = 'Light Armor',
	MediumArmor = 'Medium Armor',
	HeavyArmor = 'Heavy Armor',
}

export enum ShieldType {
	SmallShield = 'Small Shield',
	LargeShield = 'Large Shield',
}

export enum ModeType {
	Weapon = 'weapon',
	Armor = 'armor',
	Shield = 'shield',
	Arcane = 'arcane',
}

export const MODE_TYPE_LABELS: Record<ModeType, string> = {
	[ModeType.Weapon]: 'Weapon',
	[ModeType.Armor]: 'Armor',
	[ModeType.Shield]: 'Shield',
	[ModeType.Arcane]: 'Arcane Component',
};

/**
 * Returns the ModeType if all modes share the same type, null otherwise.
 * Use sparingly - most code should be multi-modal-agnostic.
 */
export const getItemType = (item: Item): ModeType | null => {
	const firstMode = item.modes[0];
	if (!firstMode) return null;
	const firstModeType = firstMode.modeType;
	return item.modes.every(mode => mode.modeType === firstModeType) ? firstModeType : null;
};

export interface ItemMode {
	modeType: ModeType;
	description: string;
	costs: ResourceCost[];
}

export class WeaponMode implements ItemMode {
	modeType = ModeType.Weapon;
	type: PrimaryWeaponType;
	bonus: Bonus;
	range: Distance;
	costs: ResourceCost[];

	constructor({
		type,
		bonus,
		range,
		costs = [],
	}: {
		type: PrimaryWeaponType;
		bonus: Bonus;
		range?: Distance | undefined;
		costs?: ResourceCost[];
	}) {
		this.type = type;
		this.bonus = bonus;
		this.range = range ?? Distance.melee();
		this.costs = costs;
	}

	get statType(): StatType {
		return PRIMARY_WEAPON_TYPES[this.type].statType;
	}

	get rangeType(): Trait.Melee | Trait.Ranged {
		return PRIMARY_WEAPON_TYPES[this.type].rangeType;
	}

	get description(): string {
		return `${this.type} (${this.bonus.description}, ${this.range.description})`;
	}

	static simple({
		name,
		type,
		bonus,
		range,
		traits = [],
	}: {
		name: string;
		type: PrimaryWeaponType;
		bonus: Bonus;
		range?: Distance;
		traits?: Trait[];
	}): Item {
		const mode = new WeaponMode({ type, bonus, range, costs: [] });
		return new Item({ name, modes: [mode], traits });
	}
}

export class ArmorMode implements ItemMode {
	modeType = ModeType.Armor;
	type: ArmorType;
	bonus: Bonus;
	dexPenalty: Bonus;
	// can't image an armor mode having costs!
	costs: ResourceCost[] = [];

	constructor({ type, bonus, dexPenalty }: { type: ArmorType; bonus: Bonus; dexPenalty: Bonus }) {
		this.type = type;
		this.bonus = bonus;
		this.dexPenalty = dexPenalty;
	}

	get description(): string {
		const dexPenalty = this.dexPenalty.isNotZero ? `, DEX Penalty: ${this.dexPenalty.description}` : '';
		return `${this.type} ${this.bonus.description}${dexPenalty}`;
	}

	static simple({
		name,
		type,
		bonus,
		dexPenalty,
		traits = [],
	}: {
		name: string;
		type: ArmorType;
		bonus: Bonus;
		dexPenalty: Bonus;
		traits?: Trait[];
	}): Item {
		const mode = new ArmorMode({ type, bonus, dexPenalty });
		return new Item({ name, modes: [mode], traits });
	}
}

export class ShieldMode implements ItemMode {
	modeType = ModeType.Shield;
	type: ShieldType;
	bonus: Bonus;
	costs: ResourceCost[] = [];

	constructor({ type, bonus, costs }: { type: ShieldType; bonus: Bonus; costs: ResourceCost[] }) {
		this.type = type;
		this.bonus = bonus;
		this.costs = costs;
	}

	get description(): string {
		return `${this.type} ${this.bonus.description}`;
	}

	static simple({
		name,
		type,
		bonus,
		traits = [],
	}: {
		name: string;
		type: ShieldType;
		bonus: Bonus;
		traits?: Trait[];
	}): Item {
		const mode = new ShieldMode({ type, bonus, costs: [] });
		return new Item({ name, modes: [mode], traits });
	}
}

export class ArcaneComponentMode implements ItemMode {
	modeType = ModeType.Arcane;
	category: string;
	component: ArcaneSpellComponentType;
	bonus: Bonus;
	costs: ResourceCost[];

	constructor({
		category,
		component,
		bonus,
		costs,
	}: {
		category: string;
		component: ArcaneSpellComponentType;
		bonus: Bonus;
		costs: ResourceCost[];
	}) {
		this.category = category;
		this.component = component;
		this.bonus = bonus;
		this.costs = costs;
	}

	get description(): string {
		return `${this.category} (${this.bonus.description})`;
	}

	static simple({
		name,
		category,
		component,
		bonus,
		costs,
		traits = [],
	}: {
		name: string;
		category: string;
		component: ArcaneSpellComponentType;
		bonus: Bonus;
		costs: ResourceCost[];
		traits?: Trait[];
	}): Item {
		const mode = new ArcaneComponentMode({ category, component, bonus, costs });
		return new Item({ name, modes: [mode], traits });
	}
}

export class Item {
	name: string;
	traits: Trait[];
	modes: ItemMode[];

	constructor({ name, traits = [], modes = [] }: { name: string; traits?: Trait[]; modes?: ItemMode[] }) {
		this.name = name;
		this.traits = traits;
		this.modes = modes;
	}

	private modesDescriptor(): string | undefined {
		if (this.modes.length === 0) {
			return undefined;
		}
		return `${this.modes.map(mode => mode.description).join(' / ')}`;
	}

	get description(): string {
		const modesDesc = this.modesDescriptor();
		return `${this.name} ${modesDesc ? `(${modesDesc})` : ''}`;
	}
}

export class ItemModeOption<T extends ItemMode> {
	item: Item;
	mode: T;

	constructor({ item, mode }: { item: Item; mode: T }) {
		this.item = item;
		this.mode = mode;
	}

	get description(): string {
		return `${this.item.name} / ${this.mode.description}`;
	}
}

export class WeaponModeOption extends ItemModeOption<WeaponMode> {
	static readonly unarmed: WeaponModeOption = WeaponModeOption.buildUnarmed();
	static readonly shieldBash: WeaponModeOption = WeaponModeOption.buildShieldBash();

	constructor({ item, mode }: { item: Item; mode: WeaponMode }) {
		super({ item, mode });
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: this.description,
			value: this.mode.bonus,
		});
	}

	private static buildUnarmed(): WeaponModeOption {
		const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(0), costs: [] });
		const item = new Item({
			name: 'Unarmed',
			modes: [mode],
		});
		return new WeaponModeOption({ item, mode });
	}

	private static buildShieldBash(): WeaponModeOption {
		const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(1), costs: [] });
		const item = new Item({
			name: 'Shield Bash',
			modes: [mode],
		});
		return new WeaponModeOption({ item, mode });
	}
}

export class ShieldModeOption extends ItemModeOption<ShieldMode> {
	constructor({ item, mode }: { item: Item; mode: ShieldMode }) {
		super({ item, mode });
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: `${this.item.name} / ${this.mode.description}`,
			value: this.mode.bonus,
		});
	}
}

export class ArmorModeOption extends ItemModeOption<ArmorMode> {
	constructor({ item, mode }: { item: Item; mode: ArmorMode }) {
		super({ item, mode });
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: `${this.item.name} / ${this.mode.description}`,
			value: this.mode.bonus,
		});
	}
}

export class ArcaneComponentModeOption extends ItemModeOption<ArcaneComponentMode> {
	constructor({ item, mode }: { item: Item; mode: ArcaneComponentMode }) {
		super({ item, mode });
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: `${this.item.name} [${this.mode.description}]`,
			value: this.mode.bonus,
		});
	}

	toOption(): ArcaneSpellComponentOption {
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
	items: Item[];

	constructor(items: Item[] = []) {
		this.items = items;
	}

	shieldModes(): ShieldModeOption[] {
		return this.itemsWithModes(ShieldMode, ShieldModeOption);
	}

	shieldOptions(): (ShieldModeOption | 'None')[] {
		const shields = this.shieldModes();
		return ['None', ...shields];
	}

	armorModes(): ArmorModeOption[] {
		return this.itemsWithModes(ArmorMode, ArmorModeOption);
	}

	armorOptions(): (ArmorModeOption | 'None')[] {
		const armorModes = this.armorModes();
		return ['None', ...armorModes];
	}

	weaponModes(): WeaponModeOption[] {
		return this.itemsWithModes(WeaponMode, WeaponModeOption);
	}

	weaponOptions(): WeaponModeOption[] {
		const hasShield = this.shieldOptions().length > 1;
		const weaponModes = this.weaponModes();
		return [WeaponModeOption.unarmed, ...(hasShield ? [WeaponModeOption.shieldBash] : []), ...weaponModes];
	}

	arcaneComponentModes(): ArcaneComponentModeOption[] {
		return this.itemsWithModes(ArcaneComponentMode, ArcaneComponentModeOption);
	}

	defaultWeaponMode(): WeaponModeOption {
		return this.weaponModes()[0] ?? WeaponModeOption.unarmed;
	}

	defaultArmor(): ArmorModeOption | 'None' {
		return this.armorModes()[0] ?? 'None';
	}

	defaultShield(): ShieldModeOption | 'None' {
		return this.shieldModes()[0] ?? 'None';
	}

	private itemsWithModes<T extends ItemMode, R extends ItemModeOption<T>>(
		ctor: new (...args: never[]) => T,
		modeCtor: new (args: { item: Item; mode: T }) => R,
	): R[] {
		return this.items.flatMap(item => filterInstanceOf(item.modes, ctor).map(mode => new modeCtor({ item, mode })));
	}

	static from(prop: string | undefined): Equipment {
		if (!prop) {
			return new Equipment();
		}
		const items = EquipmentSerializer.deserialize(prop);
		return new Equipment(items);
	}

	toProp(): string {
		return EquipmentSerializer.serialize(this.items);
	}
}

export enum BasicEquipmentType {
	// Weapons
	Javelin = 'Javelin',
	Hatchet = 'Hatchet',
	Dagger = 'Dagger',
	Rapier = 'Rapier',
	BowAndArrows = 'Bow & Arrows',
	CrossbowAndDarts = 'Crossbow & Darts',
	Spear = 'Spear',
	Mace = 'Mace',
	Longsword = 'Longsword',
	// Armor
	LeatherArmor = 'Leather Armor',
	Chainmail = 'Chainmail',
	FullPlate = 'Full Plate',
	// Shields
	SmallShield = 'Small Shield',
	LargeShield = 'Large Shield',
	// Arcane Foci
	Wand = 'Wand',
	Staff = 'Staff',
	// Arcane Tools
	PuzzleGearBox = 'PuzzleGearBox',
	ConvolutedContraption = 'Convoluted Contraption',
	// Instruments
	Ocarina = 'Ocarina',
	Lyre = 'Lyre',
}

export class BasicEquipmentDefinition {
	generator: () => Item;
	alternativeNames: string[];

	constructor({ generator, alternativeNames }: { generator: () => Item; alternativeNames?: string[] }) {
		this.generator = generator;
		this.alternativeNames = alternativeNames ?? [];
	}
}

export const BASIC_EQUIPMENT: Record<BasicEquipmentType, BasicEquipmentDefinition> = {
	// Weapons
	[BasicEquipmentType.Javelin]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Javelin',
				type: PrimaryWeaponType.Thrown,
				bonus: Bonus.of(2),
				range: Distance.of(6),
			}),
		alternativeNames: ['Darts'],
	}),
	[BasicEquipmentType.Hatchet]: new BasicEquipmentDefinition({
		generator: () =>
			new Item({
				name: 'Hatchet',
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
		generator: () =>
			new Item({
				name: 'Dagger',
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
		generator: () =>
			WeaponMode.simple({
				name: 'Rapier',
				type: PrimaryWeaponType.LightMelee,
				bonus: Bonus.of(4),
			}),
		alternativeNames: ['Short Sword'],
	}),
	[BasicEquipmentType.BowAndArrows]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Bow & Arrows',
				type: PrimaryWeaponType.Ranged,
				bonus: Bonus.of(4),
				range: Distance.of(12),
				traits: [Trait.TwoHanded],
			}),
		alternativeNames: ['Shortbow', 'Longbow', 'Composite Bow'],
	}),
	[BasicEquipmentType.CrossbowAndDarts]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Crossbow & Darts',
				type: PrimaryWeaponType.Ranged,
				bonus: Bonus.of(5),
				range: Distance.of(12),
				traits: [Trait.Reloadable],
			}),
		alternativeNames: ['Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow'],
	}),
	[BasicEquipmentType.Spear]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Spear',
				type: PrimaryWeaponType.HeavyMelee,
				bonus: Bonus.of(4),
				range: Distance.of(2),
				traits: [Trait.Polearm],
			}),
		alternativeNames: ['Glaive', 'Halberd', 'Pike'],
	}),
	[BasicEquipmentType.Mace]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Mace',
				type: PrimaryWeaponType.HeavyMelee,
				bonus: Bonus.of(5),
				range: Distance.of(1),
			}),
		alternativeNames: ['Club', 'Mace', 'Morningstar'],
	}),
	[BasicEquipmentType.Longsword]: new BasicEquipmentDefinition({
		generator: () =>
			WeaponMode.simple({
				name: 'Longsword',
				type: PrimaryWeaponType.HeavyMelee,
				bonus: Bonus.of(6),
				traits: [Trait.TwoHanded],
			}),
		alternativeNames: ['Bastard Sword', 'Claymore'],
	}),

	// Armor
	[BasicEquipmentType.LeatherArmor]: new BasicEquipmentDefinition({
		generator: () =>
			ArmorMode.simple({
				name: 'Leather Armor',
				type: ArmorType.LightArmor,
				bonus: Bonus.of(1),
				dexPenalty: Bonus.zero(),
			}),
		alternativeNames: ['Padded Armor', 'Hide'],
	}),
	[BasicEquipmentType.Chainmail]: new BasicEquipmentDefinition({
		generator: () =>
			ArmorMode.simple({
				name: 'Chainmail',
				type: ArmorType.MediumArmor,
				bonus: Bonus.of(3),
				dexPenalty: Bonus.of(-1),
			}),
		alternativeNames: ['Half Plate'],
	}),
	[BasicEquipmentType.FullPlate]: new BasicEquipmentDefinition({
		generator: () =>
			ArmorMode.simple({
				name: 'Full Plate',
				type: ArmorType.HeavyArmor,
				bonus: Bonus.of(5),
				dexPenalty: Bonus.of(-3),
			}),
	}),

	// Shields
	[BasicEquipmentType.SmallShield]: new BasicEquipmentDefinition({
		generator: () =>
			ShieldMode.simple({
				name: 'Small Shield',
				type: ShieldType.SmallShield,
				bonus: Bonus.of(3),
			}),
	}),
	[BasicEquipmentType.LargeShield]: new BasicEquipmentDefinition({
		generator: () =>
			ShieldMode.simple({
				name: 'Large Shield',
				type: ShieldType.LargeShield,
				bonus: Bonus.of(6),
				traits: [Trait.TwoHanded],
			}),
	}),

	// Arcane Foci
	[BasicEquipmentType.Wand]: new BasicEquipmentDefinition({
		generator: () =>
			ArcaneComponentMode.simple({
				name: 'Wand',
				category: 'Typical One-Handed Focus',
				component: ArcaneSpellComponentType.Focal,
				bonus: Bonus.of(2),
				costs: [new ResourceCost({ resource: Resource.SpiritPoint, amount: 1 })],
			}),
	}),
	[BasicEquipmentType.Staff]: new BasicEquipmentDefinition({
		generator: () =>
			ArcaneComponentMode.simple({
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
		generator: () =>
			ArcaneComponentMode.simple({
				name: 'Puzzle Gear Box',
				category: 'Typical One-Handed Tool',
				component: ArcaneSpellComponentType.Somatic,
				bonus: Bonus.of(2),
				costs: [],
			}),
	}),
	[BasicEquipmentType.ConvolutedContraption]: new BasicEquipmentDefinition({
		generator: () =>
			ArcaneComponentMode.simple({
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
		generator: () =>
			ArcaneComponentMode.simple({
				name: 'Ocarina',
				category: 'Typical One-Handed Instrument',
				component: ArcaneSpellComponentType.Verbal,
				bonus: Bonus.of(2),
				costs: [],
			}),
	}),
	[BasicEquipmentType.Lyre]: new BasicEquipmentDefinition({
		generator: () =>
			ArcaneComponentMode.simple({
				name: 'Lyre',
				category: 'Typical Two-Handed Instrument',
				component: ArcaneSpellComponentType.Verbal,
				bonus: Bonus.of(3),
				traits: [Trait.TwoHanded],
				costs: [],
			}),
	}),
};
