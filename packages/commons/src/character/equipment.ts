import { Trait } from '../core/traits.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus, Distance } from '../stats/value.js';

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
}

export const PRIMARY_WEAPON_TYPES: Record<PrimaryWeaponType, PrimaryWeaponTypeDefinition> = {
	[PrimaryWeaponType.Unarmed]: { statType: StatType.STR, rangeType: Trait.Melee },
	[PrimaryWeaponType.Thrown]: { statType: StatType.DEX, rangeType: Trait.Ranged },
	[PrimaryWeaponType.LightMelee]: { statType: StatType.DEX, rangeType: Trait.Melee },
	[PrimaryWeaponType.Ranged]: { statType: StatType.DEX, rangeType: Trait.Ranged },
	[PrimaryWeaponType.HeavyMelee]: { statType: StatType.STR, rangeType: Trait.Melee },
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

export interface Item {
	name: string;
	description: string;
	displayText: string;
	traits: Trait[];
}

export class WeaponMode {
	type: PrimaryWeaponType;
	bonus: Bonus;
	range: Distance;

	constructor({ type, bonus, range }: { type: PrimaryWeaponType; bonus: Bonus; range?: Distance | undefined }) {
		this.type = type;
		this.bonus = bonus;
		this.range = range ?? Distance.of(1);
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
}

export interface WeaponModeOption {
	weapon: Weapon;
	mode: WeaponMode;
}

export class Weapon implements Item {
	name: string;
	modes: WeaponMode[];
	traits: Trait[];

	constructor({ name, modes, traits = [] }: { name: string; modes: WeaponMode[]; traits?: Trait[] }) {
		this.name = name;
		this.modes = modes;
		this.traits = traits;
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
	}): Weapon {
		return new Weapon({
			name,
			modes: [new WeaponMode({ type, bonus, range })],
			traits,
		});
	}

	getEquipmentModifier(mode: WeaponMode): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: `${this.name} (${mode.description})`,
			value: mode.bonus,
		});
	}

	static unarmed(): WeaponModeOption {
		const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(0) });
		const weapon = new Weapon({
			name: 'Unarmed',
			modes: [mode],
		});
		return { weapon, mode };
	}

	static shieldBash(): WeaponModeOption {
		const mode = new WeaponMode({ type: PrimaryWeaponType.Unarmed, bonus: Bonus.of(1) });
		const weapon = new Weapon({
			name: 'Shield Bash',
			modes: [mode],
		});
		return { weapon, mode };
	}

	get description(): string {
		return `${this.modes.map(mode => mode.description).join(' / ')}`;
	}

	get displayText(): string {
		return `${this.name} (${this.description})`;
	}
}

export class Armor implements Item {
	name: string;
	type: ArmorType;
	bonus: Bonus;
	dexPenalty: Bonus;
	traits: Trait[];

	constructor({
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
	}) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.dexPenalty = dexPenalty;
		this.traits = traits;
	}

	get description(): string {
		const dexPenalty = this.dexPenalty.isNotZero ? `, Dex Penalty: ${this.dexPenalty.description}` : '';
		return `${this.type} ${this.bonus.description}${dexPenalty}`;
	}

	get displayText(): string {
		return `${this.name} (${this.description})`;
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: this.description,
			value: this.bonus,
		});
	}
}

export class Shield implements Item {
	name: string;
	type: ShieldType;
	bonus: Bonus;
	traits: Trait[];

	constructor({ name, type, bonus, traits = [] }: { name: string; type: ShieldType; bonus: Bonus; traits?: Trait[] }) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.traits = traits;
	}

	get description(): string {
		return `${this.type} ${this.bonus.description}`;
	}

	get displayText(): string {
		return `${this.name} (${this.description})`;
	}

	getEquipmentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Equipment,
			name: this.description,
			value: this.bonus,
		});
	}
}

export class OtherItem implements Item {
	name: string;
	details: string | undefined;

	constructor({ name, details }: { name: string; details?: string | undefined }) {
		this.name = name;
		this.details = details;
	}

	get description(): string {
		if (this.details) {
			return `${this.name} (${this.details})`;
		}
		return this.name;
	}

	get displayText(): string {
		return this.description;
	}

	get traits(): Trait[] {
		return [];
	}
}

export class Equipment {
	items: Item[];

	constructor(items: Item[] = []) {
		this.items = items;
	}

	static from(prop: string): Equipment {
		if (!prop) {
			return new Equipment();
		}

		const itemData = JSON.parse(prop) as Array<{
			itemType: 'weapon' | 'armor' | 'shield' | 'other';
			name: string;
			details?: string;
			modes?: Array<{
				type: string;
				bonus: number;
				range?: number;
			}>;
			type?: string;
			bonus?: number;
			dexPenalty?: number;
			traits?: string[];
		}>;

		const items: Item[] = itemData.map(data => {
			const traits = data.traits?.map(trait => trait as Trait) || [];

			switch (data.itemType) {
				case 'weapon': {
					if (!data.modes || data.modes.length === 0) {
						throw new Error(`Weapon ${data.name} must have at least one mode`);
					}
					const modes = data.modes.map(
						modeData =>
							new WeaponMode({
								type: modeData.type as PrimaryWeaponType,
								bonus: Bonus.of(modeData.bonus),
								range: modeData.range ? Distance.of(modeData.range) : undefined,
							}),
					);
					return new Weapon({ name: data.name, modes, traits });
				}
				case 'armor': {
					if (!data.type) throw new Error(`Armor ${data.name} must have a type`);
					return new Armor({
						name: data.name,
						type: data.type as ArmorType,
						bonus: Bonus.of(data.bonus ?? 0),
						dexPenalty: Bonus.of(data.dexPenalty ?? 0),
						traits,
					});
				}
				case 'shield': {
					if (!data.type) throw new Error(`Shield ${data.name} must have a type`);
					return new Shield({
						name: data.name,
						type: data.type as ShieldType,
						bonus: Bonus.of(data.bonus ?? 0),
						traits,
					});
				}
				case 'other': {
					return new OtherItem({
						name: data.name,
						details: data.details,
					});
				}
				default:
					throw new Error(`Unknown item type: ${(data as any).itemType}`);
			}
		});

		return new Equipment(items);
	}

	toProp(): string {
		const serializedItems = this.items.map(item => {
			if (item instanceof Weapon) {
				return {
					itemType: 'weapon' as const,
					name: item.name,
					modes: item.modes.map(mode => ({
						type: mode.type,
						bonus: mode.bonus.value,
						range: mode.range.value,
					})),
					traits: item.traits,
				};
			} else if (item instanceof Armor) {
				return {
					itemType: 'armor' as const,
					name: item.name,
					type: item.type,
					bonus: item.bonus.value,
					dexPenalty: item.dexPenalty.value,
					traits: item.traits,
				};
			} else if (item instanceof Shield) {
				return {
					itemType: 'shield' as const,
					name: item.name,
					type: item.type,
					bonus: item.bonus.value,
					traits: item.traits,
				};
			} else if (item instanceof OtherItem) {
				return {
					itemType: 'other' as const,
					name: item.name,
					details: item.details,
				};
			} else {
				throw new Error(`Unknown item type: ${item.constructor.name}`);
			}
		});
		return JSON.stringify(serializedItems);
	}
}

export enum BasicEquipmentType {
	Javelin = 'Javelin',
	Hatchet = 'Hatchet',
	Dagger = 'Dagger',
	Rapier = 'Rapier',
	BowAndArrows = 'Bow & Arrows',
	CrossbowAndDarts = 'Crossbow & Darts',
	Spear = 'Spear',
	Mace = 'Mace',
	Longsword = 'Longsword',
	LeatherArmor = 'Leather Armor',
	Chainmail = 'Chainmail',
	FullPlate = 'Full Plate',
	SmallShield = 'Small Shield',
	LargeShield = 'Large Shield',
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
			Weapon.simple({
				name: 'Javelin',
				type: PrimaryWeaponType.Thrown,
				bonus: Bonus.of(2),
				range: Distance.of(6),
			}),
		alternativeNames: ['Darts'],
	}),
	[BasicEquipmentType.Hatchet]: new BasicEquipmentDefinition({
		generator: () =>
			new Weapon({
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
			new Weapon({
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
			Weapon.simple({
				name: 'Rapier',
				type: PrimaryWeaponType.LightMelee,
				bonus: Bonus.of(4),
			}),
		alternativeNames: ['Short Sword'],
	}),
	[BasicEquipmentType.BowAndArrows]: new BasicEquipmentDefinition({
		generator: () =>
			Weapon.simple({
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
			Weapon.simple({
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
			Weapon.simple({
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
			Weapon.simple({
				name: 'Mace',
				type: PrimaryWeaponType.HeavyMelee,
				bonus: Bonus.of(5),
				range: Distance.of(12),
			}),
		alternativeNames: ['Club', 'Mace', 'Morningstar'],
	}),
	[BasicEquipmentType.Longsword]: new BasicEquipmentDefinition({
		generator: () =>
			Weapon.simple({
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
			new Armor({
				name: 'Leather Armor',
				type: ArmorType.LightArmor,
				bonus: Bonus.of(1),
				dexPenalty: Bonus.zero(),
			}),
		alternativeNames: ['Padded Armor', 'Hide'],
	}),
	[BasicEquipmentType.Chainmail]: new BasicEquipmentDefinition({
		generator: () =>
			new Armor({
				name: 'Chainmail',
				type: ArmorType.MediumArmor,
				bonus: Bonus.of(3),
				dexPenalty: Bonus.of(-1),
			}),
		alternativeNames: ['Half Plate'],
	}),
	[BasicEquipmentType.FullPlate]: new BasicEquipmentDefinition({
		generator: () =>
			new Armor({
				name: 'Full Plate',
				type: ArmorType.HeavyArmor,
				bonus: Bonus.of(5),
				dexPenalty: Bonus.of(-3),
			}),
	}),

	// Shields
	[BasicEquipmentType.SmallShield]: new BasicEquipmentDefinition({
		generator: () =>
			new Shield({
				name: 'Small Shield',
				type: ShieldType.SmallShield,
				bonus: Bonus.of(3),
			}),
	}),
	[BasicEquipmentType.LargeShield]: new BasicEquipmentDefinition({
		generator: () =>
			new Shield({
				name: 'Large Shield',
				type: ShieldType.LargeShield,
				bonus: Bonus.of(6),
				traits: [Trait.TwoHanded],
			}),
	}),
};
