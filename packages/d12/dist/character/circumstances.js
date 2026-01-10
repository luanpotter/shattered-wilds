import { mapEnumToRecord } from '@shattered-wilds/commons';
import { Consequence, Exhaustion } from '../core/consequences.js';
import { Resource } from '../stats/resources.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
export class Circumstances {
    currentResources;
    conditions;
    consequences;
    otherCircumstances;
    constructor({ currentResources, conditions, consequences, otherCircumstances, }) {
        this.currentResources = currentResources;
        this.conditions = conditions;
        this.consequences = consequences;
        this.otherCircumstances = otherCircumstances ?? [];
    }
    applyCircumstanceModifiers(statModifier) {
        // TODO: implement other circumstances; for now, we will only consider Exhaustion
        const exhaustionRank = this.consequences.find(c => c.name === Consequence.Exhaustion)?.rank ?? 0;
        const exhaustionBonus = Exhaustion.fromRank(exhaustionRank).bonus;
        if (exhaustionBonus == null || exhaustionBonus.isZero) {
            return statModifier;
        }
        const exhaustionModifier = new CircumstanceModifier({
            source: ModifierSource.Circumstance,
            name: `Exhaustion (${exhaustionRank})`,
            value: exhaustionBonus,
        });
        return statModifier.withAdditionalCM(exhaustionModifier);
    }
    static parse(prop) {
        return (prop ?? '')
            .split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0)
            .map(c => (c.includes(':') ? c.split(':', 2) : [c, '0']))
            .map(([c, r]) => ({ name: c, rank: parseInt(r) || 0 }));
    }
    static from(props) {
        const currentResources = CurrentResources.from(props);
        const conditions = Circumstances.parse(props.conditions ?? '');
        const consequences = Circumstances.parse(props.consequences ?? '');
        const otherCircumstances = (props.otherCircumstances ?? '')
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0);
        return new Circumstances({ currentResources, conditions, consequences, otherCircumstances });
    }
}
export class CurrentResources {
    currentResources;
    constructor(currentResources) {
        this.currentResources = currentResources;
    }
    static MAX_VALUE = -1;
    static from(props) {
        const parse = (value) => {
            return value ? parseInt(value) : CurrentResources.MAX_VALUE;
        };
        const currentResources = mapEnumToRecord(Resource, resource => parse(props[resource]));
        return new CurrentResources(currentResources);
    }
    getCurrentValue(resource) {
        return this.currentResources[resource];
    }
    get(statTree, resource) {
        const max = statTree.computeResource(resource).value;
        const current = this.getCurrentValue(resource);
        return {
            resource,
            current: current === CurrentResources.MAX_VALUE ? max : current,
            max,
        };
    }
}
//# sourceMappingURL=circumstances.js.map