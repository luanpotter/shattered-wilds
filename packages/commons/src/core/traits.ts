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

	// Equipment Traits
	Concealable = 'Concealable',
	Reloadable = 'Reloadable',
	TwoHanded = 'Two-Handed',
	Polearm = 'Polearm',
}

export class TraitDefinition {
	key: Trait;
	name: string;
	description: string;
	targets: TraitTarget[];

	constructor({
		key,
		name,
		description,
		targets,
	}: {
		key: Trait;
		name: string;
		description: string;
		targets: TraitTarget[];
	}) {
		this.key = key;
		this.name = name;
		this.description = description;
		this.targets = targets;
	}
}

export const TRAITS: Record<Trait, TraitDefinition> = {
	// Action Traits
	[Trait.Reaction]: new TraitDefinition({
		targets: [TraitTarget.Action],
		key: Trait.Reaction,
		name: 'Reaction',
		description: `These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.`,
	}),
	[Trait.Melee]: new TraitDefinition({
		targets: [TraitTarget.Action],
		key: Trait.Melee,
		name: 'Melee',
		description: `Attack Actions that can only be used through a Melee attack.`,
	}),
	[Trait.Ranged]: new TraitDefinition({
		targets: [TraitTarget.Action],
		key: Trait.Ranged,
		name: 'Ranged',
		description: `Attack Actions that can only be used through a Ranged attack.`,
	}),
	[Trait.Concentrate]: new TraitDefinition({
		targets: [TraitTarget.Action],
		key: Trait.Concentrate,
		name: 'Concentrate',
		description: `Cannot be performed while [[Distracted]]. Performing this action while in the threat area of an enemy grants them the chance to respond with an [[Opportunity_Attack | Opportunity Attack]] (which could be the [[Feint]] action). You cannot perform any other [[Concentrate]] actions while concentrating.`,
	}),
	[Trait.Channel]: new TraitDefinition({
		targets: [TraitTarget.Action],
		key: Trait.Channel,
		name: 'Channel',
		description: `Cannot be performed while [[Distraught]].`,
	}),

	// Weapon Traits
	[Trait.Concealable]: new TraitDefinition({
		targets: [TraitTarget.Equipment],
		key: Trait.Concealable,
		name: 'Concealable',
		description: `You can conceal this piece of equipment in your body without arousing suspicion.`,
	}),
	[Trait.Reloadable]: new TraitDefinition({
		targets: [TraitTarget.Equipment],
		key: Trait.Reloadable,
		name: 'Reloadable',
		description: `You must use a [[Reload]] action to reload this equipment after each use.`,
	}),
	[Trait.TwoHanded]: new TraitDefinition({
		targets: [TraitTarget.Equipment],
		key: Trait.TwoHanded,
		name: 'Two-Handed',
		description: `This equipment must be wielded with both hands.`,
	}),
	[Trait.Polearm]: new TraitDefinition({
		targets: [TraitTarget.Equipment],
		key: Trait.Polearm,
		name: 'Polearm',
		description: 'The **Melee Reach** of this equipment is increased by `1` hex.',
	}),
};
