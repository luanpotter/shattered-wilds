# Encounters

{% include "docs/lexicon/Encounter.md" %}

# Actions

## Movement Actions

Movement actions are associated with movement, and can take several forms. All movement forms can move at least 1 hex, regardless of the Speed formula.

* **Move (1 AP)**: Move up to `Speed` hexes. Movement cannot be saved for later.
* **Side Step (1 AP)**: Move 1 hex in any direction. This does not trigger Opportunity Attacks.
* **Get Up (1 AP)**: Clears Prone.
* **Run (3 AP)**: Move up to `4 * Speed` hexes. Exert (10 + hexes moved).
* **Climb (1 AP)**: Climb one reasonable ledge (one hex). Harder climbs might require a Lift check.
* **Swim (1 AP)**: Swim up to `Speed / 2` (round up) hexes.
* **Escape (1 AP)**: Contested Evasiveness check to clear Immobilized against grappler.
* **Drag Grappler (1+ AP)**: Move 1 hex while Immobilized, dragging your grapple. Requires a contested Muscles check against Stance with a -3 modifier. You can use more APs to move extra hexes.
* **Stumble Through (1 AP)**: Contested Finesse check against opponent's Stance. Move past one enemy to an adjacent hex, as long as your `Speed` is 2 or more.
* **Ride Mount (2 AP)**: -- TODO.
* **Hide (1 AP)**: [Concentrate] Try to conceal yourself; make a Finesse active check that can be contested by each opponent's Perception Check.
* **Sneak (1+ AP)**: Move `Speed - 1` hexes making an additional Finesse check. Any other participant for which you are Concealed can make a contested Awareness check to spot you.
* **Charge (2 + X AP)** (this is a combined Movement + Attack action): Move `Speed + 1` hexes in a straight line, followed by Melee Attack with Muscles instead of STR. This can be used for a "Tackle" if the "Shove" Attack Action is chosen, in which case a Circumstance Bonus of +3 is granted to the attacker.

## Attack Actions

Attack Actions are actions in which the intent is to inflict damage (either to VP, FP or SP) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack). Attack Actions can be either Basic or Special. Basic Attack actions are always an Attribute Check (STR or DEX for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Body as Defense. Special Attacks are contested against specific Skills, depending on the nature of the attack. Unless otherwise specified, an Attack typically causes one damage when it succeeds, and Shifts cause extra damage points.

* **Stun (1 AP)**: Melee only; Basic Attack. Causes Off-Guard. Shifts deal FP damage.
* **Feint (1 AP)**: Special Attack against Tenacity. Causes Distracted. Shifts deal FP damage.
* **Strike (2 AP)**: Basic Attack
* **Focused Strike (3 AP)**: [Concentrate] Pay 1 FP; Basic Attack with a +3 Circumstance bonus.
* **Trip (1 AP)**: Melee only; Special Attack against Stance. Causes opponent to be Prone. Shifts deal VP damage.
* **Shove (1 AP)**: Melee only; Special Attack against Stance. Shoves opponent to the next hex in the incoming direction.
* **Disarm (2 AP)**: [Concentrate] Melee only; Special Attack against Muscles or Finesse. Requires at least one Shift to succeed.
* **Grapple (1 AP)**: Melee only; Special Attack against Evasiveness. Does not deal damage but causes target to become Immobilized.

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

* **Sheathe / Unsheathe (1 AP)**: Equip / unequip carried weapons and/or shields.
* **Reload** (1 AP): Reload a weapon with the [Reload] trait.
* **Catch Breath (3 AP)**: Medium Stamina Check (DC 20): +1 VP. Regardless of result: Clears Off-guard
* **Focus (3 AP)**: [Concentrate] Medium Discipline Check (DC 20): +1 FP, Regardless of result: Clears Distracted
* **Inspire (3 AP)**: Medium Speechcraft Check (DC 20): +1 MP to one ally within hearing range. -3 Circumstance bonus if they cannot see you.
--- TODO: Consider Mass Inspire as class-specific action
* **Heroic Relentlessness**: this is a special Action you can take as a full-round action when you are Incapacitated by paying a Heroism Point to make a Hard FOW Check (DC 25). Restore your Vitality, Focus and Spirit Points to at least 1 each, thus clearing Incapacitated (you get a level of Exhaustion as usual).

## Meta Actions

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

* **Decrease Initiative**: At the start of your turn, you can choose to decrease your Initiative to any value below the current. Your turn then does not start and moves down the turn order. You can never raise your initiative.
* **Prepare Action (1 + X AP)**: [Concentrate] You can prepare a specific Action to be executed during the next round as a reaction. You must pay 1 extra AP to prepare, plus the AP associated with the Action you are preparing now, and will be Concentrating and cannot take any other Action or Reaction until your trigger procs next round. You will be Concentrating during this period and therefore can lose the action if you become Distracted. Depending on the complexity of the trigger, the DM might need to ask for an IQ, Perception, or some other check to determine your ability to properly react.

# Reactions

* **Opportunity Attack (1+ AP)**: Triggered by an opponent either (1) leaving your threat area or (2) performing an action on your threat area that triggers an opportunity attack (such as concentrating or channeling). You can choose what kind of Melee Basic Attack to perform as your opportunity attack (this will cost the same amount of AP as that Action would).
* **Dodge (1 AP)**: Defend Body against a Basic Attack with Evasiveness + 3 instead.
* **Take Cover (1 AP)**: Defend Body against a Ranged Basic Attack with Speed + 6 instead when already benefiting from Basic Cover.
* **Shield Block (1 AP)**: Add Shield Bonus to a Defend Body contested check.
* **Shrug Off (1 AP)**: Immediately as taking >1 VP damage, you can attempt a Medium Toughness (DC 20) check to reduce the damage by 1 (+ Crit Shifts) (min 1).
* **Flank (1 AP)**: When an ally attack, if on Flanking position, give them a +3 Circumstance Bonus.
* **Taunt (1 AP)**: Spend 1 FP; roll a Speechcraft check against targets Resolve to persuade an enemy attempting to Melee attack a different target to instead attack you (when you are also in range and would be a valid target).
* **Distract (1 AP)**: ...
* **Counterattack (2 AP)**: ...

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