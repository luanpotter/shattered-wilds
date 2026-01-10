import { Size } from './size.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';
export var Race;
(function (Race) {
    Race["Human"] = "Human";
    Race["Elf"] = "Elf";
    Race["Dwarf"] = "Dwarf";
    Race["Orc"] = "Orc";
    Race["Fey"] = "Fey";
    Race["Goliath"] = "Goliath";
    Race["Goblin"] = "Goblin";
})(Race || (Race = {}));
export var Upbringing;
(function (Upbringing) {
    Upbringing["Urban"] = "Urban";
    Upbringing["Nomadic"] = "Nomadic";
    Upbringing["Tribal"] = "Tribal";
    Upbringing["Sylvan"] = "Sylvan";
    Upbringing["Telluric"] = "Telluric";
})(Upbringing || (Upbringing = {}));
export const UPBRINGING_DEFINITIONS = {
    [Upbringing.Urban]: {
        name: Upbringing.Urban,
        description: 'This character lived their childhood in a medium-sized village or town (much larger cities are extremely rare and hard to find). **Human** and **Elven** communities are often **Urban**.',
    },
    [Upbringing.Nomadic]: {
        name: Upbringing.Nomadic,
        description: `This character grew up as a nomad, traveling in a small party, family or group venturing through the Wilds (either you'd need to have had strong members to protect you, or somehow have a reason you managed to survive on your own). They are somewhat familiar with the ways of the Wilds. **Human** (often by choice to fulfill their dreams of exploration), **Orc** and **Goblin** (often neglected by their peers or other races) are often **Nomadic**.

A typical scenario is a small group of low-level adventurers, that eventually have (or encounter) a child, and now must find a way to raise them until they can find the next safe village to drop them off (which can be rare to find depending on where they are).`,
    },
    [Upbringing.Tribal]: {
        name: Upbringing.Tribal,
        description: `This character grew up in a settlement with a strong tribal structure, with hierarchies and clans. **Dwarven**, **Fey** and **Goliath** communities are often **Tribal**.`,
    },
    [Upbringing.Sylvan]: {
        name: Upbringing.Sylvan,
        description: `This character grew up in very small settlement embedded deep within the woods. **Elven**, **Fey**, and **Goblin** communities are often **Sylvan**.`,
    },
    [Upbringing.Telluric]: {
        name: Upbringing.Telluric,
        description: `This character grew up in a cave-dwelling settlement, deep within cave systems. **Dwarven**, **Orc** and **Goliath** communities are often **Telluric**.`,
    },
};
export const RACE_DEFINITIONS = {
    [Race.Human]: {
        name: Race.Human,
        modifiers: [],
        size: Size.M,
        typicalUpbringings: [Upbringing.Urban, Upbringing.Nomadic],
    },
    [Race.Elf]: {
        name: Race.Elf,
        modifiers: [
            { statType: StatType.DEX, value: Bonus.of(1) },
            { statType: StatType.CON, value: Bonus.of(-1) },
        ],
        size: Size.M,
        typicalUpbringings: [Upbringing.Urban, Upbringing.Sylvan],
    },
    [Race.Dwarf]: {
        name: Race.Dwarf,
        modifiers: [
            { statType: StatType.CON, value: Bonus.of(1) },
            { statType: StatType.DEX, value: Bonus.of(-1) },
        ],
        size: Size.S,
        typicalUpbringings: [Upbringing.Tribal, Upbringing.Telluric],
    },
    [Race.Orc]: {
        name: Race.Orc,
        modifiers: [
            { statType: StatType.STR, value: Bonus.of(1) },
            { statType: StatType.DEX, value: Bonus.of(-1) },
        ],
        size: Size.L,
        typicalUpbringings: [Upbringing.Nomadic, Upbringing.Telluric],
    },
    [Race.Fey]: {
        name: Race.Fey,
        modifiers: [
            { statType: StatType.DEX, value: Bonus.of(1) },
            { statType: StatType.STR, value: Bonus.of(-1) },
        ],
        size: Size.S,
        typicalUpbringings: [Upbringing.Tribal, Upbringing.Sylvan],
    },
    [Race.Goliath]: {
        name: Race.Goliath,
        modifiers: [
            { statType: StatType.STR, value: Bonus.of(1) },
            { statType: StatType.CON, value: Bonus.of(-1) },
        ],
        size: Size.L,
        typicalUpbringings: [Upbringing.Tribal, Upbringing.Telluric],
    },
    [Race.Goblin]: {
        name: Race.Goblin,
        modifiers: [
            { statType: StatType.CON, value: Bonus.of(1) },
            { statType: StatType.STR, value: Bonus.of(-1) },
        ],
        size: Size.S,
        typicalUpbringings: [Upbringing.Nomadic, Upbringing.Sylvan],
    },
};
//# sourceMappingURL=races.js.map