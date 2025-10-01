import { StatType } from '../stats/stat-type.js';

export enum TraitTarget {
	Action = 'Action',
	Equipment = 'Equipment',
}

export enum Trait {
	// Action Traits
	Reaction = 'Reaction',
	Melee = 'Melee',
	Ranged = 'Ranged',
	Concentrate = 'Concentrate',
	Channel = 'Channel',
	BodyAttack = 'Body Attack',
	MindAttack = 'Mind Attack',
	SoulAttack = 'Soul Attack',
	SpecialAttack = 'Special Attack',
	BodyDefense = 'Body Defense',
	MindDefense = 'Mind Defense',
	SoulDefense = 'Soul Defense',

	// Equipment Traits
	Concealable = 'Concealable',
	Reloadable = 'Reloadable',
	TwoHanded = 'Two-Handed',
	Polearm = 'Polearm',
}

export const DEFENSE_TRAITS = {
	[Trait.BodyDefense]: StatType.Body,
	[Trait.MindDefense]: StatType.Mind,
	[Trait.SoulDefense]: StatType.Soul,
} as const;

export type DefenseTrait = keyof typeof DEFENSE_TRAITS;

export class TraitDefinition {
	key: Trait;
	name: string;
	description: string;
	target: TraitTarget;

	constructor({
		key,
		name,
		description,
		target,
	}: {
		key: Trait;
		name: string;
		description: string;
		target: TraitTarget;
	}) {
		this.key = key;
		this.name = name;
		this.description = description;
		this.target = target;
	}
}

export const TRAITS: Record<Trait, TraitDefinition> = {
	// Action Traits
	[Trait.Reaction]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.Reaction,
		name: 'Reaction',
		description: `These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.`,
	}),
	[Trait.Melee]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.Melee,
		name: 'Melee',
		description: `Attack Actions that can only be used through a Melee attack.`,
	}),
	[Trait.Ranged]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.Ranged,
		name: 'Ranged',
		description: `Attack Actions that can only be used through a Ranged attack.`,
	}),
	[Trait.Concentrate]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.Concentrate,
		name: 'Concentrate',
		description: `Cannot be performed while [[Distracted]]. Performing this action while in the threat area of an enemy grants them the chance to respond with an [[Opportunity_Attack | Opportunity Attack]] (which could be the [[Feint]] action). You cannot perform any other [[Concentrate]] actions while concentrating.`,
	}),
	[Trait.Channel]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.Channel,
		name: 'Channel',
		description: `Cannot be performed while [[Distraught]].`,
	}),
	[Trait.BodyAttack]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.BodyAttack,
		name: 'Body Attack',
		description: `This action is considered a **Body Attack**; it can be performed with an appropriate weapon using either [[STR]] or [[DEX]].\n\nTypically **Body Attacks** are resisted with a **Body Defense** Check.`,
	}),
	[Trait.MindAttack]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.MindAttack,
		name: 'Mind Attack',
		description: `This action is considered a **Mind Attack**; it can be performed with the Caster's primary [[Mind]] attribute ([[INT]], [[WIS]], or [[CHA]]).`,
	}),
	[Trait.SoulAttack]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.SoulAttack,
		name: 'Soul Attack',
		description: `This action is considered a **Soul Attack**.`,
	}),
	[Trait.SpecialAttack]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.SpecialAttack,
		name: 'Special Attack',
		description: `This action is considered a **Special Attack**, meaning it is a contested Skill Check (the action will specify which Skills are involved).`,
	}),
	[Trait.BodyDefense]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.BodyDefense,
		name: 'Body Defense',
		description: `This action can be used as a **Body Defense**.`,
	}),
	[Trait.MindDefense]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.MindDefense,
		name: 'Mind Defense',
		description: `This action can be used as a **Mind Defense**.`,
	}),
	[Trait.SoulDefense]: new TraitDefinition({
		target: TraitTarget.Action,
		key: Trait.SoulDefense,
		name: 'Soul Defense',
		description: `This action can be used as a **Soul Defense**.`,
	}),

	// Weapon Traits
	[Trait.Concealable]: new TraitDefinition({
		target: TraitTarget.Equipment,
		key: Trait.Concealable,
		name: 'Concealable',
		description: `You can conceal this piece of equipment in your body without arousing suspicion.`,
	}),
	[Trait.Reloadable]: new TraitDefinition({
		target: TraitTarget.Equipment,
		key: Trait.Reloadable,
		name: 'Reloadable',
		description: `You must use a [[Reload]] action to reload this equipment after each use.`,
	}),
	[Trait.TwoHanded]: new TraitDefinition({
		target: TraitTarget.Equipment,
		key: Trait.TwoHanded,
		name: 'Two-Handed',
		description: `This equipment must be wielded with both hands.`,
	}),
	[Trait.Polearm]: new TraitDefinition({
		target: TraitTarget.Equipment,
		key: Trait.Polearm,
		name: 'Polearm',
		description: 'The **Melee Reach** of this equipment is `2` Hexes.',
	}),
};
