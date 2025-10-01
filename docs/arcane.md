The **Arcane** is a science about the laws of physics, the art of controlling the world by recreating vibrations or shockwaves in reality by precise movements and sounds in order to produce certain effects based on the current state of the world. It requires a strong level of focus and mental acuity to concoct the exact movements for any desired outcome given any current circumstances.

While creating the necessary movements and sounds can be assisted through the use of mechanical devices or instruments, it appears that their primordial source must be tied to a **Soul**, and thus cannot be completely automated. In fact, the [[Influence Range]] of your Soul determines the extent to which you can easily affect around you. Some sequences of movements can be combined by crafting mechanical devices (the specialty of the Mechanistic caster), but those must still be executed by the caster. Also since the exact movements depend on the circumstances, it cannot be fully prepared ahead of time, requiring intense focus during the moment of casting.

You can think of Arcane as a spell system where the Player chooses the desired effect, and the DM tells them how hard it will be (as opposed to the [Divine](/rules/divine.md) spell system, where the Player rolls a Check and the DM tells them the effect).

{% include "docs/lexicon/Arcane_Schools.md" %}

Within the domain of the **Arcane**, the bodies of **Beings** are not just material; as they are tied to their Spark (or Soul). Think of Beings having an impenetrable aura that prevents Matter and Energy manipulation inside. However, the Being can still be manipulated directly, via **Transfiguration** or **Command**. While **Telekinesis** cannot be used directly on beings, the air around them can be controlled in the form of gusts of wind for pushes and pulls.

Casting a spell typically will require (see **Fundamental Arcane Spell** below):

* a certain amount of **AP** ([[Action_Point | Action Points]]) and **FP** ([[Focus_Point | Focus Points]]) to be spent;
* executing some non-zero amount of **Spell Components**;
* rolling a [[Check]] using the Spellcaster's Base Attribute:

> Roll Base Spellcasting Attribute + Component Modifiers + Augmentation Modifiers [+ Other Circumstance Modifiers]

The Base DC for an uncontested Fundamental Arcane Spell is 15. That is the minimum DC for any Arcane Spell, but it can be higher if contested. Spells directly targeting a creature will require a Contested Check instead (see Contested Checks below).

## Concentration

Casting a spell has the [[Concentrate]] trait (even if instantaneous). Depending on the chosen School and desired effect, spells can be instantaneous, meaning they are done after the Casting Time over which the Components are executed; or they can be held in Concentration. While Concentrating, the Caster cannot take other [[Concentrate]] actions (such as other Spells). A Caster can always just drop Concentration at will. See more details about which types of effects can be instantaneous or not under **Augmentations > Duration** below.

As with any other Concentrate Action, if the Caster is disrupted during concentration (or during the Spell Casting) via the [[Feint]] action, they must roll a [[Tenacity]] check to sustain Concentration or finalize the cast.

## Contested Checks

When directly trying to affect a creature with a spell, the Base DC is replaced with a Contested Check (but the Base DC is still the minimum). Which Check to be used depends on the nature of the spell being cast.

Launching a projectile, be it matter or energy, onto a creature, is considered a **Basic Body Attack**, and therefore is contested with a **Basic Body Defense** Check.

Other effects are typically considered **Special Attacks**, and therefore are contested by specific **Skills**. For example:

* Using **Conjuration** to create a falling boulder to harm a creature: [[Resilience]]
* Using **Evocation** to create heat or cold energies to harm a creature: [[Resilience]]
* Using **Telekinesis** to form a gust of wind to push a creature: [[Stance]]
* Using **Command** to control a creature's mind: [[Resolve]]
* Using **Transfiguration** to modify a creature's body: [[Toughness]]
* Using **Command** to control vines to [[Grapple]] a creature: [[Evasiveness]] to first avoid, and [[Muscles]] to evade after being trapped.

Note that a creature can choose not to resist; in which case the **Base DC** is used instead.

Narratively, if the Check rolls between the Spell DC using the **Base DC** and the (higher) Spell DC using the **Contested Check**, the spell succeeds but is resisted by the target, while if it fails even the **Base DC**, the spell just fails to produce any effect.

## Influence Range

While the **Arcane** is a science of the [[Mind]], the production of the necessary movements and sounds must be "attached" to a **Soul** for it to have any effect. The strength of one's **Soul** does not impact the power and effect of their **Arcane** spells, but it does impact the range of their influence, through the [[Influence Range]] derived stat:

> Influence Range = [2 + ceil([[Aura]] / 2)] hexes

That does not mean your influence cannot expand further; however it will get harder and harder according to the **Range Increment** system (see **Augmentations > Range** below for details). Also, remember that you can always use **Telekinesis** to impart momentum to nearby objects, which will keep moving in a given direction as an arrow would.

## Basic Spell Attacks

Regardless of specific narrative flavor (see **Predefined Spells** below for inspiration), a **Caster** can use a **Fundamental Arcane Spell** (2 [[Action_Point | AP]], 1 [[Focus_Point | FP]]), range of 1 **Range Increment**, with **Spell DC 15** to harm an enemy within 1m as a Basic Attack against a target's Body or Soul ([[Vitality_Point | VP]] or [[Spirit_Point | SP]] damage). The most typical **Augmentations** for a Basic Spell Attack are _Range_, _Multi-target_, and _Casting Time_.

## Shifts

For spells being used as attacks, **Shifts** deal extra damage as usual. Otherwise, depending on DM, they can be used to increase the potency of the desired effect. However, Spells are all or nothing - if the **Check** fails, no effect happens. So the caster must chose their essential Augmentations carefully. This is because it is impossibly unlikely that a randomly incorrect sequence of movements will produce a (different) valid **Arcane Spell**. Think of it as typing in the letters for a poem; while there are infinitely many poems that one could write, depending on their creativity and desired effect, if they mistype one letter from an otherwise valid poem, it is exceedingly unlikely that the result will be a different valid poem with a different effect.

As a concrete example, imagine a **Caster** chooses to expand the _Area_ of a _Poison Cloud_ by `1` Hex, bringing the final augmentation modifier from `-8` to `-12`. If they roll a `26` (`-12` = `14`), the spell fails, and nothing happens. But if they stick to the plan of just a single Hex, and roll a `29` (`-8` = `21`), they get `1` **Shift** over the **Base DC** `15`, and the DM might decide that the poison cloud ended up being more beneficial than expected in some way.

## Components

**Spell Components** are the mechanisms used to produce the necessary conditions (vibrations or shockwaves) for the spell to work; they can be in the form of **Verbal** (sounds), **Somatic** (movements, typically hand gestures, but can also tool-assisted) or **Focal** (using an [[Imbued Item]] that uses power from the **Aether** to enact subtle vibrations on the **Material Plane**). Every spell needs at least one **Component** to be cast, regardless of any other conditions.

Different **Flavors** of **Casters** have different access to different types of components; the [[Arcanists]] being the more versatile, being able to use all three, but to a lesser potential than the specialists in each type.

| Components | Arcanist | Mechanistic | Naturalist | Musicist |
|------------|----------|-------------|------------|----------|
| Verbal     | Y        |             |            | YY       |
| Somatic    | Y        | YY          |            |          |
| Focal      | Y        |             | YY         |          |

It is important to note that the difficulty in executing **Spell Components** is due to figuring out what exact movements and sounds are needed to produce the desired effect, rather than the technical difficulty of performing the acts themselves. Therefore, you do not need high [[DEX]] to execute **Somatic** components, or high [[CHA]] for **Verbal** components (a **Musicist** leverages their high [[CHA]] to empathize with their own body's (or throat's) natural talent to vibrate in the correct way); however if your hands are restricted, or you are unable to speak, you would not be able to perform the associated components.

### Verbal

The **Verbal Component** can include shouting, chanting, singing, or music produced by the caster via their body or instruments. Typically, this will be done in the form of incomprehensible shouting and chanting of specific sounds, not matching any specific language. **Musicists** are able to use instruments (often accompanied by singing) to replace their **Verbal Component**.

**Basic Chanting**: +1
**Typical One-Handed Instrument**: +2 (**Musicists** only)
**Typical Two-Handed Instrument**: +3 (**Musicists** only)

The execution of **Verbal Components** requires a baseline freedom of speech; so they cannot be performed while under the [[Silenced]] condition.

### Somatic

The **Somatic Component** can include hand gestures, body movements, or tool-assisted movements (for the **Mechanistics**). Typically, this will be done in the form of fast and precise hand gestures. **Mechanistics** are able to concoct and use tools to replace their **Somatic Component**.

* **Basic Gesturing**: +1
* **Typical One-Handed Tool Use**: +2 (**Mechanistics** only)
* **Typical Two-Handed Tool Use**: +3 (**Mechanistics** only)

The execution of Somatic components require a baseline freedom of movement; so they cannot be performed while under the [[Immobilized]] condition.

### Focal

The **Focal Component** is an [[Imbued Item]] that uses power from the **Aether** to manipulate the vibrations on the **Material Plane** to assist in creating **Arcane Spell Components**. Essentially it is using Divine power to assist on the executing of casting Arcane Spells. **Wands**, **Staves** and other types of [[Imbued Item | Imbued Items]] can be considered **Foci**, with different bonuses (similar to weapon bonuses).

However, as any [[Imbued Item]], using a **Focal Component** requires spending a certain number of [[Spirit_Point | Spirit Points]] to activate (typically 1 [[Spirit_Point | SP]]). Essentially, the **Caster** is connecting (a very weak form of **Channeling**) to the **Focal Component** to activate it in the correct way. That still requires mental concentration, as the **Foci** need to be instructed on the exact nature of the required vibrations, and therefore cannot be used by non-Casters. That also cannot be done while [[Distraught]], as it does require [[Channeling]].

Therefore, as with other [[Imbued Item | Imbued Items]], the usages of a **Focal Component** require touching, concentrating, and possibly very minor manipulation of the **Focus**; and the [[Disarm]] action can be used to try to remove the **Focal Component** from a **Caster**'s hand.

* **Typical One-Handed Wand**: +2
* **Typical Two-Handed Staff**: +3
* **Custom Focus**: +4 (**Naturalists** only)

As **Imbued Items**, **Wands** and **Staves**, even the simpler +1/+2 versions are not as trivial to find as **Mundane Items**, but a seasoned **Arcanist** such as a **Hero** can be considered to have found one if desired. **Custom Foci** can only be created by **Naturalists** (using their **Core Minor Feat**, [[Focal Connection]]), but are personally bound to their creators.

### Scrolls

While not exactly a Component per se, **Scrolls** can be crafted by really powerful Arcanists that are able capture the essence of the immutable parts of instructions for a very specific effect. Distinguishing the correct instructions that are truly generic to include in the **Scroll** and how to express them in an intuitive manner is part of the difficulty in creating such a powerful item. They can be used by any **Caster**, but using them still requires figuring out the rest of the **Components** given the current state of the world (so they cannot be used by non-Casters). Heroes might often find specific **Scrolls** written in the past during their adventures. Casting a Spell using a **Scroll** will provide a bonus to the Check, but the **Scrolls** are tied to very specific outcomes, and not customizable.

## Augmentations

Every spell is essentially a specialization of the **Fundamental Arcane Spell**, with a specific choice of **School** (**Verb** + **Noun**) and a set of **Augmentations** depending on the desired effect. Each **Augmentation** will add either a positive or a negative modifier to the Check, to the discretion of the DM. Below some traditional augmentations are listed, but circumstances might require additional ones.

### Casting Time

The typical casting time of the Fundamental Arcane Spell is **2AP**. The table below shows other options, with the associated **Augmentation Modifiers**:

| AP | Augmentation Modifier |
|----|-----------------------|
| 1  | -12                   |
| 2  | +0 (Default)          |
| 3  | +2                    |
| 4  | +4                    |

Extending the casting time over longer periods has severe diminishing returns, and would be impractical during an **Encounter**. When casting a Spell with no time sensitivity, the **Caster** can choose to cast as a **Ritual**, taking about 15 minutes for a maximum of `+6` [[Circumstance_Modifier | CM]].

That means a Level 1 **Caster**, with typically a `+3` primary attribute bonus, `+3` component bonus and `+6` _Casting Time_ augmentation, can reasonably guarantee (with miniscule chance of failure) the cast of a **Fundamental Arcane Spell** with no other augmentations through a **Ritual**.

### Focus Cost

The typical focus cost of the Fundamental Arcane Spell is **1 [[Focus_Point | FP]]**. Each additional [[Focus_Point | FP]] will add a `+2` modifier, up to twice the number of [[Action_Point | AP]] used (one can't just cram that much focus into too little time). If the spell is being cast as a **Ritual**, there is no limit on the amount of [[Focus_Point | FP]] that can be spent.

### Duration

Depending on the the **School**, duration of the spell works in different ways:

* **Conjuration**: Creating matter is always instantaneous and permanent, requires no **Concentration** after the fact. There is no _Duration_ augmentations.
* **Evocation**: Creating energy is permanent, but energy naturally dissipates over time, depending on the amount. **Concentration** can be held to prevent dissipation, and _Duration_ can be augmented to retard the decay. As a rule of thumb, dissipation over a few turns should be negligible; over 15 minutes should be noticeable, but stronger energies will have a higher dissipation rate.
* **Transmutation**: Transmuting matter can be either temporary or permanent; if temporary, it can be held with **Concentration**, and extra modifiers can be added for lingering effect. For a `+12` [[Circumstance_Modifier | CM]], the transmutation can be made permanent, in which case no further **Concentration** is required.
* **Transfiguration**: Unlike inanimate matter, the body can _never_ be altered permanently. Any changes are always temporary and require **Concentration** to maintain, but a large modifier can be added to make it linger.
* **Telekinesis**/**Command**: Control spells always last as long as **Concentration**. There is no _Duration_ augmentation.

### Range

The typical range you can influence is determined by your [[Influence Range]]. That does not mean you cannot influence more distant targets; for each additional **Range Increment** you add, the **Caster** will have a `-3` [[Circumstance_Modifier | CM]] to the **Spell Check**. This is equivalent of a **Ranged Weapon Attack** with a weapon with **Range Increment** equal to your [[Influence Range]].

Regardless of range, you must be able to clearly see the target area in order to assess environmental conditions for the Spell. If you are only able to partially see the target area, you will receive a `-6` [[Circumstance_Modifier | CM]] to the **Spell Check**. If you cannot see the area at all, you will need a reasonable justification for knowing the exact conditions (very hard to justify) and will receive at least a `-12` [[Circumstance_Modifier | CM]] to the **Spell Check**.

Note that the range increment penalties are merely a linear approximation for battlefield-relevant ranges, for the benefit of the reader. Unreasonably larger ranges will incur exponential penalties, to the discretion of the DM.

Also remember that the **Caster** can use **Telekinesis** to impulse objects outside of their [[Influence Range]], but control is lost at that point.

### Area/Volume/Targets

Depending on the nature of the Spell, it might affect a certain area, volume or amount of beings (targets). The table below breaks down the typical effects of a Fundamental Arcane Spell and the augmentation costs:

| Effect Type | Basic Effect | Increment Cost |
|-------------|--------------|----------------|
| Area        | 1 Hex        | -4 / Hex       |
| Volume      | 1-10L        | -2 / Portion   |
| Target      | 1 Being      | -12 / Being    |

Note that the area and volume increment costs are merely linear approximations for _small areas and volumes_, for the benefit of the reader. Unreasonably larger effects the increment cost will become exponential (to DM discretion).

### Power/Material/Complexity/Specificity

There are endless other factors that would affect the spell's modifiers, such as material, composition, complexity, or specificity.

Some examples per School type of other Augmentations to consider are:

* **Conjuration**: the material, complexity and specificity of the matter being created; denser, rarer matter types, mixed with other things, or with specific shapes.
* **Evocation**: creating more powerful amounts of energy.
* **Transmutation**: the material, complexity and specificity of the matter being transformed; whether the material being transformed is mixed with others.
* **Transfiguration**: the complexity and specificity of the change.
* **Telekinesis**: speed, weight, and complexity of the movement pattern.
* **Command**: the complexity of the command.

While the Player can control the exact effect they aim to achieve, the DM has the final word on the modifiers of any given Spell.

## Predefined Spells

The [[Predefined_Arcane_Spells | Predefined Arcane Spells]] page contains a list of suggested spells for each **School**.
