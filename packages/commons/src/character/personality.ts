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
			calling: parse(props, 'calling'),
			vice: parse(props, 'vice'),
			aversion: parse(props, 'aversion'),
			tenet: parse(props, 'tenet'),
			leanings: parse(props, 'leanings'),
			protean: Protean.fromProps(props),
			backstory: parse(props, 'backstory'),
		});
	}

	hasAny(): boolean {
		return !!(
			this.calling ||
			this.vice ||
			this.aversion ||
			this.tenet ||
			this.leanings ||
			this.protean ||
			this.backstory
		);
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
		const proteanName = parse(props, 'protean.name');
		if (!proteanName) {
			return undefined;
		}

		const connection = parse(props, 'protean.connection');
		const domains = JSON.parse(parse(props, 'protean.domains') ?? '[]') as {
			name: string;
			details?: string;
		}[];

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

const parse = (props: Record<string, string>, key: string): string | undefined => {
	const value = props[key]?.trim();
	if (value === '' || value === undefined || value === null) {
		return undefined;
	}
	return value;
};
