import { ClassFlavor } from '../core/classes.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';

export enum ArcaneSpellAugmentationType {
	Material = 'Material',
	Intensity = 'Intensity',
	Area = 'Area',
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
	variable: boolean;

	constructor({
		type,
		value,
		bonus,
		variable = false,
	}: {
		type: ArcaneSpellAugmentationType;
		value: string;
		bonus: Bonus;
		variable?: boolean;
	}) {
		this.type = type;
		this.value = value;
		this.bonus = bonus;
		this.variable = variable;
	}

	get key(): string {
		return `${this.type}-${this.value}`;
	}

	get shortDescription(): string {
		if (this.variable) {
			return `${this.bonus.description} per ${this.value}`;
		}
		return `${this.value}`;
	}

	computeBonus(multiplier: number | undefined): number {
		if (this.variable) {
			if (multiplier === undefined) {
				throw new Error('Multiplier is required for variable augmentations');
			}
			return this.bonus.value * multiplier;
		}
		if (multiplier !== undefined && multiplier !== 1) {
			throw new Error('Multiplier is not allowed for non-variable augmentations');
		}
		return this.bonus.value;
	}

	getTooltip(multiplier: number | undefined): string {
		if (this.variable) {
			return `${this.bonus.description} per ${this.value} (${multiplier} x ${this.bonus.description} = ${this.computeBonus(multiplier)})`;
		}
		return `${this.bonus.description}`;
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

export enum PredefinedArcaneSpell {
	ConjureWater = 'Conjure Water',
	RockSmash = 'Rock Smash',
	ConjureDebris = 'Conjure Debris',
	PoisonCloud = 'Poison Cloud',
	EvokeLight = 'Evoke Light',
	BlindingLight = 'Blinding Light',
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
				bonus: Bonus.of(-1),
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
				value: 'Medium',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.ConjureDebris]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.ConjureDebris,
		school: ArcaneSpellSchool.Conjuration,
		description:
			'Conjures loose weak rocks, pebbles and/or gravel over an area, causing it to count as **Difficult Terrain**. Each Hex of debris can be cleared gradually with 4 [[Action_Point | AP]] worth of actions.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Area,
				value: 'Hex',
				bonus: Bonus.of(-2),
				variable: true,
			}),
		],
	}),
	[PredefinedArcaneSpell.PoisonCloud]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.PoisonCloud,
		school: ArcaneSpellSchool.Conjuration,
		description:
			'Conjures a cloud of **Noxious Gas** over an area. The area _can_ be occupied by other creatures or objects, as the gas will be created around them. As the gas disperses, it lose its potency after 3 rounds. Creating more gas on the same space will just dislodge the excess poison around.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Area,
				value: 'Hex',
				bonus: Bonus.of(-3),
				variable: true,
			}),
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Material,
				value: 'Noxious Gas',
				bonus: Bonus.of(-6),
			}),
		],
	}),
	[PredefinedArcaneSpell.EvokeLight]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.EvokeLight,
		school: ArcaneSpellSchool.Evocation,
		description:
			'Evokes a harmless fist-sized ball of light, which will float in the air illuminating a 12m radius around it, lasting for at least 1 hour (as it fades). The Light is ethereal, and cannot be manipulated by physical means, though passing your hand through it will result in a slightly warm sensation. The Light can be moved and control with **Telekinesis**.',
	}),
	[PredefinedArcaneSpell.BlindingLight]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.BlindingLight,
		school: ArcaneSpellSchool.Evocation,
		description:
			'Evokes a momentary flash of bright light at a point, potentially affecting any seeing creatures within a 6m radius. The Caster and any creatures that were made aware of what was about to happen can avert their gaze; other creatures must succeed an [[Agility]] Check against the Spell DC to do so. Creatures who were unable to avert their gaze take the [[Blinded]] condition until the end of their next turn.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Intensity,
				value: 'Harmful',
				bonus: Bonus.of(-3),
			}),
		],
	}),
};
