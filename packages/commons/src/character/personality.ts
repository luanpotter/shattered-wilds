export class Personality {
	calling: string | undefined;
	vice: string | undefined;
	aversion: string | undefined;
	tenet: string | undefined;
	leanings: string | undefined;

	protean: Protean | undefined;
	backstory: string | undefined;

	constructor({
		calling,
		vice,
		aversion,
		tenet,
		leanings,
		protean,
		backstory,
	}: {
		calling: string | undefined;
		vice: string | undefined;
		aversion: string | undefined;
		tenet: string | undefined;
		leanings: string | undefined;
		protean: Protean | undefined;
		backstory: string | undefined;
	}) {
		this.calling = calling;
		this.vice = vice;
		this.aversion = aversion;
		this.tenet = tenet;
		this.leanings = leanings;
		this.protean = protean;
		this.backstory = backstory;
	}

	static from(props: Record<string, string>): Personality {
		return new Personality({
			calling: props['calling'],
			vice: props['vice'],
			aversion: props['aversion'],
			tenet: props['tenet'],
			leanings: props['leanings'],
			protean: Protean.fromProps(props),
			backstory: props['backstory'],
		});
	}
}

export class Protean {
	name: string;
	connection: string | undefined;
	domains: ProteanDomain[];

	constructor({
		name,
		connection,
		domains,
	}: {
		name: string;
		connection: string | undefined;
		domains: ProteanDomain[];
	}) {
		this.name = name;
		this.connection = connection;
		this.domains = domains;
	}

	static fromProps(props: Record<string, string>): Protean | undefined {
		const proteanName = props['protean.name'];
		if (!proteanName) {
			return undefined;
		}

		const connection = props['protean.connection'];
		const domains = JSON.parse(props['protean.domains'] || '[]') as { name: string; details?: string }[];

		return new Protean({
			name: proteanName,
			connection,
			domains: domains.map(d => new ProteanDomain({ name: d.name, details: d.details })),
		});
	}
}

export class ProteanDomain {
	name: string;
	details: string | undefined;

	constructor({ name, details }: { name: string; details: string | undefined }) {
		this.name = name;
		this.details = details;
	}
}
