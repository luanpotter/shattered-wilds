import { CharacterSheet } from '../../character/character-sheet.js';
import { ArcaneFocus } from '../../character/equipment.js';
import {
	ARCANE_SPELL_COMPONENTS,
	ArcaneSpellComponentOption,
	ArcaneSpellComponentType,
	ArcaneSpellSchool,
	ArcaneSpellDefinition,
	PREDEFINED_ARCANE_SPELLS,
} from '../../core/arcane.js';
import { ActionCost } from '../../core/actions.js';
import { Trait } from '../../core/traits.js';
import { DerivedStatType } from '../../stats/derived-stat.js';
import { Resource } from '../../stats/resources.js';
import { CircumstanceModifier, ModifierSource, StatModifier } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Bonus, Distance } from '../../stats/value.js';
import { firstParagraph, numberToOrdinal, slugify } from '../../utils/utils.js';
import { ActionRowCost } from '../common/action-row.js';
import { Check, CheckMode, CheckNature } from '../../stats/check.js';

export type ArcaneSectionSchoolOption = 'All Schools' | ArcaneSpellSchool;
export type ArcaneSectionCastingTimeOption = { name: string; value: number; modifier: Bonus; maxFocusCost?: number };
export type ArcaneSectionFocusCostOption = { name: string; value: number; modifier: Bonus };
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

export class ArcaneSectionDefaults {
	static readonly INITIAL_RANGE = Distance.of(0);
	static readonly INITIAL_SCHOOL: ArcaneSectionSchoolOption = 'All Schools';
	static readonly INITIAL_ATTACK_OPTION: ArcaneSectionAttackOption = 'All Spells';
	static readonly INITIAL_CASTING_TIME_INDEX = 1; // 2 AP
	static readonly INITIAL_FOCUS_COST_INDEX = 0; // 1 FP

	static createDefaultInputValues(
		componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>,
	): ArcaneSectionInputValues {
		return {
			selectedRange: ArcaneSectionDefaults.INITIAL_RANGE,
			selectedSchool: ArcaneSectionDefaults.INITIAL_SCHOOL,
			selectedAttackOption: ArcaneSectionDefaults.INITIAL_ATTACK_OPTION,
			selectedCastingTime: ArcaneSection.allCastingTimeOptions[ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX]!,
			selectedFocusCost: ArcaneSection.allFocusCostOptions[ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX]!,
			selectedSomaticComponent: componentOptions[ArcaneSpellComponentType.Somatic]?.[0] ?? null,
			selectedVerbalComponent: componentOptions[ArcaneSpellComponentType.Verbal]?.[0] ?? null,
			selectedFocalComponent: componentOptions[ArcaneSpellComponentType.Focal]?.[0] ?? null,
			spellAugmentationValues: {},
		};
	}
}

export class ArcaneSectionSpellAugmentation {
	key: string;
	type: string;
	shortDescription: string;
	variable: boolean;
	value: number;
	bonus: Bonus;
	tooltip: string;

	constructor({
		key,
		type,
		shortDescription,
		variable,
		value,
		bonus,
		tooltip,
	}: {
		key: string;
		type: string;
		shortDescription: string;
		variable: boolean;
		value: number;
		bonus: Bonus;
		tooltip: string;
	}) {
		this.key = key;
		this.type = type;
		this.shortDescription = shortDescription;
		this.variable = variable;
		this.value = value;
		this.bonus = bonus;
		this.tooltip = tooltip;
	}

	get description(): string {
		return `Augmentation [${this.type}: ${this.shortDescription}]`;
	}

	toModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Augmentation,
			name: this.description,
			value: this.bonus,
		});
	}
}

export class ArcaneSectionSpell {
	key: string;
	slug: string;
	name: string;
	school: ArcaneSpellSchool;
	traits: Trait[];
	description: string;
	augmentations: ArcaneSectionSpellAugmentation[];
	check: Check;

	constructor({
		key,
		slug,
		name,
		school,
		traits,
		description,
		augmentations,
		check,
	}: {
		key: string;
		slug: string;
		name: string;
		school: ArcaneSpellSchool;
		traits: Trait[];
		description: string;
		augmentations: ArcaneSectionSpellAugmentation[];
		check: Check;
	}) {
		this.key = key;
		this.slug = slug;
		this.name = name;
		this.school = school;
		this.traits = traits;
		this.description = description;
		this.augmentations = augmentations;
		this.check = check;
	}
}

export class ArcaneSection {
	static readonly allSchoolOptions: readonly ArcaneSectionSchoolOption[] = [
		'All Schools' as const,
		...(Object.values(ArcaneSpellSchool) as ArcaneSpellSchool[]),
	];

	static readonly allAttackOptions: readonly ArcaneSectionAttackOption[] = [
		'All Spells',
		'Only Attacks',
		'Only Utility',
	];

	static readonly allCastingTimeOptions: readonly ArcaneSectionCastingTimeOption[] = [
		{ name: '1 AP', value: 1, modifier: Bonus.of(-12), maxFocusCost: 1 },
		{ name: '2 AP', value: 2, modifier: Bonus.zero(), maxFocusCost: 2 },
		{ name: '3 AP', value: 3, modifier: Bonus.of(2), maxFocusCost: 3 },
		{ name: '4 AP', value: 4, modifier: Bonus.of(4), maxFocusCost: 4 },
		{ name: 'Ritual', value: 0, modifier: Bonus.of(6) },
	];

	static readonly allFocusCostOptions: readonly ArcaneSectionFocusCostOption[] = [
		{ name: '1 FP', value: 1, modifier: Bonus.zero() },
		{ name: '2 FP', value: 2, modifier: Bonus.of(1) },
		{ name: '3 FP', value: 3, modifier: Bonus.of(2) },
		{ name: '4 FP', value: 4, modifier: Bonus.of(3) },
	];

	static getAvailableFocusCostOptions(
		selectedCastingTime: ArcaneSectionCastingTimeOption,
	): readonly ArcaneSectionFocusCostOption[] {
		return ArcaneSection.allFocusCostOptions.filter(
			option =>
				!('maxFocusCost' in selectedCastingTime) ||
				!selectedCastingTime.maxFocusCost ||
				selectedCastingTime.maxFocusCost >= option.value,
		);
	}

	private static createFocalComponentOptions(sheet: CharacterSheet): ArcaneSpellComponentOption[] {
		const flavor = sheet.characterClass.definition.flavor;
		const noFocalComponent = ARCANE_SPELL_COMPONENTS.filter(component => component.flavors.includes(flavor)).find(
			c => c.type === ArcaneSpellComponentType.Focal,
		);
		if (!noFocalComponent) {
			return [];
		}

		const arcaneFoci = sheet.equipment.items.filter(item => item instanceof ArcaneFocus) as ArcaneFocus[];

		return [
			{
				name: noFocalComponent.name,
				toComponentModifier: () => noFocalComponent.toComponentModifier(),
			},
			...arcaneFoci.map(focus => ({
				name: focus.name,
				toComponentModifier: () => focus.getEquipmentModifier(),
			})),
		];
	}

	private static componentsForFlavor = ({
		sheet,
	}: {
		sheet: CharacterSheet;
	}): Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>> => {
		const flavor = sheet.characterClass.definition.flavor;
		const base = Object.groupBy(
			ARCANE_SPELL_COMPONENTS.filter(component => component.type !== ArcaneSpellComponentType.Focal).filter(component =>
				component.flavors.includes(flavor),
			),
			component => component.type,
		);
		const focalComponents = ArcaneSection.createFocalComponentOptions(sheet);
		return {
			...base,
			...(focalComponents.length > 0 ? { [ArcaneSpellComponentType.Focal]: focalComponents } : {}),
		};
	};

	static getComponentsForFlavor(
		sheet: CharacterSheet,
	): Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>> {
		return ArcaneSection.componentsForFlavor({ sheet });
	}

	private static computeInfluenceRange = ({
		sheet,
		inputValues,
	}: {
		sheet: CharacterSheet;
		inputValues: ArcaneSectionInputValues;
	}): ArcaneSectionInfluenceRange => {
		const tree = sheet.getStatTree();
		const { value, description } = tree.getDistance(DerivedStatType.InfluenceRange);
		const { selectedRange } = inputValues;
		const rangeIncrements = Math.max(0, Math.floor((selectedRange.value - 1) / value.value));

		const rangeIncrementModifier = new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});

		return { value, description, rangeIncrementModifier };
	};

	private static filterSpells = (inputValues: ArcaneSectionInputValues): ArcaneSpellDefinition[] => {
		const { selectedSchool, selectedAttackOption } = inputValues;
		const attackTraits = [Trait.BodyAttack, Trait.MindAttack, Trait.SoulAttack, Trait.SpecialAttack];

		return Object.values(PREDEFINED_ARCANE_SPELLS)
			.filter(spell => {
				if (selectedSchool === 'All Schools') {
					return true;
				}
				return spell.school === selectedSchool;
			})
			.filter(spell => {
				switch (selectedAttackOption) {
					case 'All Spells':
						return true;
					case 'Only Attacks':
						return spell.traits.some(trait => attackTraits.includes(trait));
					case 'Only Utility':
						return spell.traits.every(trait => !attackTraits.includes(trait));
					default:
						throw selectedAttackOption satisfies never;
				}
			});
	};

	private static computeSpells = ({
		sheet,
		inputValues,
		fundamentalModifiers,
	}: {
		sheet: CharacterSheet;
		inputValues: ArcaneSectionInputValues;
		fundamentalModifiers: CircumstanceModifier[];
	}): ArcaneSectionSpell[] => {
		const tree = sheet.getStatTree();
		const primaryAttribute = sheet.characterClass.definition.primaryAttribute;
		const filteredSpells = ArcaneSection.filterSpells(inputValues);

		return filteredSpells.map(spell => {
			const augmentations = spell.augmentations.map(augmentation => {
				const value = inputValues.spellAugmentationValues[spell.name]?.[augmentation.key] ?? 1;
				const bonus = Bonus.of(augmentation.computeBonus(value));
				return new ArcaneSectionSpellAugmentation({
					key: augmentation.key,
					type: augmentation.type,
					shortDescription: augmentation.shortDescription,
					variable: augmentation.variable,
					value,
					bonus,
					tooltip: augmentation.getTooltip(value),
				});
			});

			const spellModifiers = [...fundamentalModifiers, ...augmentations.map(aug => aug.toModifier())];

			const finalModifier = tree.getModifier(primaryAttribute, spellModifiers);
			const check = new Check({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statModifier: finalModifier,
			});

			return new ArcaneSectionSpell({
				key: spell.name,
				slug: slugify(spell.name),
				name: spell.name,
				school: spell.school,
				traits: spell.traits,
				description: firstParagraph(spell.description),
				augmentations,
				check,
			});
		});
	};

	schoolOptions: readonly ArcaneSectionSchoolOption[];
	castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
	focusCostOptions: readonly ArcaneSectionFocusCostOption[];
	componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
	attackOptions: readonly ArcaneSectionAttackOption[];

	influenceRange: ArcaneSectionInfluenceRange;
	baseModifier: StatModifier;
	combinedModifiers: CircumstanceModifier[];
	combinedModifier: StatModifier;
	fundamentalModifiers: CircumstanceModifier[];
	fundamentalCheck: Check;
	fundamentalSpellCost: ActionRowCost;
	spells: ArcaneSectionSpell[];
	primaryAttribute: StatType;

	constructor({
		schoolOptions,
		castingTimeOptions,
		focusCostOptions,
		componentOptions,
		influenceRange,
		baseModifier,
		combinedModifiers,
		combinedModifier,
		fundamentalModifiers,
		fundamentalCheck,
		fundamentalSpellCost,
		spells,
		primaryAttribute,
	}: {
		schoolOptions: readonly ArcaneSectionSchoolOption[];
		castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
		focusCostOptions: readonly ArcaneSectionFocusCostOption[];
		componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
		influenceRange: ArcaneSectionInfluenceRange;
		baseModifier: StatModifier;
		combinedModifiers: CircumstanceModifier[];
		combinedModifier: StatModifier;
		fundamentalModifiers: CircumstanceModifier[];
		fundamentalCheck: Check;
		fundamentalSpellCost: ActionRowCost;
		spells: ArcaneSectionSpell[];
		primaryAttribute: StatType;
	}) {
		this.schoolOptions = schoolOptions;
		this.castingTimeOptions = castingTimeOptions;
		this.focusCostOptions = focusCostOptions;
		this.componentOptions = componentOptions;
		this.attackOptions = ArcaneSection.allAttackOptions;
		this.influenceRange = influenceRange;
		this.baseModifier = baseModifier;
		this.combinedModifiers = combinedModifiers;
		this.combinedModifier = combinedModifier;
		this.fundamentalModifiers = fundamentalModifiers;
		this.fundamentalCheck = fundamentalCheck;
		this.fundamentalSpellCost = fundamentalSpellCost;
		this.spells = spells;
		this.primaryAttribute = primaryAttribute;
	}

	static create({
		characterId,
		sheet,
		inputValues,
	}: {
		characterId: string;
		sheet: CharacterSheet;
		inputValues: ArcaneSectionInputValues;
	}): ArcaneSection {
		const tree = sheet.getStatTree();
		const primaryAttribute = sheet.characterClass.definition.primaryAttribute;
		const influenceRange = ArcaneSection.computeInfluenceRange({ sheet, inputValues });

		// Extract component modifiers
		const somaticModifier = inputValues.selectedSomaticComponent?.toComponentModifier();
		const verbalModifier = inputValues.selectedVerbalComponent?.toComponentModifier();
		const focalModifier = inputValues.selectedFocalComponent?.toComponentModifier();

		const combinedModifiers = [
			influenceRange.rangeIncrementModifier,
			somaticModifier,
			verbalModifier,
			focalModifier,
		].filter((e): e is CircumstanceModifier => e !== undefined);

		const fundamentalModifiers = [
			...combinedModifiers,
			inputValues.selectedCastingTime.modifier.value !== 0
				? new CircumstanceModifier({
						source: ModifierSource.Augmentation,
						name: `Casting Time: ${inputValues.selectedCastingTime.name}`,
						value: inputValues.selectedCastingTime.modifier,
					})
				: undefined,
			inputValues.selectedFocusCost.modifier.value !== 0
				? new CircumstanceModifier({
						source: ModifierSource.Augmentation,
						name: `Focus Cost: ${inputValues.selectedFocusCost.name}`,
						value: inputValues.selectedFocusCost.modifier,
					})
				: undefined,
		].filter((e): e is CircumstanceModifier => e !== undefined);

		const baseModifier = tree.getModifier(primaryAttribute);
		const combinedModifier = tree.getModifier(primaryAttribute, combinedModifiers);
		const fundamentalModifier = tree.getModifier(primaryAttribute, fundamentalModifiers);
		const fundamentalCheck = new Check({
			mode: CheckMode.Contested,
			nature: CheckNature.Active,
			statModifier: fundamentalModifier,
		});

		const costs = [
			new ActionCost({ resource: Resource.ActionPoint, amount: inputValues.selectedCastingTime.value }),
			new ActionCost({ resource: Resource.FocusPoint, amount: inputValues.selectedFocusCost.value }),
		];

		const fundamentalSpellCost = new ActionRowCost({
			characterId: characterId,
			characterSheet: sheet,
			name: 'Arcane Spell',
			actionCosts: costs,
		});

		const spells = ArcaneSection.computeSpells({ sheet, inputValues, fundamentalModifiers });

		return new ArcaneSection({
			schoolOptions: ArcaneSection.allSchoolOptions,
			castingTimeOptions: ArcaneSection.allCastingTimeOptions,
			focusCostOptions: ArcaneSection.allFocusCostOptions,
			componentOptions: ArcaneSection.componentsForFlavor({ sheet }),
			influenceRange,
			baseModifier,
			combinedModifiers,
			combinedModifier,
			fundamentalModifiers,
			fundamentalCheck,
			fundamentalSpellCost,
			spells,
			primaryAttribute,
		});
	}
}
