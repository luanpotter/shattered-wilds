A Statistic (or Stat) is a number associated with a character that measures their ability in a certain area of application.

**Primary Stats** cannot be derived from anything else, being the source of all other Statistics. That is in contrast to **Derived Stats**, which are calculated via formulae from Primary Stats.

The Primary Stats in the D12 System form a ternary tree featuring a trickle down mechanism, and starting with your [[Stat_Level | Level]] as the root statistic. Your [[Stat_Level | Level]] then divides into 3 **Realms**: [[Stat_Body | Body]], [[Stat_Mind | Mind]] and [[Stat_Soul | Soul]]; and they combined branch to the 9 **Attributes** ([[Stat_STR | STR]], [[Stat_DEX | DEX]], [[Stat_CON | CON]], [[Stat_INT | INT]], [[Stat_WIS | WIS]], [[Stat_CHA | CHA]], [[Stat_DIV | DIV]], [[Stat_FOW | FOW]], [[Stat_LCK | LCK]]). Finally, the 9 Attributes branch into 27 **Skills**.

{% include "stat-tree.html" %}

The way the trickle down works is, for every point you earn on a node past the first, you get to propagate that point to one of the three children. So at [[Stat_Level | Level]] 1, every single adventurer has the same attributes (bar racial, class and feat bonuses of course). But when they level up to 2, they get to propagate to the [[Stat_Body | Body]]/[[Stat_Mind | Mind]]/[[Stat_Soul | Soul]] tier, and thus make their first attribute choice. On [[Stat_Level | Level]] 3, you can propagate to the same node as before, doubling down on one of the 3 realms, and getting to propagate again, or you can generalize and pick a second realm to focus on.

The way modifiers work is that you always roll the most specific check you can, normally a Skill check for skills or a Basic Attribute for core game actions (such as attacks); your modifier on each node is based on its value and the values of the parents. Use the built-in character sheet editor to easily fill up your tree.

Note that you shall very rarely need to use modifiers for nodes other than Attributes and Skills. The final value of a node is also subject to a [[Stat_Level | Level]] cap: the final node modifier (before applying any external modifiers) is capped at your current level. That means there are diminishing returns to over-specializing, and players are encouraged to have at least a minimal level of spread.

## Derived Stats

Derived Stats are based on formulae over the primary stats.

You have 5 [[Resource Point | Resource Points]] that are derived from your stats:

* {% item "Resource_Heroism_Point" %}
* {% item "Resource_Action_Point" %}
* {% item "Resource_Vitality_Point" %}
* {% item "Resource_Focus_Point" %}
* {% item "Resource_Spirit_Point" %}

Other derived stats include:

* {% item "Derived_Stat/Initiative" %}
* {% item "Derived_Stat/Movement" %}
