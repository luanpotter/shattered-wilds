import { CharacterSheet } from '../character/character-sheet.js';
import { ArcaneFocus } from '../character/equipment.js';
import {
	ARCANE_SPELL_COMPONENTS,
	ArcaneSpellComponentOption,
	ArcaneSpellComponentType,
	ArcaneSpellSchool,
} from '../core/arcane.js';
import { DerivedStatType } from '../stats/derived-stat.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus, Distance } from '../stats/value.js';
import { numberToOrdinal } from '../utils/utils.js';

export type ArcaneSectionSchoolOption = 'All Schools' | ArcaneSpellSchool;
export type ArcaneSectionCastingTimeOption = { name: string; value: number; modifier: Bonus; maxFocusCost?: number };
export type ArcaneSectionFocusCostOption = { name: string; value: number; modifier: Bonus };

const allAttackOptions = ['All Spells', 'Only Attacks', 'Only Utility'] as const;
export type ArcaneSectionAttackOption = (typeof allAttackOptions)[number];

export type ArcaneSectionInfluenceRange = {
	value: Distance;
	description: string;
	rangeIncrementModifier: CircumstanceModifier;
};

export type ArcaneSectionInputValues = {
	selectedRange: Distance;
};

export class ArcaneSection {
	private static allSchoolOptions = [
		'All Schools' as const,
		...(Object.values(ArcaneSpellSchool) as ArcaneSpellSchool[]),
	] as readonly ArcaneSectionSchoolOption[];

	private static allCastingTimeOptions = [
		{ name: '1 AP', value: 1, modifier: Bonus.of(-12), maxFocusCost: 1 },
		{ name: '2 AP', value: 2, modifier: Bonus.zero(), maxFocusCost: 2 },
		{ name: '3 AP', value: 3, modifier: Bonus.of(2), maxFocusCost: 3 },
		{ name: '4 AP', value: 4, modifier: Bonus.of(4), maxFocusCost: 4 },
		{ name: 'Ritual', value: 0, modifier: Bonus.of(6) },
	];

	private static allFocusCostOptions = [
		{ name: '1 FP', value: 1, modifier: Bonus.zero() },
		{ name: '2 FP', value: 2, modifier: Bonus.of(1) },
		{ name: '3 FP', value: 3, modifier: Bonus.of(2) },
		{ name: '4 FP', value: 4, modifier: Bonus.of(3) },
	];

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

	schoolOptions: readonly ArcaneSectionSchoolOption[];
	castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
	focusCostOptions: readonly ArcaneSectionFocusCostOption[];
	componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
	attackOptions = allAttackOptions;

	influenceRange: ArcaneSectionInfluenceRange;

	constructor({
		schoolOptions,
		castingTimeOptions,
		focusCostOptions,
		componentOptions,
		influenceRange,
	}: {
		schoolOptions: readonly ArcaneSectionSchoolOption[];
		castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
		focusCostOptions: readonly ArcaneSectionFocusCostOption[];
		componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentOption[]>>;
		influenceRange: ArcaneSectionInfluenceRange;
	}) {
		this.schoolOptions = schoolOptions;
		this.castingTimeOptions = castingTimeOptions;
		this.focusCostOptions = focusCostOptions;
		this.componentOptions = componentOptions;
		this.influenceRange = influenceRange;
	}

	static create({
		sheet,
		inputValues,
	}: {
		sheet: CharacterSheet;
		inputValues: ArcaneSectionInputValues;
	}): ArcaneSection {
		return new ArcaneSection({
			schoolOptions: ArcaneSection.allSchoolOptions,
			castingTimeOptions: ArcaneSection.allCastingTimeOptions,
			focusCostOptions: ArcaneSection.allFocusCostOptions,
			componentOptions: ArcaneSection.componentsForFlavor({ sheet }),
			influenceRange: ArcaneSection.computeInfluenceRange({ sheet, inputValues }),
		});
	}
}
