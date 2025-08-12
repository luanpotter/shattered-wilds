export enum Condition {
	Blinded = 'Blinded',
	Distracted = 'Distracted',
	Distraught = 'Distraught',
	Frightened = 'Frightened',
	Immobilized = 'Immobilized',
	Incapacitated = 'Incapacitated',
	OffGuard = 'Off Guard',
	Prone = 'Prone',
	Silenced = 'Silenced',
	Unconscious = 'Unconscious',
}

export class ConditionDefinition {
	name: Condition;
	description: string;

	constructor({ name, description }: { name: Condition; description: string }) {
		this.name = name;
		this.description = description;
	}
}

export const CONDITIONS: Record<Condition, ConditionDefinition> = {
	[Condition.Blinded]: new ConditionDefinition({
		name: Condition.Blinded,
		description: `The character is unable to see. Add a \`-6\` [[Circumstance Modifier | CM]] to all [[Action | Actions]] that require sight (including _Attack Actions_), and a \`-3\` [[Circumstance Modifier | CM]] to [[Body]] Defense Checks.`,
	}),
	[Condition.Distracted]: new ConditionDefinition({
		name: Condition.Distracted,
		description: `The character is in mental turmoil and unable to use [[Concentration]] actions.

This can be caused by the [[Feint]] action and cleared using the [[Focus]] action.`,
	}),
	[Condition.Distraught]: new ConditionDefinition({
		name: Condition.Distraught,
		description: `The character is in emotional and spiritual turmoil and unable to use [[Channel]] actions.

This can be inflicted by the [[Demoralize]] action, and cleared using the [[Calm]] action.`,
	}),
	[Condition.Frightened]: new ConditionDefinition({
		name: Condition.Frightened,
		description: `TODO: Add Frightened condition`,
	}),
	[Condition.Immobilized]: new ConditionDefinition({
		name: Condition.Immobilized,
		description: `The creature is physically restrained, typically through [[Grapple | grappling]], and thus has limited freedom of movement.

While **Immobilized**, a character:

- Cannot take Movement [[Action | Actions]] (except [[Escape]], or [[Drag Grappler]] if they are grappled).
- Can still take **Attack** [[Action | Actions]] with a \`-3\` [[Circumstance Modifier | CM]].
- Cannot perform **Somatic Spell Components** as they require a greater baseline freedom of movement.
- **Do not** take any penalties to **Body Defense Checks**, but **cannot** take the [[Dodge]] or [[Take Cover]] reactions.`,
	}),
	[Condition.Incapacitated]: new ConditionDefinition({
		name: Condition.Incapacitated,
		description: `The character is severely incapacitated when their [[Vitality_Point | VP]], [[Focus_Point | FP]] or [[Spirit_Point | SP]] reaches 0.

When Incapacitated, a character is:

- [[Prone]], [[Immobilized]], and [[Unconscious]].
- Unable to take [[Action | Actions]] (except [[Heroic_Relentlessness | Heroic Relentlessness]]).
- Helpless and vulnerable to further harm.

When a character recovers from Incapacitated (by any means), they gain one level of [[Exhaustion]]. This represents the physical and mental toll of being pushed to the brink of consciousness.

Incapacitated characters are vulnerable to taking further Consequences.`,
	}),
	[Condition.OffGuard]: new ConditionDefinition({
		name: Condition.OffGuard,
		description: `The character has reduced defensive awareness and readiness. While **Off-Guard**, a character suffers a -3 [[Circumstance Modifier | CM]] to [[Body]] Defense checks.

Off-Guard can be caused by the [[Stun]] action and cleared by the [[Catch_Breath | Catch Breath]] action.`,
	}),
	[Condition.Prone]: new ConditionDefinition({
		name: Condition.Prone,
		description: `The character is knocked to the ground or lying down.

While Prone, a character cannot take Movement [[Action | Actions]] (except [[Get_Up | Get Up]] and [[Escape]]).`,
	}),
	[Condition.Silenced]: new ConditionDefinition({
		name: Condition.Silenced,
		description: `The character is unable to speak, utter sounds, or execute **Verbal Spell Components**.

While Silenced, a character:

- Cannot execute **Verbal Spell Components**
- Cannot speak or communicate verbally
- Cannot perform any [[Action | Actions]] that require speech
`,
	}),
	[Condition.Unconscious]: new ConditionDefinition({
		name: Condition.Unconscious,
		description: `The character is not awake, and cannot take any [[Action | Actions]]. Depending on the cause of the unconsciousness, the character can be waken up by different means, and might have fallen [[Prone]].`,
	}),
};
