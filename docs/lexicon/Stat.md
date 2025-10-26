A Statistic (or Stat) is a number associated with a character that measures their ability in a certain area of application.

**Primary Stats** cannot be derived from anything else, being the source of all other Statistics. That is in contrast to **Derived Stats**, which are calculated via formulae from Primary Stats.

The Primary Stats in the D12 System form a ternary tree featuring a trickle down mechanism, and starting with your [[Level]] as the root statistic. Your [[Level]] then divides into 3 **Realms**: [[Body]], [[Mind]] and [[Soul]]; and they combined branch to the 9 **Attributes** ([[STR]], [[DEX]], [[CON]], [[INT]], [[WIS]], [[CHA]], [[DIV]], [[FOW]], [[LCK]]). Finally, the 9 Attributes branch into 27 **Skills**.

{% include "stat-tree.html" %}

More details about how the trickle down (point propagation) and level caps work are detailed below; however a simpler way to explore the system might be to use the [Simulator](/simulator) and play around with characters.

<details>
    <summary>Advanced Breakdown of the Stat Tree</summary>

How the trickle down works is, for every point you earn on a node past the first, you get to propagate that point to one of the three children. So at [[Level]] 1, every single **Hero** has the same attributes (bar racial, class and feat bonuses of course). But when they level up to 2, they get to propagate to the [[Body]]/[[Mind]]/[[Soul]] tier, and thus make their first attribute choice. On [[Level]] 3, you can propagate to the same node as before, doubling down on one of the 3 realms, and getting to propagate again, or you can generalize and pick a second realm to focus on.

Then each node has its modifier computed according to its hierarchy: Level / 4, Realm / 2, and Attributes and Skills are 1:1.

The way modifiers work is that you always roll the most specific check you can, normally a Skill check for skills or an Attribute for core game actions (such as attacks); your modifier on each node is based on its value and the values of the parents. Use the built-in character sheet editor to easily fill up your tree.

The final value of a node (except Skills) is also subject to a [[Level]] cap: the self node modifier (before applying any external modifiers) is capped at your current level. That means there are diminishing returns to over-specializing, and players are encouraged to have at least a minimal level of spread.

</details>

## Derived Stats

Derived Stats are based on formulae over the primary stats.

You have 5 [[Resource | Resource Points]] that are derived from your stats:

* {% item "Heroism_Points" %}
* {% item "Action_Points" %}
* {% item "Vitality_Points" %}
* {% item "Focus_Points" %}
* {% item "Spirit_Points" %}

Other derived stats include:

* {% item "Initiative" %}
* {% item "Movement" %}
* {% item "Influence_Range" %}
