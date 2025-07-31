export enum Trait {
	Reaction = 'Reaction',
	Melee = 'Melee',
	Ranged = 'Ranged',
	Concentrate = 'Concentrate',
	Channel = 'Channel',
}

export class TraitDefinition {
	key: Trait;
	name: string;
	description: string;

	constructor({ key, name, description }: { key: Trait; name: string; description: string }) {
		this.key = key;
		this.name = name;
		this.description = description;
	}
}

export const TRAITS: Record<Trait, TraitDefinition> = {
	[Trait.Reaction]: new TraitDefinition({
		key: Trait.Reaction,
		name: 'Reaction',
		description: `These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.`,
	}),
	[Trait.Melee]: new TraitDefinition({
		key: Trait.Melee,
		name: 'Melee',
		description: `Attack Actions that can only be used through a Melee attack.`,
	}),
	[Trait.Ranged]: new TraitDefinition({
		key: Trait.Ranged,
		name: 'Ranged',
		description: `Attack Actions that can only be used through a Ranged attack.`,
	}),
	[Trait.Concentrate]: new TraitDefinition({
		key: Trait.Concentrate,
		name: 'Concentrate',
		description: `This be performed while [[Distracted]]. Performing this action while in the threat area of an enemy grants them the chance to respond with an [[Opportunity_Attack | Opportunity Attack]] or [[Distract | Distract]] actions.`,
	}),
	[Trait.Channel]: new TraitDefinition({
		key: Trait.Channel,
		name: 'Channel',
		description: `Cannot be performed while [[Distraught]].`,
	}),
};
