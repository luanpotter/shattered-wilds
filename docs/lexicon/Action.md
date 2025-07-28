Actions are the fundamental building blocks of combat and interaction in **Shattered Wilds**.

Each character has a limited number of [[Action_Point | Action Points]] (AP) per turn that they can spend to perform actions (including reactions).

## Type: Movement

These are actions associated with movement, and can take several forms. All movement forms can move at least 1 Hex, regardless of the character's Speed. Unused movement cannot be saved for later.

### Difficult Terrain

If a hex has Difficult Terrain, it counts as 2 hexes for the purposes of **Movement** (except for the [[Step]] action).

<details>
  <summary>Movement Actions</summary>
  <ul>
    <li>{% item "Stride", "type" %}</li>
    <li>{% item "Side_Step", "type" %}</li>
    <li>{% item "Get_Up", "type" %}</li>
    <li>{% item "Run", "type" %}</li>
    <li>{% item "Climb", "type" %}</li>
    <li>{% item "Swim", "type" %}</li>
    <li>{% item "Escape", "type" %}</li>
    <li>{% item "Drag_Grappler", "type" %}</li>
    <li>{% item "Stumble_Through", "type" %}</li>
    <li>{% item "Ride_Mount", "type" %}</li>
    <li>{% item "Hide", "type" %}</li>
    <li>{% item "Sneak", "type" %}</li>
    <li>{% item "Charge", "type" %}</li>
  </ul>
</details>

## Type: Attack

These are actions in which the intent is to inflict damage (either to [[Vitality_Point | VP]], [[Focus_Point | FP]] or [[Spirit_Point | SP]]) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack).

Attack Actions can be either **Basic** or **Special**. Basic Attack actions are always an Attribute Check ([[STR]] or [[DEX]] for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Realm as Defense (for example, a [[STR]] check against a target's [[Body]]). Basic Attacks typically cause one damage when they succeed, and Shifts cause extra damage points.

**Special Attacks** are contested against specific [[Skills]], depending on the nature of the attack. Special Attacks might cause other effects, such as [[Condition | Conditions]], and also cause damage.

#### Basic Cover

When there is not a clear line of sight for a ranged attack, there are enemies or allies in the way, or the target is adjacent to a wall, you automatically benefit from Basic Cover against ranged attacks.

Basic Cover will grant you a [[Circumstance Modifier | CM]] to your **Basic Body Defense** against **Ranged Attacks**:

* **Lesser**: +1 (creatures on the way, 1m-tall obstacle, etc)
* **Standard**: +2 (line of sight is blocked by the corners of obstacles)
* **Greater**: +4 (line of sight is almost completely obstructed)

<details>
  <summary>Attack Actions</summary>
  <ul>
    <li>{% item "Stun", "type" %}</li>
    <li>{% item "Feint", "type" %}</li>
    <li>{% item "Strike", "type" %}</li>
    <li>{% item "Focused_Strike", "type" %}</li>
    <li>{% item "Trip", "type" %}</li>
    <li>{% item "Shove", "type" %}</li>
    <li>{% item "Disarm", "type" %}</li>
    <li>{% item "Grapple", "type" %}</li>
  </ul>
</details>

## Type: Reaction

These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.

<details>
  <summary>Reaction Actions</summary>
  <ul>
    <li>{% item "Sheathe/Unsheathe", "type" %}</li>
    <li>{% item "Reload", "type" %}</li>
    <li>{% item "Catch_Breath", "type" %}</li>
    <li>{% item "Focus", "type" %}</li>
    <li>{% item "Inspire", "type" %}</li>
    <li>{% item "Heroic_Relentlessness", "type" %}</li>
  </ul>
</details>

## Type: Miscellaneous

These are actions that do not fit into the other categories.

<details>
  <summary>Miscellaneous Actions</summary>
  <ul>
    <li>{% item "Opportunity_Attack", "type" %}</li>
    <li>{% item "Dodge", "type" %}</li>
    <li>{% item "Take_Cover", "type" %}</li>
    <li>{% item "Shield_Block", "type" %}</li>
    <li>{% item "Shrug_Off", "type" %}</li>
    <li>{% item "Flank", "type" %}</li>
    <li>{% item "Taunt", "type" %}</li>
    <li>{% item "Distract", "type" %}</li>
  </ul>
</details>

## Type: Luck

There a few ways to exert your supernatural connection to Luck in Shattered Wilds.

<details>
  <summary>Luck Actions</summary>
  <ul>
    <li>{% item "Luck_Die", "type" %}</li>
    <li>{% item "Karmic_Resistance", "type" %}</li>
    <li>{% item "Write_History", "type" %}</li>
  </ul>
</details>

## Type: Meta

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

<details>
  <summary>Meta Actions</summary>
  <ul>
    <li>{% item "Decrease_Initiative", "type" %}</li>
    <li>{% item "Prepare_Action", "type" %}</li>
    <li>{% item "Extra_Die", "type" %}</li>
  </ul>
</details>
