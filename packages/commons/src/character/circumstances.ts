import { Condition } from '../core/conditions.js';
import { Consequence, Exhaustion } from '../core/consequences.js';
import { Resource, ResourceValue } from '../stats/resources.js';
import { CircumstanceModifier, ModifierSource, StatModifier, StatTree } from '../stats/stat-tree.js';
import { mapEnumToRecord } from '../utils/utils.js';

export type AppliedCircumstance<T> = {
	name: T;
	rank: number;
};

export class Circumstances {
	currentResources: CurrentResources;
	conditions: AppliedCircumstance<Condition>[];
	consequences: AppliedCircumstance<Consequence>[];
	otherCircumstances: string[];

	constructor({
		currentResources,
		conditions,
		consequences,
		otherCircumstances,
	}: {
		currentResources: CurrentResources;
		conditions: AppliedCircumstance<Condition>[];
		consequences: AppliedCircumstance<Consequence>[];
		otherCircumstances: string[];
	}) {
		this.currentResources = currentResources;
		this.conditions = conditions;
		this.consequences = consequences;
		this.otherCircumstances = otherCircumstances ?? [];
	}

	applyCircumstanceModifiers(statModifier: StatModifier): StatModifier {
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

	static parse<T>(prop: string | undefined): AppliedCircumstance<T>[] {
		return (prop ?? '')
			.split(',')
			.map(c => c.trim())
			.filter(c => c.length > 0)
			.map(c => (c.includes(':') ? (c.split(':', 2) as [string, string]) : ([c, '0'] as const)))
			.map(([c, r]) => ({ name: c as T, rank: parseInt(r) || 0 }));
	}

	static from(props: Record<string, string>): Circumstances {
		const currentResources = CurrentResources.from(props);
		const conditions = Circumstances.parse<Condition>(props.conditions ?? '');
		const consequences = Circumstances.parse<Consequence>(props.consequences ?? '');
		const otherCircumstances = (props.otherCircumstances ?? '')
			.split('\n')
			.map(c => c.trim())
			.filter(c => c.length > 0);

		return new Circumstances({ currentResources, conditions, consequences, otherCircumstances });
	}
}

export class CurrentResources {
	currentResources: Record<Resource, number>;

	constructor(currentResources: Record<Resource, number>) {
		this.currentResources = currentResources;
	}

	static MAX_VALUE = -1;

	static from(props: Record<string, string>): CurrentResources {
		const parse = (value?: string): number => {
			return value ? parseInt(value) : CurrentResources.MAX_VALUE;
		};
		const currentResources = mapEnumToRecord(Resource, resource => parse(props[resource]));

		return new CurrentResources(currentResources);
	}

	private getCurrentValue(resource: Resource): number {
		return this.currentResources[resource];
	}

	get(statTree: StatTree, resource: Resource): ResourceValue {
		const max = statTree.computeResource(resource).value;
		const current = this.getCurrentValue(resource);
		return {
			resource,
			current: current === CurrentResources.MAX_VALUE ? max : current,
			max,
		};
	}
}
