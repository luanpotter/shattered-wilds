export class Personality {
    calling;
    vice;
    aversion;
    tenet;
    leanings;
    protean;
    backstory;
    constructor({ calling, vice, aversion, tenet, leanings, protean, backstory, }) {
        this.calling = calling;
        this.vice = vice;
        this.aversion = aversion;
        this.tenet = tenet;
        this.leanings = leanings;
        this.protean = protean;
        this.backstory = backstory;
    }
    static from(props) {
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
    hasAny() {
        return !!(this.calling ||
            this.vice ||
            this.aversion ||
            this.tenet ||
            this.leanings ||
            this.protean ||
            this.backstory);
    }
}
export class Protean {
    name;
    connection;
    domains;
    constructor({ name, connection, domains, }) {
        this.name = name;
        this.connection = connection;
        this.domains = domains;
    }
    static fromProps(props) {
        const proteanName = parse(props, 'protean.name');
        if (!proteanName) {
            return undefined;
        }
        const connection = parse(props, 'protean.connection');
        const domains = JSON.parse(parse(props, 'protean.domains') ?? '[]');
        return new Protean({
            name: proteanName,
            connection,
            domains: domains.map(d => new ProteanDomain({ name: d.name, details: d.details })),
        });
    }
}
export class ProteanDomain {
    name;
    details;
    constructor({ name, details }) {
        this.name = name;
        this.details = details;
    }
}
const parse = (props, key) => {
    const value = props[key]?.trim();
    if (value === '' || value === undefined || value === null) {
        return undefined;
    }
    return value;
};
//# sourceMappingURL=personality.js.map