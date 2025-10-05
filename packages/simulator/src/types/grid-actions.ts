import {
	Armor,
	Bonus,
	CharacterSheet,
	Check,
	CheckMode,
	CheckNature,
	CircumstanceModifier,
	Distance,
	ModifierSource,
	Shield,
	StatModifier,
	StatType,
	Weapon,
} from '@shattered-wilds/commons';

export interface BasicAttack {
	name: string;
	description: string;
	check: Check;
	range: Distance;
}

// TODO(luan): get rid of this and use ACTIONS instead
export enum DefenseType {
	BasicBody = 'Basic Body',
	BasicMind = 'Basic Mind',
	BasicSoul = 'Basic Soul',
	Dodge = 'Dodge',
	TakeCover = 'Take Cover',
	ShieldBlock = 'Shield Block',
}

export const DEFENSE_TYPE_PROPERTIES: Record<
	DefenseType,
	{
		stat: StatType;
		cm: Bonus;
	}
> = {
	[DefenseType.BasicBody]: {
		stat: StatType.Body,
		cm: Bonus.zero(),
	},
	[DefenseType.BasicMind]: {
		stat: StatType.Mind,
		cm: Bonus.zero(),
	},
	[DefenseType.BasicSoul]: {
		stat: StatType.Soul,
		cm: Bonus.zero(),
	},
	[DefenseType.Dodge]: {
		stat: StatType.Evasiveness,
		cm: Bonus.of(3),
	},
	[DefenseType.TakeCover]: {
		stat: StatType.Agility,
		cm: Bonus.of(6),
	},
	[DefenseType.ShieldBlock]: {
		stat: StatType.Body,
		cm: Bonus.zero(),
	},
};

export const getBasicAttacksFor = (character: CharacterSheet): BasicAttack[] => {
	const tree = character.getStatTree();
	const attacks: BasicAttack[] = [];

	// Add weapon attacks
	character.equipment.items
		.filter(item => item instanceof Weapon)
		.forEach(item => {
			const weapon = item as Weapon;
			weapon.modes.forEach(mode => {
				const name = weapon.name;
				const weaponModifier = <CircumstanceModifier>{
					source: ModifierSource.Equipment,
					name: `${name} (${mode.type})`,
					description: `Weapon bonus from ${name} (${mode.type})`,
					value: mode.bonus,
				};
				attacks.push({
					name: name,
					description: `${name} ${mode.type} (${mode.bonus.description})`,
					check: new Check({
						mode: CheckMode.Static,
						nature: CheckNature.Active,
						descriptor: name,
						statModifier: tree.getModifier(mode.statType, [weaponModifier]),
					}),
					range: mode.range,
				});
			});
		});

	// Add Shield Bash if a shield is equipped
	const shield = character.equipment.items.find(item => item instanceof Shield);
	if (shield) {
		const shieldModifier = <CircumstanceModifier>{
			source: ModifierSource.Equipment,
			name: 'Shield Bash',
			description: `Shield Bash bonus from ${shield.name}`,
			value: Bonus.of(1),
		};
		attacks.push({
			name: 'Shield Bash',
			description: 'Shield Bash',
			check: new Check({
				mode: CheckMode.Static,
				nature: CheckNature.Active,
				descriptor: 'Shield Bash',
				statModifier: tree.getModifier(StatType.STR, [shieldModifier]),
			}),
			range: Distance.melee(),
		});
	}

	// Add Unarmed attack (always available)
	attacks.push({
		name: 'Unarmed',
		description: 'Unarmed',
		check: new Check({
			mode: CheckMode.Contested,
			nature: CheckNature.Active,
			descriptor: 'Unarmed',
			statModifier: tree.getModifier(StatType.STR),
		}),
		range: Distance.melee(),
	});

	return attacks;
};

export const getBasicDefenseFor = (character: CharacterSheet, type: DefenseType): StatModifier => {
	const { stat, cm } = DEFENSE_TYPE_PROPERTIES[type];

	const cms: CircumstanceModifier[] = [];

	const armor = character.equipment.items.find(item => item instanceof Armor);
	if (armor) {
		const armorModifier = <CircumstanceModifier>{
			source: ModifierSource.Equipment,
			name: 'Armor',
			description: `Armor bonus from ${armor.name}`,
			value: armor.bonus,
		};
		cms.push(armorModifier);
	}

	if (type === DefenseType.ShieldBlock) {
		const shield = character.equipment.items.find(item => item instanceof Shield);
		if (shield) {
			const shieldModifier = <CircumstanceModifier>{
				source: ModifierSource.Equipment,
				name: 'Shield Block',
				description: `Shield Block bonus from ${shield.name}`,
				value: shield.bonus,
			};
			cms.push(shieldModifier);
		}
	}

	if (cm.isNotZero) {
		cms.push(
			new CircumstanceModifier({
				source: ModifierSource.Circumstance,
				name: type,
				value: cm,
			}),
		);
	}

	return character.getStatTree().getModifier(stat, cms);
};
