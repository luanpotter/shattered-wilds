Actions are the fundamental building blocks of combat and interaction in **Shattered Wilds**.

Each character has a limited number of [[Action_Point | Action Points]] (AP) per turn that they can spend to perform actions (including reactions).

## Type: Movement

These are actions associated with movement, and can take several forms. All movement forms can move at least 1 Hex, regardless of the character's Speed. Unused movement cannot be saved for later.

### Difficult Terrain

If a hex has Difficult Terrain, it counts as 2 hexes for the purposes of **Movement** (except for the [[Side Step]] action).

<details>
  <summary>Movement Actions</summary>
  {% list "Action", "title", "type" "Movement" %}
</details>

## Type: Attack

These are actions in which the intent is to inflict damage (either to [[Vitality_Point | VP]], [[Focus_Point | FP]] or [[Spirit_Point | SP]]) to an opponent. Attack Actions are an active contested check against the target's Defense (which depends on the nature of the Attack).

Attack Actions can be either **Basic** or **Special**. Basic Attack actions are always an Attribute Check ([[STR]] or [[DEX]] for Physical attacks or the Spellcasting Attribute for Spell Attacks) contested by the target's Realm as Defense (for example, a [[STR]] check against a target's [[Body]]). Basic Attacks typically cause one damage when they succeed, and Shifts cause extra damage points.

**Special Attacks** are contested against specific [[Skills]], depending on the nature of the attack. Special Attacks might cause other effects, such as [[Condition | Conditions]], and also cause damage.

### Ranged Attacks

Range attacks will typically have to contend with a few categories of [[Circumstance Modifier | CMs]], such as:

#### Range Increments

A ranged (or thrown) weapon will be listed with its base range in hexes (for example, a thrown **Dagger** has a base range of `3m`, while a **Bow** has a base range of `12m`). However it is entirely possible to attempt to hit a target further than the base range. To do so, apply a **Range Increment** [[Circumstance Modifier | CM]] based on the number of range increments in excess of the base range. The range increment is equal to `min(1, floor([base range] / 2))`, and each range increment will incur a `-3` [[Circumstance Modifier | CM]] to the **Attack Check**.

So for example, attempting to throw a **Javelin** (range: `6` hexes, increment: `3` hexes) against a target 10 hexes away will incur a `-6` penalty.

The [[Aim]] action can be used to reduce the range increment by `1` (min `0`).

#### Basic Cover

When there is not a clear line of sight for a ranged attack, there are enemies or allies in the way, or the target is adjacent to a wall, you automatically benefit from Basic Cover against ranged attacks.

Basic Cover will grant you a [[Circumstance Modifier | CM]] to your **Basic Body Defense** against **Ranged Attacks**:

* **Lesser**: +1 (creatures on the way, 1m-tall obstacle, etc)
* **Standard**: +2 (line of sight is blocked by the corners of obstacles)
* **Greater**: +4 (line of sight is almost completely obstructed)

Note that on top of the **Basic Cover**, a target might want to react with the [[Take_Cover]] reaction when applicable.

#### High-Ground Advantage

In situations where the attacker and the target are not at the same elevation, count the elevation increments between them and apply the following formula, with the advantage being to the character on the high ground.

```text
  CM = floor([height increment] / 2)
```

<details>
  <summary>Attack Actions</summary>
  {% list "Action", "title", "type" "Attack" %}
</details>

## Type: Reaction

These are actions that can be taken at any time in combat, often in response to a specific event or situation. Unlike other systems, a character can take as many Reactions as they want, as long as they have the [[Action_Point | AP]] to afford them.

Since your **AP** is replenished at the end of your turn, you do not need to decide whether to "save" **AP** for reactions.

<details>
  <summary>Reaction Actions</summary>
  {% list "Action", "title", "type" "Reaction" %}
</details>

## Type: Miscellaneous

These are actions that do not fit into the other categories.

<details>
  <summary>Miscellaneous Actions</summary>
  {% list "Action", "title", "type" "Miscellaneous" %}
</details>

## Type: Luck

There a few ways to exert your supernatural connection to Luck in Shattered Wilds.

<details>
  <summary>Luck Actions</summary>
  {% list "Action", "title", "type" "Luck" %}
</details>

## Type: Meta

Turns in Shattered Wilds are very reactive due to the higher possibility of Reactions to act as interruptions. However, there are still a few meta-options to change or interact in more direct ways with the turn ordering.

<details>
  <summary>Meta Actions</summary>
  {% list "Action", "title", "type" "Meta" %}
</details>
