# Encounters

{% include "docs/lexicon/Encounter.md" %}

# Actions

## Movement Actions

Movement actions are associated with movement, and can take several forms. All movement forms can move at least 1 hex, regardless of the character's Speed. Unused movement cannot be saved for later.

* {% item "Action/Stride", "type" %}
* {% item "Action/Side_Step", "type" %}
* {% item "Action/Get_Up", "type" %}
* {% item "Action/Run", "type" %}
* {% item "Action/Climb", "type" %}
* {% item "Action/Swim", "type" %}
* {% item "Action/Escape", "type" %}
* {% item "Action/Drag_Grappler", "type" %}
* {% item "Action/Stumble_Through", "type" %}
* {% item "Action/Ride_Mount", "type" %}
* {% item "Action/Hide", "type" %}
* {% item "Action/Sneak", "type" %}
* {% item "Action/Charge", "type" %}

## Attack Actions

Attack Actions are actions in which the intent is to inflict damage (either to VP, FP or SP) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack). Attack Actions can be either Basic or Special. Basic Attack actions are always an Attribute Check (STR or DEX for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Body as Defense. Special Attacks are contested against specific Skills, depending on the nature of the attack. Unless otherwise specified, an Attack typically causes one damage when it succeeds, and Shifts cause extra damage points.

* {% item "Action/Stun", "type" %}
* {% item "Action/Feint", "type" %}
* {% item "Action/Strike", "type" %}
* {% item "Action/Focused_Strike", "type" %}
* {% item "Action/Trip", "type" %}
* {% item "Action/Shove", "type" %}
* {% item "Action/Disarm", "type" %}
* {% item "Action/Grapple", "type" %}

### Types of Attacks

* Melee
* Ranged [Concentrate]
* Thrown
* Spell [Concentrate]

#### Basic Cover

When there is not a clear line of sight for a ranged attack, there are enemies or allies in the way, or the target is adjacent to a wall, you automatically benefit from Basic Cover against ranged attacks.

Basic Cover can be:
* 

## Miscellaneous Actions

* {% item "Action/Sheathe_Unsheathe", "type" %}
* {% item "Action/Reload", "type" %}
* {% item "Action/Catch_Breath", "type" %}
* {% item "Action/Focus", "type" %}
* {% item "Action/Inspire", "type" %}
* {% item "Action/Heroic_Relentlessness", "type" %}

## Meta Actions

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

* {% item "Action/Decrease_Initiative", "type" %}
* {% item "Action/Prepare_Action", "type" %}

# Reactions

* {% item "Action/Opportunity_Attack", "type" %}
* {% item "Action/Dodge", "type" %}
* {% item "Action/Take_Cover", "type" %}
* {% item "Action/Shield_Block", "type" %}
* {% item "Action/Shrug_Off", "type" %}
* {% item "Action/Flank", "type" %}
* {% item "Action/Taunt", "type" %}
* {% item "Action/Distract", "type" %}

# Conditions

* **Incapacitated**: You become Incapacitated when your VP, FP or SP = 0. You are Prone and unconscious, and cannot take actions (except the Heroic Relentlessness). By whichever means you regain enough resources to leave this condition, you will gain one level of Exhaustion.
* **Off-Guard**: Until the end of your next turn, you have a -3 Circumstance penalty to Body Defense checks.
* **Distracted**: Until the end of your next turn, you cannot concentrate.
* **Distraught**: Until the end of your next turn, you cannot channel.
* **Immobilized**: Grappled by an opponent; cannot take Move Actions (except Escape or Drag Grappler). Can still take Attack Actions with -3 Circumstance Modifier. Can still take Misc Actions to the DM discretion.
* **Blinded**: -- TODO
* **Prone**: -- TODO

# Consequences

Consequences are longer-term harms and injuries incurred to creatures that do not get cleared on a simple Short Rest. Consequences involve a specific penalty and specific ways to treat it (normally this can take a longer amount of time). There is not a set number of Consequences one can have, though as they start to severely debilitated, you might incur the ultimate Consequence: Death.

## Poisoned (X)

## Death

Death is the ultimate consequence. In Shattered Wilds, there is no revival - once your Soul is severed from your Body, they can never go back. That means stakes are always high and some decisions are final (not only regarding the players, but more importantly, NPCs and enemies). However, Death doesn't come from just reaching zero resources - and in fact doesn't comme (necessarily) from the accumulation of Consequences. However, a totally incapacitated creature (thus helpless) can be executed with a Coup de Grace, which will still require a contested check (failing will cause severe injuries instead). This is a longer action that cannot be taken during a combat, but it is typically considered that after the danger has passed the winners will execute the losers, unless otherwise specified by the victors.

## Exhaustion

Exhaustion represents a slightly longer term form of tiredness that cannot be healing by a simple Short Rest. Exhaustion comes in levels, each character starting at 0 Levels of Exhaustion. Several different circumstances can cause the Exhaustion. While initial Levels of Exhaustion just accumulate without causing negative consequences, further levels will require Checks to prevent issues. Exhaustion is cleared on a Long Rest.

Circumstances that cause the level of Exhaustion to increase include:

* Being cleared from Incapacitated.
* Short Rest (?) - not sure yet
* TODO

Exhaustion Levels and their effects:

* Levels 0-3: No effects.
* Level 4: -1 to all checks.
* Level 5: -2 to all checks.
* Level 6: -4 to all checks.
* Level 7: -8 to all checks.
* Level 8: -16 to all checks.
* Level 9: -32 to all checks.
* Level 10+: Death.

## Other Consequences

TODO: Bleeding, Injuries, Broken Bones, Concussions, Mental or Spiritual Injuries, etc.