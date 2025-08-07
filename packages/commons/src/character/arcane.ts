import { ClassFlavor } from '../core/classes.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';

export enum PredefinedArcaneSpell {
	ConjureWater = 'Conjure Water',
	RockSmash = 'Rock Smash',
}

export enum ArcaneSpellAugmentationType {
	Material = 'Material',
	Volume = 'Volume',
}

export enum ArcaneSpellSchool {
	Conjuration = 'Conjuration',
	Evocation = 'Evocation',
	Transmutation = 'Transmutation',
	Transfiguration = 'Transfiguration',
	Command = 'Command',
	Telekinesis = 'Telekinesis',
}

export enum ArcaneSpellComponentType {
	Somatic = 'Somatic',
	Verbal = 'Verbal',
	Focal = 'Focal',
}

export class ArcaneSpellComponentDefinition {
	type: ArcaneSpellComponentType;
	name: string;
	flavors: ClassFlavor[];
	bonus: Bonus;

	constructor({
		type,
		name,
		flavors,
		bonus,
	}: {
		type: ArcaneSpellComponentType;
		name: string;
		flavors: ClassFlavor[];
		bonus: Bonus;
	}) {
		this.type = type;
		this.name = name;
		this.flavors = flavors;
		this.bonus = bonus;
	}

	toComponentModifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Component,
			name: this.name,
			value: this.bonus,
		});
	}
}

const allCasters = [ClassFlavor.Arcanist, ClassFlavor.Mechanist, ClassFlavor.Musicist, ClassFlavor.Naturalist];

export const ARCANE_SPELL_COMPONENTS: ArcaneSpellComponentDefinition[] = [
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Somatic,
		name: 'No Somatic Component',
		flavors: allCasters,
		bonus: Bonus.of(0),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Somatic,
		name: 'Basic Gesturing',
		flavors: [ClassFlavor.Arcanist, ClassFlavor.Mechanist],
		bonus: Bonus.of(1),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Somatic,
		name: 'Typical One-Handed Tool Use',
		flavors: [ClassFlavor.Mechanist],
		bonus: Bonus.of(2),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Somatic,
		name: 'Typical Two-Handed Tool Use',
		flavors: [ClassFlavor.Mechanist],
		bonus: Bonus.of(3),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Verbal,
		name: 'No Verbal Component',
		flavors: allCasters,
		bonus: Bonus.of(0),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Verbal,
		name: 'Basic Chanting',
		flavors: [ClassFlavor.Arcanist, ClassFlavor.Musicist],
		bonus: Bonus.of(1),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Verbal,
		name: 'Typical One-Handed Instrument',
		flavors: [ClassFlavor.Musicist],
		bonus: Bonus.of(2),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Verbal,
		name: 'Typical Two-Handed Instrument',
		flavors: [ClassFlavor.Musicist],
		bonus: Bonus.of(3),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Focal,
		name: 'No Focal Component',
		flavors: allCasters,
		bonus: Bonus.of(0),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Focal,
		name: 'Typical One-Handed Wand',
		flavors: [ClassFlavor.Arcanist, ClassFlavor.Naturalist],
		bonus: Bonus.of(1),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Focal,
		name: 'Typical Two-Handed Staff',
		flavors: [ClassFlavor.Arcanist, ClassFlavor.Naturalist],
		bonus: Bonus.of(2),
	}),
	new ArcaneSpellComponentDefinition({
		type: ArcaneSpellComponentType.Focal,
		name: 'Custom Focus',
		flavors: [ClassFlavor.Naturalist],
		bonus: Bonus.of(4),
	}),
];

export class ArcaneSpellAugmentation {
	type: ArcaneSpellAugmentationType;
	value: string;
	bonus: Bonus;

	constructor({ type, value, bonus }: { type: ArcaneSpellAugmentationType; value: string; bonus: Bonus }) {
		this.type = type;
		this.value = value;
		this.bonus = bonus;
	}

	get description() {
		return `${this.type}: ${this.value} (${this.bonus.description})`;
	}
}

export class ArcaneSpellDefinition {
	name: string;
	school: ArcaneSpellSchool;
	description: string;
	augmentations: ArcaneSpellAugmentation[];

	constructor({
		name,
		school,
		description,
		augmentations = [],
	}: {
		name: string;
		school: ArcaneSpellSchool;
		description: string;
		augmentations?: ArcaneSpellAugmentation[];
	}) {
		this.name = name;
		this.school = school;
		this.description = description;
		this.augmentations = augmentations;
	}
}

export const PREDEFINED_ARCANE_SPELLS: Record<PredefinedArcaneSpell, ArcaneSpellDefinition> = {
	[PredefinedArcaneSpell.ConjureWater]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.ConjureWater,
		school: ArcaneSpellSchool.Conjuration,
		description: 'Conjures 1L of pure water in an unoccupied space.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Material,
				value: 'Water',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.RockSmash]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.RockSmash,
		school: ArcaneSpellSchool.Conjuration,
		description:
			'Conjures a medium-sized boulder of weak rock above the target, which can resist with [[Evasiveness]] to avoid being hit by the falling debris, that would otherwise causes 1 [[Vitality_Point | VP]] of damage.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Volume,
				value: 'Medium-sized',
				bonus: Bonus.of(-3),
			}),
		],
	}),
};
