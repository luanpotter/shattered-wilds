# Encounters

{% include "docs/lexicon/Encounter.md" %}

## Actions

### Movement Actions

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

### Attack Actions

Attack Actions are actions in which the intent is to inflict damage (either to [[Resource_Vitality_Point | VP]], [[Resource_Focus_Point | FP]] or [[Resource_Spirit_Point | SP]]) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack). Attack Actions can be either Basic or Special. Basic Attack actions are always an Attribute Check (STR or DEX for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Body as Defense. Special Attacks are contested against specific Skills, depending on the nature of the attack. Unless otherwise specified, an Attack typically causes one damage when it succeeds, and Shifts cause extra damage points.

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

* TODO

### Miscellaneous Actions

* {% item "Action/Sheathe_Unsheathe", "type" %}
* {% item "Action/Reload", "type" %}
* {% item "Action/Catch_Breath", "type" %}
* {% item "Action/Focus", "type" %}
* {% item "Action/Inspire", "type" %}
* {% item "Action/Heroic_Relentlessness", "type" %}

### Meta Actions

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

* {% item "Action/Decrease_Initiative", "type" %}
* {% item "Action/Prepare_Action", "type" %}

### Reactions

* {% item "Action/Opportunity_Attack", "type" %}
* {% item "Action/Dodge", "type" %}
* {% item "Action/Take_Cover", "type" %}
* {% item "Action/Shield_Block", "type" %}
* {% item "Action/Shrug_Off", "type" %}
* {% item "Action/Flank", "type" %}
* {% item "Action/Taunt", "type" %}
* {% item "Action/Distract", "type" %}

## Conditions

{% include "docs/lexicon/Condition.md" %}

## Consequences

{% include "docs/lexicon/Consequence.md" %}

* {% item "Consequence/Exhaustion" %}
* {% item "Consequence/Poisoned" %}
* {% item "Consequence/Death" %}
