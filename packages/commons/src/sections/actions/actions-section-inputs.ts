import { CharacterSheet } from '../../character/character-sheet.js';
import { Armor, Shield, WeaponModeOption } from '../../character/equipment.js';
import { ActionType } from '../../core/actions.js';
import { COVER_TYPES, PassiveCoverType } from '../../core/cover.js';
import { Trait } from '../../core/traits.js';
import { DerivedStatType } from '../../stats/derived-stat.js';
import { Resource } from '../../stats/resources.js';
import { CircumstanceModifier, ModifierSource } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Bonus, Distance } from '../../stats/value.js';
import { getEnumKeys, numberToOrdinal } from '../../utils/utils.js';
import {
	DistanceInput,
	DropdownInput,
	FixedBonusInput,
	FixedDistanceInput,
	NumberInput,
	ResourceInput,
	SectionInput,
} from '../common/section-inputs.js';

export class ActionTabInputValues {
	selectedWeaponMode: WeaponModeOption;
	selectedRangeValue: number;
	selectedDefenseRealm: StatType;
	selectedPassiveCover: PassiveCoverType;
	heightIncrements: number;
	selectedArmor: Armor | 'None';
	selectedShield: Shield | 'None';

	constructor({
		selectedWeaponMode,
		selectedRangeValue,
		selectedDefenseRealm,
		selectedPassiveCover,
		heightIncrements,
		selectedArmor,
		selectedShield,
	}: {
		selectedWeaponMode: WeaponModeOption;
		selectedRangeValue: number;
		selectedDefenseRealm: StatType;
		selectedPassiveCover: PassiveCoverType;
		heightIncrements: number;
		selectedArmor: Armor | 'None';
		selectedShield: Shield | 'None';
	}) {
		this.selectedWeaponMode = selectedWeaponMode;
		this.selectedRangeValue = selectedRangeValue;
		this.selectedDefenseRealm = selectedDefenseRealm;
		this.selectedPassiveCover = selectedPassiveCover;
		this.heightIncrements = heightIncrements;
		this.selectedArmor = selectedArmor;
		this.selectedShield = selectedShield;
	}

	copyWith({
		selectedWeapon,
		selectedRangeValue,
		selectedDefenseRealm,
		selectedPassiveCover,
		heightIncrements,
		selectedArmor,
		selectedShield,
	}: {
		selectedWeapon?: WeaponModeOption;
		selectedRangeValue?: number;
		selectedDefenseRealm?: StatType;
		selectedPassiveCover?: PassiveCoverType;
		heightIncrements?: number;
		selectedArmor?: Armor | 'None';
		selectedShield?: Shield | 'None';
	}): ActionTabInputValues {
		return new ActionTabInputValues({
			selectedWeaponMode: selectedWeapon ?? this.selectedWeaponMode,
			selectedRangeValue: selectedRangeValue ?? this.selectedRangeValue,
			selectedDefenseRealm: selectedDefenseRealm ?? this.selectedDefenseRealm,
			selectedPassiveCover: selectedPassiveCover ?? this.selectedPassiveCover,
			heightIncrements: heightIncrements ?? this.heightIncrements,
			selectedArmor: selectedArmor ?? this.selectedArmor,
			selectedShield: selectedShield ?? this.selectedShield,
		});
	}

	selectedRange = (): Distance => {
		return Distance.of(this.selectedRangeValue);
	};

	weaponModifier = (): CircumstanceModifier | null => {
		return this.selectedWeaponMode
			? this.selectedWeaponMode.weapon.getEquipmentModifier(this.selectedWeaponMode.mode)
			: null;
	};

	rangeIncrementModifier = (): CircumstanceModifier | null => {
		if (
			!this.selectedWeaponMode ||
			!this.selectedRangeValue ||
			this.selectedWeaponMode.mode.rangeType !== Trait.Ranged
		) {
			return null;
		}

		const weaponRange = this.selectedWeaponMode.mode.range;
		const rangeIncrements = Math.max(0, Math.floor((this.selectedRangeValue - 1) / weaponRange.value));

		if (rangeIncrements === 0) {
			return null;
		}

		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});
	};

	passiveCoverModifier = (): CircumstanceModifier | null => {
		if (this.selectedPassiveCover === PassiveCoverType.None) {
			return null;
		}
		return COVER_TYPES[this.selectedPassiveCover].modifier;
	};

	heightIncrementsModifier = (): CircumstanceModifier | null => {
		const value = this.heightIncrements;
		if (value === 0) {
			return null;
		}
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Height Increments (${value})`,
			value: Bonus.of(value * -3),
		});
	};
}

export class ActionsSectionInputFactory {
	sheet: CharacterSheet;
	inputValues: ActionTabInputValues;
	update: (current: ActionTabInputValues) => void;

	// derived fields
	movementValue: { value: Distance; description: string };
	weaponModes: WeaponModeOption[];
	armors: (Armor | 'None')[];
	shields: (Shield | 'None')[];

	constructor({
		sheet,
		inputValues,
		update,
	}: {
		sheet: CharacterSheet;
		inputValues: ActionTabInputValues;
		update: (current: ActionTabInputValues) => void;
	}) {
		this.sheet = sheet;
		this.inputValues = inputValues;
		this.update = update;

		// derived fields
		this.movementValue = this.sheet.getStatTree().getDistance(DerivedStatType.Movement);
		this.weaponModes = this.sheet.equipment.weaponModes();
		this.armors = this.sheet.equipment.armorOptions();
		this.shields = this.sheet.equipment.shieldOptions();
	}

	getInputsForActionType(type: ActionType): SectionInput[] {
		return this.getInputsForActionTypeOrUndefined(type).filter((e): e is SectionInput => e !== undefined);
	}

	private getInputsForActionTypeOrUndefined(type: ActionType): (SectionInput | undefined)[] {
		const hasRangedWeapon = this.inputValues.selectedWeaponMode?.mode.rangeType === Trait.Ranged;
		const isBodyDefense = this.inputValues.selectedDefenseRealm?.name === 'Body';

		switch (type) {
			case ActionType.Movement:
				return [this.movement(), this.resource(Resource.ActionPoint)];
			case ActionType.Attack:
				return [
					this.weaponMode(),
					...(hasRangedWeapon
						? [
								this.rangeIncrement(),
								this.target(),
								this.inputValues.selectedRangeValue ? this.rangeCM() : undefined,
								this.passiveCover(),
								this.heightIncrements(),
								this.inputValues.heightIncrementsModifier() ? this.heightIncrementsModifier() : undefined,
							]
						: []),
				];
			case ActionType.Defense:
				return [
					this.defenseRealm(),
					isBodyDefense ? this.armor() : undefined,
					isBodyDefense ? this.shield() : undefined,
				];
			case ActionType.Support:
				return [
					this.resource(Resource.ActionPoint),
					this.resource(Resource.VitalityPoint),
					this.resource(Resource.FocusPoint),
					this.resource(Resource.SpiritPoint),
				];
			case ActionType.Heroic:
				return [this.resource(Resource.ActionPoint), this.resource(Resource.HeroismPoint)];
			case ActionType.Meta:
				return [];
		}
	}

	private movement(): SectionInput {
		return new FixedDistanceInput({
			key: `action-inputs-movement`,
			label: 'Movement',
			tooltip: this.movementValue.description,
			value: this.movementValue.value,
		});
	}

	private resource(resource: Resource): SectionInput {
		return new ResourceInput({
			key: `action-inputs-${resource}`,
			resource: resource,
		});
	}

	private weaponMode(): SectionInput {
		return new DropdownInput<WeaponModeOption>({
			key: `action-inputs-weapon-mode`,
			label: 'Weapon',
			tooltip: 'Select the weapon to use for the attack',
			options: this.weaponModes,
			describe: weaponMode => `${weaponMode.weapon.name} - ${weaponMode.mode.description}`,
			getter: () => this.inputValues.selectedWeaponMode,
			setter: weaponMode => {
				this.update(this.inputValues.copyWith({ selectedWeapon: weaponMode }));
			},
		});
	}

	private rangeIncrement(): SectionInput | undefined {
		const range = this.inputValues.selectedWeaponMode?.mode.range;
		if (range === undefined) {
			return undefined;
		}

		return new FixedDistanceInput({
			key: `action-inputs-range-increment`,
			label: 'Range Increment',
			tooltip: 'The range increment of the selected weapon',
			value: range,
		});
	}

	private rangeCM(): SectionInput | undefined {
		const rangeIncrementModifier = this.inputValues.rangeIncrementModifier();
		if (rangeIncrementModifier === null) {
			return undefined;
		}

		return new FixedBonusInput({
			key: `action-inputs-range-cm`,
			label: 'Range CM',
			tooltip: rangeIncrementModifier.description,
			value: rangeIncrementModifier.value,
		});
	}

	private target(): SectionInput {
		return new DistanceInput({
			key: `action-inputs-target`,
			label: 'Target (Hexes)',
			tooltip: 'Enter the distance to the target in hexes',
			getter: () => this.inputValues.selectedRange(),
			setter: value => {
				this.update(this.inputValues.copyWith({ selectedRangeValue: value.value }));
			},
		});
	}

	private passiveCover(): SectionInput {
		return new DropdownInput<PassiveCoverType>({
			key: `action-inputs-passive-cover`,
			label: 'Passive Cover',
			tooltip: 'Select the passive cover of the target',
			options: getEnumKeys(PassiveCoverType),
			describe: cover => {
				const definition = COVER_TYPES[cover];
				const bonus = definition.modifier.value.value;
				return bonus === 0 ? cover : `${cover} (${bonus})`;
			},
			getter: () => this.inputValues.selectedPassiveCover,
			setter: cover => {
				this.update(this.inputValues.copyWith({ selectedPassiveCover: cover }));
			},
		});
	}

	private heightIncrements(): SectionInput {
		const heightIncrementsModifier = this.inputValues.heightIncrementsModifier();
		return new NumberInput({
			key: `action-inputs-height-increments`,
			label: 'Height Increments',
			tooltip: heightIncrementsModifier
				? heightIncrementsModifier.description
				: 'Provide the number of height increments between the attacker and the target.',
			getter: () => this.inputValues.heightIncrements,
			setter: value => {
				this.update(this.inputValues.copyWith({ heightIncrements: value }));
			},
		});
	}

	private heightIncrementsModifier(): SectionInput | undefined {
		const heightIncrementsModifier = this.inputValues.heightIncrementsModifier();
		if (heightIncrementsModifier === null) {
			return undefined;
		}

		return new FixedBonusInput({
			key: `action-inputs-height-increments-cm`,
			label: 'Height CM',
			tooltip: heightIncrementsModifier.description,
			value: heightIncrementsModifier.value,
		});
	}

	private defenseRealm(): SectionInput {
		return new DropdownInput<StatType>({
			key: `action-inputs-defense-realm`,
			label: 'Realm',
			tooltip: 'Select the Realm of the attack you are defending against.',
			options: StatType.realms,
			describe: realm => realm.name,
			getter: () => this.inputValues.selectedDefenseRealm,
			setter: realm => {
				this.update(this.inputValues.copyWith({ selectedDefenseRealm: realm }));
			},
		});
	}

	private armor(): SectionInput {
		return new DropdownInput<Armor | 'None'>({
			key: `action-inputs-armor`,
			label: 'Armor',
			tooltip: 'Armor is applied to the any **Body Defense** check.',
			options: this.armors,
			describe: armor => (armor === 'None' ? 'No Armor' : armor.displayText),
			getter: () => this.inputValues.selectedArmor,
			setter: armor => {
				this.update(this.inputValues.copyWith({ selectedArmor: armor }));
			},
		});
	}

	private shield(): SectionInput {
		return new DropdownInput<Shield | 'None'>({
			key: `action-inputs-shield`,
			label: 'Shield',
			tooltip: 'Select the shield to use for the Body Defense check.',
			options: this.shields,
			describe: shield => (shield === 'None' ? 'No Shield' : shield.displayText),
			getter: () => this.inputValues.selectedShield,
			setter: shield => {
				this.update(this.inputValues.copyWith({ selectedShield: shield }));
			},
		});
	}
}
