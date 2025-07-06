The Primary Stats in the D12 System form a ternary tree featuring a trickle down mechanism, and starting with your Level as the root statistic. Your Level then divides into 3 Realms: Body, Mind and Soul; and they combined branch to the 9 Attributes (STR, DEX, CON, INT, WIS, CHA, DIV, FOW, LCK). Finally, the 9 Attributes branch into 27 Skills.

| Root  |   Realm    | Attribute       | Skill       | Description                                                                                                                            |
|-------|------------|-----------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------|
|       |            |                 | Muscles     | Raw power you can impact in a short burst, e.g. pulling a stuck lever, breaking down an inanimate object, smashing a mug on your hands |
|       |            |       STR       | Stance      | How hard it is to move or push you around, how well you can keep your stance, resist being pushed back                                 |
|       |            |    (Strength)   | Lift        | How much weight you can lift and carry for short periods of times, including yourself (climbing, using ropes, etc)                     |
|       |            |                 | Finesse     | Aim, Quick Fingers, Stealth, Sleight of Hand, precise hand movement, delicate body movements                                                                             |
|       |    Body    |       DEX       | Evasiveness | Evasion, Acrobatics, precise movement of the body                                                                                      |
|       | (Vitality) |   (Dexterity)   | Agility     | Speed, how fast you can move and do things                                                                                             |
|       |            |                 | Toughness   | Damage reduction, tough skin, fall damage                                                                                              |
|       |            |       CON       | Stamina     | Breath, how much exert yourself in a short period of time, your ability to sustain athleticism                                         |
|       |            |  (Constitution) | Resilience  | Resistance to sickness, poison, disease                                                                                                |
|       |            |                 | IQ          | Ability to learn new information, apply logic                                                                                          |
|       |            |       INT       | Knowledge   | Consolidated knowledge and lore about the world                                                                                        |
|       |            |  (Intelligence) | Memory      | Short-term memory, ability to recall details                                                                                           |
|       |            |                 | Perception  | Active perception, seeing, hearing, sensing, feeling                                                                                   |
| Level |    Mind    |       WIS       | Awareness   | Alertness, passive perception, attention to details when not paying attention                                                          |
|       |   (Focus)  |     (Wisdom)    | Intuition   | Common Sense, "Street Smarts", cunning, eg Survival or Animal Handling would be base Intuition (plus any aspect specific bonuses)      |
|       |            |                 | Speechcraft | Rhetoric, speech, ability to persuade, inspire or deceit with language                                                                 |
|       |            |       CHA       | Charm       | Natural panache, beguilingness, body language                                                                                          |
|       |            |    (Charisma)   | Appearance  | Physical attractiveness, ability to dress and present well, body odor                                                                  |
|       |            |                 | Faith       | Strength of your belief your deity [must have one], knowledge about your faith, effectiveness of your Prayers                          |
|       |            |       DIV       | Attunement  | Your general attunement to the Aether, how well you can let divine forces flow through you                                             |
|       |            |    (Divinity)   | Devotion    | Your personal connection to your specific Deity [must have one]                                                                        |
|       |            |                 | Discipline  | Ability to resist urges and temptations, vices and instant gratification                                                               |
|       |    Soul    |       FOW       | Tenacity    | Concentration, ability to ignore pain or hardship or being disturbed and keep going                                                    |
|       |  (Spirit)  | (Force of Will) | Resolve     | Resistance to mind control, social manipulation, deceit, charm; fortitude of the mind; insight                                         |
|       |            |                 | Gambling    | Specifically for when you are gambling                                                                                                 |
|       |            |       LCK       | Fortune     | Your personal luck for your own actions, mainly used for the Luck Die mechanic                                                         |
|       |            |      (Luck)     | Serendipity | Expectations for the external world, also used for the Write History mechanic                                                          |

The way the trickle down works is, for every point you earn on a node past the first, you get to propagate that point to one of the three children. So at Level 1, every single adventurer has the same attributes (bar racial, class and feat bonuses of course). But when they level up to 2, they get to propagate to the Body/Mind/Soul tier, and thus make their first attribute choice. On Level 3, you can propagate to the same node as before, doubling down on one of the 3 realms, and getting to propagate again, or you can generalize and pick a second realm to focus on.

The way modifiers work is that you always roll the most specific check you can, normally a Skill check for skills or a Basic Attribute for core game actions (such as attacks); your modifier on each node is based on its value and the values of the parents. Use the built-in character sheet editor to easily fill up your tree.

Note that you shall very rarely need to use modifiers for nodes other than Attributes and Skills. The final value of a node is also subject to a Level cap: the final node modifier (before applying any external modifiers) is capped at your current level. That means there are diminishing returns to over-specializing, and players are encouraged to have at least a minimal level of spread.

## Derived Stats

Derived Stats are based on formulae over the primary stats.

You have 5 [[Resource Point | Resource Points]] that are derived from your stats:

* {% item "Resource_Heroism_Point" %}
* {% item "Resource_Action_Point" %}
* {% item "Resource_Vitality_Point" %}
* {% item "Resource_Focus_Point" %}
* {% item "Resource_Spirit_Point" %}

Other derived stats are:

* Initiative = Awareness + Agility, used to determine order in combat via an Initiative Check
* Movement = [3 (humanoid base) + Size Modifier + (Agility / 4) (rounded down)] hexes / turn
