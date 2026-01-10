import { F, RoundMode } from './formula.js';
import { StatType } from './stat-type.js';
export var DerivedStatType;
(function (DerivedStatType) {
    DerivedStatType["Movement"] = "Movement";
    DerivedStatType["Initiative"] = "Initiative";
    DerivedStatType["InfluenceRange"] = "InfluenceRange";
})(DerivedStatType || (DerivedStatType = {}));
export class DerivedStat {
    type;
    name;
    description;
    formula;
    constructor({ type, name, description, formula, }) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.formula = formula;
    }
    compute(statTree) {
        return this.formula.compute(statTree);
    }
}
export const DERIVED_STATS = {
    [DerivedStatType.Movement]: new DerivedStat({
        type: DerivedStatType.Movement,
        name: 'Movement',
        description: `The amount of hexes a character can move using a regular [[Stride]] action.

> Movement = [3 + floor([[Agility]] / 4)] hexes

This determines how many hexes a character can move in a single turn.

All movement forms can move at least 1 hex, regardless of the character's calculated movement speed.`,
        formula: F.constant(3).add(F.variable(0.25, StatType.Agility, RoundMode.floor)),
    }),
    [DerivedStatType.Initiative]: new DerivedStat({
        type: DerivedStatType.Initiative,
        name: 'Initiative',
        description: `Used to determine order in combat via an Initiative Check.

> Initiative = [[Awareness]] + [[Agility]]

The Initiative Check is a special type of [[Contested Check]] that is fully resisted. As a courtesy to the _Players_, ties are decided in their favor.`,
        formula: F.variable(1, StatType.Awareness).add(F.variable(1, StatType.Agility)),
    }),
    [DerivedStatType.InfluenceRange]: new DerivedStat({
        type: DerivedStatType.InfluenceRange,
        name: 'Influence Range',
        description: `The range increment of your influence; used for the [Arcane](/rules/arcane) and [Divine](/rules/divine) systems.

> Influence Range = [2 + ceil([[Aura]] / 2)] hexes

This determines the first **Range Increment** for your influence.`,
        formula: F.constant(2).add(F.variable(0.5, StatType.Aura, RoundMode.ceil)),
    }),
};
//# sourceMappingURL=derived-stat.js.map