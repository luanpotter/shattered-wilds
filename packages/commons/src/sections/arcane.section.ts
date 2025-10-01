import { CharacterSheet } from '../character/character-sheet.js';
import {
	ARCANE_SPELL_COMPONENTS,
	ArcaneSpellComponentDefinition,
	ArcaneSpellComponentType,
	ArcaneSpellSchool,
} from '../core/arcane.js';
import { ClassFlavor } from '../core/classes.js';
import { Bonus } from '../stats/value.js';

export type ArcaneSectionSchoolOption = 'All Schools' | ArcaneSpellSchool;
export type ArcaneSectionCastingTimeOption = { name: string; value: number; modifier: Bonus; maxFocusCost?: number };
export type ArcaneSectionFocusCostOption = { name: string; value: number; modifier: Bonus };

const allAttackOptions = ['All Spells', 'Only Attacks', 'Only Utility'] as const;
export type ArcaneSectionAttackOption = (typeof allAttackOptions)[number];

export class ArcaneSection {
	static allSchoolOptions = [
		'All Schools' as const,
		...(Object.values(ArcaneSpellSchool) as ArcaneSpellSchool[]),
	] as readonly ArcaneSectionSchoolOption[];

	static allCastingTimeOptions = [
		{ name: '1 AP', value: 1, modifier: Bonus.of(-12), maxFocusCost: 1 },
		{ name: '2 AP', value: 2, modifier: Bonus.zero(), maxFocusCost: 2 },
		{ name: '3 AP', value: 3, modifier: Bonus.of(2), maxFocusCost: 3 },
		{ name: '4 AP', value: 4, modifier: Bonus.of(4), maxFocusCost: 4 },
		{ name: 'Ritual', value: 0, modifier: Bonus.of(6) },
	];

	static allFocusCostOptions = [
		{ name: '1 FP', value: 1, modifier: Bonus.zero() },
		{ name: '2 FP', value: 2, modifier: Bonus.of(1) },
		{ name: '3 FP', value: 3, modifier: Bonus.of(2) },
		{ name: '4 FP', value: 4, modifier: Bonus.of(3) },
	];

	static componentsForFlavor = (flavor: ClassFlavor) => {
		return Object.groupBy(
			ARCANE_SPELL_COMPONENTS.filter(component => component.flavors.includes(flavor)),
			component => component.type,
		);
	};

	schoolOptions: readonly ArcaneSectionSchoolOption[];
	castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
	focusCostOptions: readonly ArcaneSectionFocusCostOption[];
	componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentDefinition[]>>;
	attackOptions = allAttackOptions;

	constructor({
		schoolOptions,
		castingTimeOptions,
		focusCostOptions,
		componentOptions,
	}: {
		schoolOptions: readonly ArcaneSectionSchoolOption[];
		castingTimeOptions: readonly ArcaneSectionCastingTimeOption[];
		focusCostOptions: readonly ArcaneSectionFocusCostOption[];
		componentOptions: Partial<Record<ArcaneSpellComponentType, readonly ArcaneSpellComponentDefinition[]>>;
	}) {
		this.schoolOptions = schoolOptions;
		this.castingTimeOptions = castingTimeOptions;
		this.focusCostOptions = focusCostOptions;
		this.componentOptions = componentOptions;
	}

	static create({ sheet }: { sheet: CharacterSheet }): ArcaneSection {
		return new ArcaneSection({
			schoolOptions: ArcaneSection.allSchoolOptions,
			castingTimeOptions: ArcaneSection.allCastingTimeOptions,
			focusCostOptions: ArcaneSection.allFocusCostOptions,
			componentOptions: ArcaneSection.componentsForFlavor(sheet.characterClass.definition.flavor),
		});
	}
}
