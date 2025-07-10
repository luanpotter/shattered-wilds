Actions are the fundamental building blocks of combat and interaction in **Shattered Wilds**.

Each character has a limited number of [[Resource_Action_Point | Action Points]] (AP) per turn that they can spend to perform actions (including reactions).

## Type: Movement

These are actions associated with movement, and can take several forms. All movement forms can move at least 1 Hex, regardless of the character's Speed. Unused movement cannot be saved for later.

-- TODO: difficult terrain

<details>
  <summary>Movement Actions</summary>
  <ul>
    <li>{% item "Action/Stride", "type" %}</li>
    <li>{% item "Action/Side_Step", "type" %}</li>
    <li>{% item "Action/Get_Up", "type" %}</li>
    <li>{% item "Action/Run", "type" %}</li>
    <li>{% item "Action/Climb", "type" %}</li>
    <li>{% item "Action/Swim", "type" %}</li>
    <li>{% item "Action/Escape", "type" %}</li>
    <li>{% item "Action/Drag_Grappler", "type" %}</li>
    <li>{% item "Action/Stumble_Through", "type" %}</li>
    <li>{% item "Action/Ride_Mount", "type" %}</li>
    <li>{% item "Action/Hide", "type" %}</li>
    <li>{% item "Action/Sneak", "type" %}</li>
    <li>{% item "Action/Charge", "type" %}</li>
  </ul>
</details>

## Type: Attack

These are actions in which the intent is to inflict damage (either to [[Resource_Vitality_Point | VP]], [[Resource_Focus_Point | FP]] or [[Resource_Spirit_Point | SP]]) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack).

Attack Actions can be either **Basic** or **Special**. Basic Attack actions are always an Attribute Check ([[Stat_STR | STR]] or [[Stat_DEX | DEX]] for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Realm as Defense (for example, a [[Stat_STR | STR]] check against a target's [[Stat_Body | Body]]). Basic Attacks typically cause one damage when they succeed, and Shifts cause extra damage points.

**Special Attacks** are contested against specific [[Skills]], depending on the nature of the attack. Special Attacks might cause other effects, such as [[Condition | Conditions]], and also cause damage.

<details>
  <summary>Attack Actions</summary>
  <ul>
    <li>{% item "Action/Stun", "type" %}</li>
    <li>{% item "Action/Feint", "type" %}</li>
    <li>{% item "Action/Strike", "type" %}</li>
    <li>{% item "Action/Focused_Strike", "type" %}</li>
    <li>{% item "Action/Trip", "type" %}</li>
    <li>{% item "Action/Shove", "type" %}</li>
    <li>{% item "Action/Disarm", "type" %}</li>
    <li>{% item "Action/Grapple", "type" %}</li>
  </ul>
</details>

## Type: Reaction

These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Resource_Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.

<details>
  <summary>Reaction Actions</summary>
  <ul>
    <li>{% item "Action/Sheathe_Unsheathe", "type" %}</li>
    <li>{% item "Action/Reload", "type" %}</li>
    <li>{% item "Action/Catch_Breath", "type" %}</li>
    <li>{% item "Action/Focus", "type" %}</li>
    <li>{% item "Action/Inspire", "type" %}</li>
    <li>{% item "Action/Heroic_Relentlessness", "type" %}</li>
  </ul>
</details>

## Type: Miscellaneous

These are actions that do not fit into the other categories.

<details>
  <summary>Miscellaneous Actions</summary>
  <ul>
    <li>{% item "Action/Opportunity_Attack", "type" %}</li>
    <li>{% item "Action/Dodge", "type" %}</li>
    <li>{% item "Action/Take_Cover", "type" %}</li>
    <li>{% item "Action/Shield_Block", "type" %}</li>
    <li>{% item "Action/Shrug_Off", "type" %}</li>
    <li>{% item "Action/Flank", "type" %}</li>
    <li>{% item "Action/Taunt", "type" %}</li>
    <li>{% item "Action/Distract", "type" %}</li>
  </ul>
</details>

## Type: Luck

There a few ways to exert your supernatural connection to Luck in Shattered Wilds.

<details>
  <summary>Luck Actions</summary>
  <ul>
    <li>{% item "Action/Luck_Die", "type" %}</li>
    <li>{% item "Action/Karmic_Resistance", "type" %}</li>
    <li>{% item "Action/Write_History", "type" %}</li>
  </ul>
</details>

## Type: Meta

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

<details>
  <summary>Meta Actions</summary>
  <ul>
    <li>{% item "Action/Decrease_Initiative", "type" %}</li>
    <li>{% item "Action/Prepare_Action", "type" %}</li>
    <li>{% item "Action/Extra_Die", "type" %}</li>
  </ul>
</details>
