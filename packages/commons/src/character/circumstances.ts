import { Condition } from '../core/conditions.js';
import { Resource, ResourceValue } from '../stats/resources.js';
import { StatTree } from '../stats/stat-tree.js';
import { isEnumValue, mapEnumToRecord } from '../utils/utils.js';

export class Circumstances {
	currentResources: CurrentResources;
	exhaustionRank: number;
	conditions: Condition[];

	constructor({
		currentResources,
		exhaustionRank,
		conditions,
	}: {
		currentResources: CurrentResources;
		exhaustionRank: number;
		conditions: Condition[];
	}) {
		this.currentResources = currentResources;
		this.exhaustionRank = exhaustionRank;
		this.conditions = conditions;
	}

	static from(props: Record<string, string>): Circumstances {
		const currentResources = CurrentResources.from(props);
		const exhaustionRank = parseInt(props.exhaustionRank ?? '0') ?? 0;
		const conditions = (props.conditions ?? '')
			.split(',')
			.map(c => c.trim())
			.filter(c => c.length > 0)
			.filter(isEnumValue(Condition));

		return new Circumstances({ currentResources, exhaustionRank, conditions });
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
