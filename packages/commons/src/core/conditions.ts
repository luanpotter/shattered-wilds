export enum Condition {
	Blessed = 'Blessed',
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
	[Condition.Blessed]: new ConditionDefinition({
		name: Condition.Blessed,
		description: `The character feels blessed and inspired, to an extent that can actually affects their actions, for a given amount of turns (the **Blessed** _rank_). While **Blessed**, a character can use their [[Luck Die]] for free. At the end of their turn, decrease the **Blessed** _rank_ by 1.

A character cannot become **Frightened** if they are **Blessed**.
`,
	}),
	[Condition.Blinded]: new ConditionDefinition({
		name: Condition.Blinded,
		description: `The character's ability to see is temporarily hampered. They are still vaguely aware of their surroundings if they have other senses (such as hearing and smell), specially their immediate surroundings; however, they might not be able to notice or react to specific, heavily sight-reliant events without an [[Awareness]] or [[Perception]] check (to the DM's discretion). Other than that, they can still attempt to perform any [[Action]], but have a \`-6\` [[Circumstance Modifier | CM]] to all [[Action | Actions]] or Checks that require sight (including _Attack Actions_, and the aforementioned [[Awareness]] / [[Perception]] checks), and a \`-3\` [[Circumstance Modifier | CM]] to all [[Body]] Defense Checks.`,
	}),
	[Condition.Distracted]: new ConditionDefinition({
		name: Condition.Distracted,
		description: `The character is in mental turmoil and unable to use [[Concentration]] actions.

This can be caused by the [[Feint]] action and cleared using the [[Focus]] action.`,
	}),
	[Condition.Distraught]: new ConditionDefinition({
		name: Condition.Distraught,
		description: `The character is in emotional and spiritual turmoil and unable to use [[Channel]] actions.

This can be inflicted by the [[Demoralize]] action, and cleared using the [[Calm]] action.

It can also be inflicted by the a [[Transfiguration]] **Arcane Spell** such as [[Hideous Visage]].`,
	}),
	[Condition.Frightened]: new ConditionDefinition({
		name: Condition.Frightened,
		description: `The character is terrified by a specific source for a given amount of turns (the **Frightened** _rank_). While **Frightened**, a character:

- Suffers a \`-2\` [[Circumstance Modifier | CM]] to any Active [[Check | Checks]].
- Cannot willingly move closer to the source of their fear (i.e. distance between the Hexes cannot decrease due to movement).

The condition is considered **Active** if the character can see the source of fear _or_ if they have reason to believe that the source of fear can see them.

The character can attempt to dispel the fear by using 1 [[Action_Point | AP]] and 1 [[Focus_Point | FP]] to roll a (Passive) Contested [[Discipline]] Check against the original DC + the current **Frightened** _rank_. If the Fear is not active, they get a \`+3\` [[Circumstance Modifier | CM]] to the Check.

If the Fear is not active, at the end of the turn, decrease the **Frightened** _rank_ by 1.

A character cannot become **Blessed** if they are **Frightened**.
`,
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
		description: `The character is severely incapacitated when their [[Vitality_Point | VP]], [[Focus_Point | FP]] or [[Spirit_Point | SP]] reaches \`0\`.

When Incapacitated, a character is:

- [[Prone]], [[Immobilized]], and [[Unconscious]].
- Unable to take [[Action | Actions]] (except [[Heroic_Relentlessness | Heroic Relentlessness]]).
- Helpless and vulnerable to further harm.

When a character recovers from Incapacitated (by any means), they gain one _rank_ of [[Exhaustion]]. This represents the physical and mental toll of being pushed to the brink of consciousness.

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
