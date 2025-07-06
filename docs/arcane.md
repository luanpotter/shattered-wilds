The Arcane is a science about the laws of physics, the art of controlling the world by recreating shockwaves in reality by precise hand movements and sounds in order to produce certain effects based on the current state of the world. It requires a strong level of focus and mental ability to concoct the exact movements for any desired outcome given any current circumstances.

While creating the necessary movements and sounds can be assisted through the use of mechanical devices, it appears that their primordial source must be tied to a Soul, so it is not possible to completely automate the process. Some sequences of movements can be combined by crafting mechanical devices (the specialty of the Mechanistic caster), but those must still be executed by the caster. Also since the exact movements depend on the circumstances, it cannot be fully prepared ahead of time, requiring intense focus during the moment of casting.

You can think of Arcane as a spell system where the Player chooses the desired effect, and the DM tells them the DC of the Check (as opposed to the Divine spell system, where the Player rolls a Check and the DM tells them the effect).

Arcane spells are first and foremost a specific combination of a verb and a noun, which together define their School.

| Verb / Noun     | Matter        | Energy      | Being           |
|-----------------|---------------|-------------|-----------------|
| **Create**      | Conjuration   | Evocation   | -               |
| **Transform**   | Transmutation | -           | Transfiguration |
| **Control**     | -             | Telekinesis | Command         |

In the view of the Arcane, the bodies of Beings are not just material, as they are tied to their Spark (or Soul). Think of Beings having an impenetrable aura that prevents Matter and Energy manipulation inside. However, the Being can still be manipulated directly, via Transfiguration or Command. While Telekinesis cannot be used directly on beings, the air around beings can be controlled to cause gusts of wind While Telekinesis cannot be used directly on beings, the air around beings can be controlled to cause gusts of wind for various effects.

Casting a spell typically will require a certain amount of AP ([[Resource_Action_Point | Action Points]]) and FP ([[Resource_Focus_Point | Focus Points]]) to be spent (see Basic Arcane Spell below), requires executing some non-zero amount of Spell Components, and will require a Check on the Spellcaster's Base Attribute:

> Roll Base Spellcasting Attribute + Component Modifiers [+ Other Circumstance Modifiers]

That value should be matched against the Spell DC which will be:

> Spell DC = [Base DC or Contested Check, whichever is higher] + Augmentation Modifiers

The Base DC for an uncontested Basic Arcane Spell with no Augmentation (i.e. the simplest possible form of each Spell) is 15. That is the minimum DC for any Arcane Spell, but it can be higher if contested. Spells directly targeting a creature will require a Contested Check instead (see Contested Checks below).

## Concentration

Depending on the chosen School and desired effect, spells can be instantaneous, meaning they are done after the Casting Time over which the Components are executed; or they can be held in Concentration. While Concentrating, the Caster cannot take any actions with the Concentrate trait (such as other Spells). A Caster can always just drop Concentration at will. See more details about which types of effects can be instantaneous or not under Augmentations > Duration below.

As with any other Concentrate Action, if the Caster is disrupted during concentration (or during the Spell Casting), they must roll a Tenacity check to sustain Concentration or finalize the cast. See more details on the [Actions](/docs/actions.md) page.

## Contested Checks

When directly trying to affect a creature with a spell, the Base DC is replaced with a Contested Check (but the Base DC is still the minimum). Which Check to be used depends on the nature of the spell being cast.

Launching a projectile, be it matter or energy, onto a creature, is considered a Basic Attack, and therefore is contested with a Basic Defense Check.

Other effects are considered Special Attacks, and therefore are contested by specific Skills. For example:

* Using Telekinesis to form a gust of wind to push a creature: Stance
* Using Command to control a creature: Resolve
* Using Transfiguration to modify a creature's body: Resilience or Toughness (depending on the nature of the transformation)
* Using Command to control vines to Grapple a creature: Evasiveness

Note that a creature can choose not to resist; in which case the Base DC is used instead.

Narratively, if the Check rolls between the Spell DC using the Base DC and the (higher) Spell DC using the Contested Check, the spell succeeds but is resisted by the target, while if it fails even the Base DC, the spell just fails.

## Basic Spell Attacks

Regardless of specific narrative flavor (see Predefined Spells below for inspiration), a Caster can use a Basic Arcane Spell (2[[Resource_Action_Point | AP]], 1[[Resource_Focus_Point | FP]]) with Spell DC 18 to harm an enemy within 1m as a Basic Attack against a target's Body or Soul. The most typical Augmentations for a Basic Spell Attack are Range, Multi-target, and Casting Time.

## Shifts

For spells being used as attacks, Shifts deal extra damage as usual. Otherwise, depending on DM, they can be used to increase the potency of the desired effect. However, Spells are all or nothing - if the Check fails, no effect happens. So the caster must chose their essential Augmentations carefully.

For example, imagine a caster chooses to expand the Area of a Poison Cloud by 1 Hex, bringing the final DC from 20 to 24. If they roll a 23, the spell fails, and nothing happens. But if they stick to the plan of just a single Hex, and roll a 26, they get 1 Shift over the DC 20, and the DM might decide that the poison cloud expanded into a random adjacent hex (or some other consequence).

## Components

The components are the mechanisms used to produce the necessary conditions for the spell to work; they can be in the form of Verbal (sounds), Somatic (movements, typically hand gestures, but can also tool-assisted) or Focal (the simple presence of a specific magical object as a focus). Every spell needs at least one component to be cast, regardless of any other conditions.

Different Flavors of Casters have different access to different types of components; the Arcanists being the more versatile, being able to use all three, but to a lesser potential than the specialists.

| Components | Arcanist | Mechanistic | Naturalist | Musicist |
|------------|----------|-------------|------------|----------|
| Verbal     | Y        |             |            | YY       |
| Somatic    | Y        | YY          |            |          |
| Focal      | Y        |             | YY         |          |

It is important to note that the difficulty in executing spell components is due to figuring out what exact movements and sounds are needed to produce the desired effect, rather than the technical difficulty of performing the acts themselves. Therefore you do not need high DEX to execute Somatic components, or high CHA for Verbal components; however if your hands are restricted, or you are unable to speak, you might face limitations.

### Verbal

The verbal component can include shouting, chanting, singing, or music produced by the caster via their body or instruments. Typically, this will be done in the form of incomprehensible shouting and chanting of specific sounds, not matching any specific language. Musicists are able to use instruments (accompanied by singing) to replace their Verbal component.

**Basic Chanting**: +1
**One-Handed Instrument**: +2
**Two-Handed Instrument**: +3

The execution of Verbal components requires a baseline freedom of speech; so they cannot be performed while under the [[Condition_Silenced | Silenced]] condition.

-- TODO: can verbal components be disrupted by making other noises? [Verbal Distraction]

### Somatic

The somatic component can include hand gestures, body movements, or tool-assisted movements. Typically, this will be done in the form of fast and precise hand gestures. Mechanistics are able to concoct and use tools to replace their Somatic component.

* **Basic Hand Gestures**: +1
* **One-Handed Tool Use**: +2
* **Two-Handed Tool Use**: +3

The execution of Somatic components require a baseline freedom of movement; so they cannot be performed while under the [[Condition_Immobilized | Immobilized]] condition.

### Focal

The focal component can include the simple presence of a specific magical object as a focus. Naturalists are able to create and bind themselves to custom foci by crafting them from materials.

* **One-Handed Wand**: +1
* **Two-Handed Staff**: +2
* **Custom Focus**: +3

The execution of Focal components require touching and minor manipulation of the focus; the Disarm action can be used to try to remove the focus from a caster's hand.

-- TODO: potentially rethink Focal components.

### Scrolls

While not exactly a Component per se, Scrolls can be crafted by really powerful Arcanists that are able capture the essence of the immutable parts of instructions for a very specific effect. They can be used by any Arcane Spellcaster, but using them still requires figuring out the rest of the movements given the current state of the world (so they cannot be used by non-Casters). Heroes might often find specific scrolls written in the past during their adventures. Casting a Spell using a Scroll will provide a bonus to the Check, but the Scrolls are tied to very specific outcomes, and not customizable.

## Augmentations

Every spell is essentially a specialization of the Basic Arcane Spell, with a specific choice of School (Verb + Noun) and a set of augmentations depending on the desired effect. Each Augmentation will add either a positive or a negative modifier to the Check, to the discretion of the DM. Below some traditional augmentations are listed, but circumstances might require additional ones.

### Casting Time

The typical casting time of the Basic Arcane Spell is 2AP. The table below shows other options:

| AP | CM  |
|----|-----|
| 1  | -12 |
| 2  | 0   |
| 3  | +2  |
| 4  | +4  |

Extending the casting time over longer periods has severe diminishing returns, and would be impractical during an Encounter. When casting a Spell with no time sensitivity, the caster can choose to cast as a **Ritual**, taking 15 minutes for a maximum of +6 [[Circumstance_Modifier | CM]].

### Focus Cost

The typical focus cost of the Basic Arcane Spell is 1 [[Resource_Focus_Point | FP]]. Each additional [[Resource_Focus_Point | FP]] will add a +1 modifier, up to twice the number of [[Resource_Action_Point | AP]] used (one can't just cram that much focus into too little time). If the spell is being cast as a Ritual, there is no limit on the amount of [[Resource_Focus_Point | FP]] that can be spent.

### Duration

Depending on the the School, duration of the spell works in different ways:

* Conjuration: Creating matter is always instantaneous and permanent, requires no concentration after the fact. There is no Duration augmentation.
* Evocation: Creating energy is permanent, but energy naturally dissipates over time, depending on the amount. Concentration can be held to prevent dissipation, and Duration can be augmented to retard the decay. As a rule of thumb, dissipation over a few turns should be negligible; over 15 minutes should be noticeable.
* Transmutation: Transmuting matter can be either temporary or permanent; if temporary, it can be held with concentration, and extra modifiers can be added for lingering effect. For a +12, the transmutation can be made permanent.
* Transfiguration: Unlike inanimate matter, the body can never be altered permanently. Any changes are always temporary and require concentration to maintain, but a large modifier can be added to make it linger.
* Telekinesis/Command: Control spells always last as long as concentrating. There is no Duration augmentation.

### Range

The typical range of the Basic Arcane Spell is 1m (i.e. same hex or adjacent hex). This can be increased according to the following the following table (using Tax Brackets rules)

| Distance | Modifier |
|----------|----------|
| 2-5m     | +1/m     |
| 6-12m    | +2/m     |
| 13-24m   | +4/m     |

Larger than 24m ranges are impossibly heroic feats with DC to be determined by the DM.

### Area/Volume/Targets

Depending on the nature of the Spell, it might affect a certain area, volume or amount of beings (targets). The table below breaks down the typical effects of a Basic Arcane Spell and the augmentation costs:

| Effect Type | Basic Effect | Increment Cost |
|-------------|--------------|----------------|
| Area        | 1 Hex        | +4 / Hex       |
| Volume      | 1-10L        | +2 / Portion   |
| Target      | 1 Being      | +12 / Being    |

Note that the area and volume increment costs are merely linear approximations for _small areas and volumes_, for the benefit of the reader. Unreasonably larger effects the increment cost will become exponential (to DM discretion).

### Power/Material/Complexity/Specificity

There are endless other factors that would affect the spell's modifiers, such as material, composition, complexity, or specificity.

Some examples per School type of other Augmentations to consider are:

* Conjuration: the material, complexity and specificity of the matter being created; denser, rarer matter types, mixed with other things, or with specific shapes.
* Evocation: creating more powerful amounts of energy.
* Transmutation: the material, complexity and specificity of the matter being transformed; whether the material being transformed is mixed with others.
* Transfiguration: the complexity and specificity of the change.
* Telekinesis: speed, weight, and complexity of the movement pattern.
* Command: the complexity of the command.

While the Player can control the exact effect they aim to achieve, the DM has the final word on the DC of any given Spell.

## Predefined Spells

While a Caster can choose any effect within the realms of the Arcane, below is a list of predefined spells with predefined Spell DC making it easier for Players and DMs; they can both be used exactly as-is, or used to judge Spell DC by comparison.

Across all Schools, the Basic Arcane Spell takes **2 [[Resource_Action_Point | AP]]** and **1 [[Resource_Focus_Point | FP]]** to cast, with **Spell DC 15** (or contested if higher).

Some typical Augmentations for each are listed after the **Spell DC**; do note that every single spell can be Augmented by Range, which is the most common Augmentation, so that will not be included.

### Conjuration

The Conjuration Basic Arcane Spell can be used to create between 1-10L of simple, homogeneous, inorganic matter of a simple material (dirt, gravel, sand, weak rocks), within 1m of the Caster, in a space unoccupied (by solid matter or Beings), arranged in a vaguely, imprecise, contiguous spherical blob (or to fill an existing hole). Any fluid matter in the location will be displaced (therefore matter cannot be created in hermetically sealed containers).

The Caster must be familiar with the material being conjured; we can assume all Heroes are familiar with simple materials, water or other common matter. However, certain spell below will require the Caster to have been familiar with the specific matter being created.

#### Conjure Water

The Caster conjures 1L of pure water in an unoccupied space within 1m of them.
N.B.: with no other mineral/electrolyte intake, drinking exclusively pure water can start to cause side effects after a few days.
**Spell DC**: 18 (15 [Base DC] + 3 [Material: Water]).
**Volume Augmentation**:  +2 for each additional 1L of water created, up to 10L.

#### Rock Smash [Special Attack]

The Caster conjures a medium-sized (20L) boulder of weak rock above the target, within 1m, which can resist with an Evasiveness Check to avoid being hit by the falling debris, which causes 1[[Resource_Vitality_Point | VP]] of damage.
**Spell DC**: 18 (15 [Base DC] + 3 [Volume: 20L]).

#### Conjure Debris

The caster creates loose weak rocks, pebbles and/or gravel over 1 Hex, causing it to count as Difficult Terrain. The debris can be cleared gradually with 4 [[Resource_Action_Point | AP]] worth of actions.
**Spell DC**: 18 (15 [Base DC] + 3 [Volume: 20L]).

#### Poison Cloud [Special Attack]

The Caster conjures a 1m radius cloud of Noxious Gas in a Hex within 1m of them. The Hex _can_ be occupied by other creatures or objects, as the gas will be created around them.
As the gas disperses, it lose its potency after 3 rounds. Creating more gas on the same space will just dislodge the excess poison around.
**Noxious Gas**: A purple-ish toxic gas sometimes found in the Wilds; every creature at the end of turn must make a Resilience Check (DC 15 if passed through; DC 20 if they ended their turn within the cloud) or suffer 1[[Resource_Vitality_Point | VP]] of poison damage. If an incapacitated creature fails their check, they start to stack a Poisoned (1) Consequence.
**Requirements**: Caster must be familiar with Noxious Gas, having experienced it first hand at least once or studied it extensively.
**Spell DC**: 24 (15 [Base DC] + 8 [Material: Noxious Gas]).
**Area Augmentation**: +4 for each additional contiguous Hex of area.

### Evocation

The Evocation Basic Arcane Spell can be used to create a small amount of energy of a simple type (light, fire), in a space unoccupied (by solid matter or Beings; though it can be adjacent to inanimate objects, for example, it can set fire to a torch), within 1m of the Caster. The energy will dissipate over time (depending on the type of energy), and will spread/behave in its natural way (e.g. fire will spread to adjacent flammable objects, light will illuminate the area, etc.), but not otherwise move.

#### Evoke Light

The Caster evokes forth a harmless fist-sized ball of light, which will float in the air illuminating a 12m radius around it, lasting for at least 1 hour (as it fades). The Light is ethereal, and cannot be manipulated by physical means, though passing your hand through it will result in a slightly warm sensation. The Light can be moved and control with a subsequent cast of using Telekinesis.
**Spell DC**: 15 (Base DC).

#### Blinding Light [Special Attack]

The Caster evokes a momentary flash of bright light within 1m of them, potentially affecting any seeing creatures within a 4m radius.
The Caster and any creatures that were made aware of what was about to happen can Avert their gaze; other creatures must succeed an Agility Check against the Spell Check to do so.
Creatures who were unable to Avert their gaze take the [[Condition_Blinded | Blinded]] condition until the end of their next round.
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Greater Intensity]
**Area Augmentation**: +4 for each additional +1m of radius.

#### Evoke Fire [Basic Attack]

The Caster evokes a small flame, which can be used to ignite flammable objects, lasting for 1 turn, within 1m of them. While energy cannot be evoked within the same space as solid matter, it can be done so adjacently as to cause it to ignite. This can also be done offensively as a Stun or Feint Basic Body Attack as the enemy must avoid the small flame.
**Spell DC**: 15 (Base DC).
**Potency Augmentation**: +3 to produce a more intense flame, which can be used as a Strike Basic Body Attack.

### Transmutation

The Transmutation Basic Arcane Spell can be used to change the state of a small amount of matter, between 1-10L, within 1m of the Caster. The matter can be changed from one simple material to another (e.g. dirt to sand, gravel to pebbles), or be modified in its change or properties. Changing the physical state (solid, liquid, gas) is a more complex proposition. Other augmentations can be at play if trying to change specific parts, detailed aspects, or complex materials.

#### Mud Feet [Special Attack]

The Caster strategically transforms a small patch of ground underneath a target's feet (within 1m) into slimy mud. The target must check Evasiveness against the Spell Check or become [[Condition_Off_Guard | Off-Guard]]. A Shift will cause the target to become [[Condition_Prone | Prone]] instead.
**Spell DC**: 16 (15 [Base DC] + 1 [Material: Slimy Mud]).

#### Mend Object

The Caster can use Transmutation to mend a small tear in a simple solid object made of a simple material (e.g. a piece cloth or garment, a parchment or book, etc).
**Spell DC**: 27 (15 [Base DC] + 12 [Duration: Permanent]).

### Telekinesis

The Telekinesis Basic Arcane Spell can be used to impart motion up to 2kg of matter consistently but at moderate speeds, within the selected range (the object can be thrown outside the range but control is lost at that point). Telekinesis can be used to manipulate objects, such as doors or levers, but the required level of dexterity will add some Augmentation. While Beings cannot be directly imparted energy, the Caster can control the air around them to push or shove, in a however less effective and precise manner.

#### Mage Hand

While but the most studious Arcanists know why this spell is commonly referred to as "Mage Hand", all do know that this is in fact not any form of spectral hand, but rather a simple application of Telekinesis to manipulate small objects within 10m of the Caster. It can open doors, move items up to 2kg, pet a dog. Anything more dextrous will warrant Augmentations.
**Spell DC**: 20 (15 [Base DC] + 5 [Range: 10m (discounted)]).

#### Control Fire [Basic Attack]

The Caster can use Telekinesis to move around flames, potentially extinguishing very small fires, spreading to nearby materials, or propelling them onto a target within range. The basic cast is for 1m range, and can cause a Stun or Feint Basic Attack against the target. For a more forceful push of +6 Augmentation, it can be used as a Strike Basic Strike.
**Spell DC**: 15 (Base DC).

#### Magic Shove [Special Attack]

The Caster uses Telekinesis to control a gust of wind towards a target, shoving them back 1m. The target can resist with a Stance check. Shifts can be used to push the target further back, make them [[Condition_Prone | Prone]], or deal 1[[Resource_Vitality_Point | VP]] of damage.
**Spell DC**: 20 (15 [Base DC] + 5 [Potency: Greater Intensity]).

### Transfiguration

The Transfiguration Basic Arcane Spell can be used to change the body of a Being, within 1m of the Caster. The basic spell can cause superficial changes (e.g. changing hair color, creating calluses, deformities, or other minor changes), and anything more complex changes will require Augmentations. The changes are always temporary, and require Concentration to maintain. The target can choose wether to resist or not as they feel an external force molding their body.

#### Harden Fists

The Caster transfigures target's fists to be harder than normal, giving them a +3 bonus to their Unarmed Basic Body Attacks.
**Spell DC**: 15 (Base DC).

#### Harden Skin

The Caster transfigures target's skin to be harder than normal, giving them a +6 bonus to their [[Action_Shrug_Off | Shrug Off]] Toughness Checks.
**Spell DC**: 18 (15 [Base DC] + 3 [Area: Whole Body]).

#### Disguise Being

The Caster transfigures the facial appearance and features of a Being, within 1m of them, applying some physical deformations on an attempt to make them unrecognizable (making them look like someone else specifically would be much more difficult; also, they probably won't end up prettier than what they started as). The target can resist with a Toughness or Muscles Check. Creatures unaware of the disguise will need to roll an Awareness Check (or Perception if they have reason to doubt) against the Spell Check to recognize a person they are familiar with (of course they will get circumstantial modifiers if they know the person very well).
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Multiple Changes]).

#### Hideous Visage [Special Attack]

The Caster transfigures a desired surface-level aspect of a target's appearance (within 1m), making it hideous and slightly repulsive. The target can resist the transformation itself with a Toughness or Muscles Check. If successful, the target then must resist again with a Tenacity check or take 1SP and become Demoralized while transformed. Regardless of their self-perception, they will get a -6 CHA circumstantial penalty to any social task involving their appearance to others.
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Significant Change]).

### Command

The Command Basic Arcane Spell can be used to mentally tax a sentient Being's willpower, causing them to lose 1SP unless resist; or try to control simple beasts and plants. More Augmented casts can try to issue specific commands, and forcing them to do something fundamentally against their nature will require a very high DC.

#### Confuse Mind [Special Attack]

The Caster tries to mentally confuse a sentient Being's mind (within 1m), causing them to become [[Condition_Distracted | Distracted]] unless they resist with a Tenacity Check. Shifts can be used to cause [[Resource_Focus_Point | FP]] damage.
**Spell DC**: 15 (Base DC).

#### Erode Will [Special Attack]

The Caster tries to mentally tax a sentient Being's willpower (within 1m), causing them to lose 1[[Resource_Spirit_Point | SP]] unless they resist with a Resolve Check.
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Greater Intensity]).

#### Ensnare [Special Attack]

If on a suitable environment, the Caster can use Command to control vines or other plant matter on the floor to grow and try to Grapple or Trip a target (within 1m). The target can resist with an Evasiveness check.
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Greater Intensity]).

#### Message Being

The Caster can use Command to send a small (few words) message to a sentient Being (within 1m). The target can resist with a Resolve Check if desired. If they fail, they will hear the message as a command, but will not feel compelled to follow it.
**Spell DC**: 18 (15 [Base DC] + 3 [Detail: Specificity]).
**Length Augmentation**: Approximately +1 CM/word after 5 words (words are just being used as a proxy for complexity).

#### Command Being [Special Attack]

The Caster gives a simple single word command to a sentient Being (within 1m). The target can resist with a Resolve Check. If they fail, they will feel compelled to follow the command, as long as it doesn't go against their nature. The Being might interpret the command in their own way.
**Spell DC**: 20 for non sentient Beings (15 [Base DC] + 5 [Potency: Greater Intensity]); 30 for sentient Beings (15 [Base DC] + 15 [Potency: Multiple Changes]).

### Combined Spells

These spells are actually a combination of two Basic Arcane Spell casts, and therefore by default require 4[[Resource_Action_Point | AP]] (a whole turn) and 2[[Resource_Focus_Point | FP]] to cast. Since they are cast together, for simplicity, the Caster can roll a single Spell Check against the combined **Spell DC** specified.

#### Hurl Spikes [Special Attack]

The Caster conjures and then telekinetically throws a small amount of spikes and shards at a target within 10m. The target can resist with an Evasiveness Check, or become [[Condition_Off_Guard | Off-Guard]] and [[Condition_Distracted | Distracted]] if they fail. Shifts deal [[Resource_Vitality_Point | VP]] damage.
**Spell DC**: 15 (Base DC).

#### Energy Bolt [Basic Attack]

The Caster evokes a sphere of pure energy of their choice and use Telekinesis to hurl it towards an enemy within 10m with force; this can be used as a stronger Strike Basic Body Attack; on a success, you get an additional Shift of damage.
**Spell DC**: 18 (15 [Base DC] + 3 [Potency: Greater Intensity (for both the harmful Evoke and the forceful Telekinesis)]).

#### Prestidigitation

You use a combination of several Spells to create small effects used by magicians, in order to entertain or bemuse an audience. This is a whole turn action (4 AP) but can be sustained for more turns, paying 1 FP per turn.
**Spell DC**: 15 (Base DC).
