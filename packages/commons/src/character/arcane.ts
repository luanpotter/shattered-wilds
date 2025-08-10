import { ClassFlavor } from '../core/classes.js';
import { Trait } from '../core/traits.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';

export enum ArcaneSpellAugmentationType {
	Material = 'Material',
	Intensity = 'Intensity',
	Area = 'Area',
	Volume = 'Volume',
	Duration = 'Duration',
	Specificity = 'Specificity',
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

	get description(): string {
		return `${this.type}: ${this.shortDescription}${this.variable ? '' : ` (${this.bonus.description})`}`;
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
	traits: Trait[];

	constructor({
		name,
		school,
		description,
		augmentations = [],
		traits = [],
	}: {
		name: string;
		school: ArcaneSpellSchool;
		description: string;
		augmentations?: ArcaneSpellAugmentation[];
		traits?: Trait[];
	}) {
		this.name = name;
		this.school = school;
		this.description = description;
		this.augmentations = augmentations;
		this.traits = traits;
	}
}

export enum PredefinedArcaneSpell {
	ConjureWater = 'Conjure Water',
	RockSmash = 'Rock Smash',
	ConjureDebris = 'Conjure Debris',
	PoisonCloud = 'Poison Cloud',
	EvokeLight = 'Evoke Light',
	BlindingLight = 'Blinding Light',
	EvokeFlames = 'Evoke Flames',
	MudFeet = 'Mud Feet',
	MendObject = 'Mend Object',
	MageHand = 'Mage Hand',
	ControlFlames = 'Control Flames',
	MagicShove = 'Magic Shove',
	HardenFists = 'Harden Fists',
	HardenSkin = 'Harden Skin',
	DisguiseBeing = 'Disguise Being',
	HideousVisage = 'Hideous Visage',
	ConfuseMind = 'Confuse Mind',
	ErodeWill = 'Erode Will',
	MessageBeing = 'Message Being',
	CommandCreature = 'Command Creature',
	CommandBeing = 'Command Being',
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
			'Conjures a medium-sized boulder of weak rock above the target, which can be used as a **Body Attack** against **Body Defense** to avoid being hit by the falling debris and receiving 1 [[Vitality_Point | VP]] of damage.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Volume,
				value: 'Medium',
				bonus: Bonus.of(-3),
			}),
		],
		traits: [Trait.BodyAttack],
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
			'Evokes a harmless fist-sized ball of light, which will float in the air illuminating a **9 Hexes** radius around it, lasting for around **1 hour** (as it slowly fades). The Light is ethereal, and cannot be manipulated by physical means, though passing your hand through it will result in a slightly warm sensation. The Light can be moved and control with **Telekinesis**.',
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
		traits: [Trait.SpecialAttack],
	}),
	[PredefinedArcaneSpell.EvokeFlames]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.EvokeFlames,
		school: ArcaneSpellSchool.Evocation,
		description:
			'Evokes a small flame, which can be used to ignite flammable objects, lasting for around **1 turn**. While energy cannot be evoked within the same space as solid matter, it can be done so close enough as to cause it to ignite. This can also be done offensively as a **Special Attack** against [[Evasiveness]] to cause **VP** damage.',
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Intensity,
				value: 'Harmful',
				bonus: Bonus.of(-3),
			}),
		],
		traits: [Trait.SpecialAttack],
	}),
	[PredefinedArcaneSpell.MudFeet]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.MudFeet,
		school: ArcaneSpellSchool.Transmutation,
		description: `Transmutes a small patch of ground underneath a target's feet into slimy mud. The target must resists with [[Evasiveness]] or become [[Off_Guard | Off-Guard]]. A **Shift** will cause the target to become [[Prone]] instead.`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Material,
				value: 'Slimy Mud',
				bonus: Bonus.of(-1),
			}),
		],
		traits: [Trait.SpecialAttack],
	}),
	[PredefinedArcaneSpell.MendObject]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.MendObject,
		school: ArcaneSpellSchool.Transmutation,
		description: `Mends a small tear in a simple solid object made of a simple material (e.g. a piece cloth or garment, a parchment or book, etc).`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Duration,
				value: 'Permanent',
				bonus: Bonus.of(-12),
			}),
		],
	}),
	[PredefinedArcaneSpell.MageHand]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.MageHand,
		school: ArcaneSpellSchool.Telekinesis,
		description: `While but the most studious **Arcanists** know why this spell is commonly referred to as _"Mage Hand"_, all do know that this is in fact not any form of spectral hand at all, but rather a simple application of **Telekinesis** to manipulate small objects within the **Caster's** range. It can be used to open doors, move items up to \`2kg\`, or pet a dog. Anything more dextrous or arduous will warrant **Augmentations**.`,
	}),
	[PredefinedArcaneSpell.ControlFlames]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.ControlFlames,
		school: ArcaneSpellSchool.Telekinesis,
		description: `Telekinetically controls flames, potentially extinguishing very small fires, spreading to nearby materials, or propelling them. Must target an existing flame. If hurling towards a target, it can be used as a **Special Attack** against [[Evasiveness]] to cause **VP** damage.`,
		traits: [Trait.SpecialAttack],
	}),
	[PredefinedArcaneSpell.MagicShove]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.MagicShove,
		school: ArcaneSpellSchool.Telekinesis,
		description: `Telekinetically controls a gust of wind towards a target, shoving them back by 1 Hex. The target can resist with a [[Stance]] check. **Shifts** can be used to push the target further back, make them [[Prone]], or deal [[Vitality_Point | VP]] damage.`,
		traits: [Trait.SpecialAttack],
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Intensity,
				value: 'Harmful',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.HardenFists]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.HardenFists,
		school: ArcaneSpellSchool.Transfiguration,
		description: `Transfigures a target's fists to be harder than normal, giving them a \`+3\` bonus to their Unarmed **Body Attacks**. Can be resisted with a [[Toughness]] check.`,
	}),
	[PredefinedArcaneSpell.HardenSkin]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.HardenSkin,
		school: ArcaneSpellSchool.Transfiguration,
		description: `Transfigures a target's skin to be harder than normal, giving them a \`+6\` bonus to their [[Shrug_Off | Shrug Off]] Toughness Checks. Can be resisted with a [[Toughness]] check.`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Volume,
				value: 'Whole Body',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.DisguiseBeing]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.DisguiseBeing,
		school: ArcaneSpellSchool.Transfiguration,
		description: `Transfigures the facial appearance and body features of a Being, applying some physical deformations on an attempt to make them unrecognizable (making them look like someone else specifically would be much more difficult; also, they probably won't end up prettier than what they started as). The target can resist with a [[Toughness]] Check. Creatures unaware of the disguise will need to roll an [[Awareness]] Check (or [[Perception]] if they have reason to doubt) against the Spell Check to recognize a person they are familiar with (they can get circumstantial modifiers depending on how well they know the target).`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Volume,
				value: 'Whole Body',
				bonus: Bonus.of(-3),
			}),
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Specificity,
				value: 'Detailed',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.HideousVisage]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.HideousVisage,
		school: ArcaneSpellSchool.Transfiguration,
		description: `Transfigures a desired surface-level aspect of a target's appearance, making it hideous and slightly repulsive. The target can resist the transformation itself with a [[Toughness]] Check. If successful, the target then must resist again with a [[Tenacity]] check or take 1 [[Spirit_Point | SP]] and become [[Demoralized]] while transformed. Regardless of their self-perception, they will get a \`-6\` [[Circumstance_Modifier | CM]] to any [[Presence]] Checks.`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Specificity,
				value: 'Detailed',
				bonus: Bonus.of(-3),
			}),
		],
		traits: [Trait.SpecialAttack],
	}),
	[PredefinedArcaneSpell.ConfuseMind]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.ConfuseMind,
		school: ArcaneSpellSchool.Command,
		description: `Command random thoughts and distracting words into a target's mind, to be used as a **Mind Attack** against **Mind Defense**.`,
		traits: [Trait.MindAttack],
	}),
	[PredefinedArcaneSpell.ErodeWill]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.ErodeWill,
		school: ArcaneSpellSchool.Command,
		description: `Command self-deprecating thoughts into a target's mind, to be used as a **Mind Attack** against **Soul Defense**.`,
		traits: [Trait.MindAttack],
	}),
	[PredefinedArcaneSpell.MessageBeing]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.MessageBeing,
		school: ArcaneSpellSchool.Command,
		description: `Command a small (few words) message into a target's mind. The target can resist with a [[Resolve]] Check if desired. If they fail, they will hear the message as a command, but will not feel compelled to follow it. The DM will adjudicate the complexity of the message and apply the appropriate circumstantial modifiers (min: \`-3\` for a "single-word" message; words are just being used as a proxy for complexity; DM has the final say).`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Specificity,
				value: 'Message',
				bonus: Bonus.of(-3),
			}),
		],
	}),
	[PredefinedArcaneSpell.CommandCreature]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.CommandCreature,
		school: ArcaneSpellSchool.Command,
		description: `Nudge a non-sentient creature (plant, fungus, or animal) to do something within their nature. The target can resist with a [[Resolve]] Check. Non-sentient creatures cannot use language, do any information processing, or do actions not within their nature. The command will be infused as ideas in their mind, and not as words. As a rule of thumb, you can call out primal emotions such as hunger, anger, or fear.`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Intensity,
				value: 'Major',
				bonus: Bonus.of(-6),
			}),
		],
	}),
	[PredefinedArcaneSpell.CommandBeing]: new ArcaneSpellDefinition({
		name: PredefinedArcaneSpell.CommandBeing,
		school: ArcaneSpellSchool.Command,
		description: `Command a simple edict directly into a target's mind. The target can resist with a [[Resolve]] Check; if they fail, they will feel compelled to follow the command.\n\nThe target must interpret the command as they would if issued by a trustworthy source. If the command goes fundamentally against their basic nature, such as self-harming, or doing something that violates their faith, they will get a [[Circumstance Modifier | CM]] bonus in their [[Resolve]] Check, depending on how strongly they would be opposed to it. Also, depending on the vagueness of the command, the target will also get a bonus to their contested Check.\n\nThe **Caster** must therefore balance simplicity with specificity. For example if you just command a being to "Die", since there is no direct action to achieve this command, and it likely goes against their nature, they will get a significant bonus to their Contested Check.`,
		augmentations: [
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Intensity,
				value: 'Greater',
				bonus: Bonus.of(-12),
			}),
			new ArcaneSpellAugmentation({
				type: ArcaneSpellAugmentationType.Specificity,
				value: 'Command',
				bonus: Bonus.of(-3),
			}),
		],
	}),
};
