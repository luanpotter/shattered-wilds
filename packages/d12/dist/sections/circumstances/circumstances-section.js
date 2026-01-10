import { map, asc } from 'type-comparator';
import { Resource } from '../../stats/resources.js';
import { mapEnumToRecord } from '@shattered-wilds/commons';
export class CircumstancesSection {
    resources;
    conditions;
    consequences;
    otherCircumstances;
    constructor({ resources, conditions, consequences, otherCircumstances, }) {
        this.resources = resources;
        this.conditions = conditions;
        this.consequences = consequences;
        this.otherCircumstances = otherCircumstances;
    }
    static create({ characterSheet }) {
        const currentResources = characterSheet.circumstances.currentResources;
        const statTree = characterSheet.getStatTree();
        const resources = mapEnumToRecord(Resource, resource => currentResources.get(statTree, resource));
        const conditions = characterSheet.circumstances.conditions
            .sort(map(c => c.name, asc))
            .map(c => ({ condition: c.name, rank: c.rank }));
        const consequences = characterSheet.circumstances.consequences
            .sort(map(c => c.name, asc))
            .map(c => ({ consequence: c.name, rank: c.rank }));
        const otherCircumstances = characterSheet.circumstances.otherCircumstances;
        return new CircumstancesSection({
            resources,
            conditions,
            consequences,
            otherCircumstances,
        });
    }
    static serializeConditions(conditions) {
        return conditions.map(c => `${c.name}:${c.rank}`).join(',');
    }
    static serializeConsequences(consequences) {
        return consequences.map(c => `${c.name}:${c.rank}`).join(',');
    }
    static serializeOtherCircumstances(circumstances) {
        return circumstances.join('\n');
    }
}
//# sourceMappingURL=circumstances-section.js.map