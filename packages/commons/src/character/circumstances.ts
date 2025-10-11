import { Resource, ResourceValue } from '../stats/resources.js';
import { StatTree } from '../stats/stat-tree.js';

export class Circumstances {
	currentResources: CurrentResources;

	constructor({ currentResources }: { currentResources: CurrentResources }) {
		this.currentResources = currentResources;
	}

	static from(props: Record<string, string>): Circumstances {
		const currentResources = CurrentResources.from(props);

		return new Circumstances({ currentResources });
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
		const currentResources = Object.values(Resource).reduce(
			(acc, resource) => {
				acc[resource] = parse(props[resource]);
				return acc;
			},
			<Record<Resource, number>>{},
		);

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
