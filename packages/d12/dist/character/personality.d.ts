export declare class Personality {
    calling: string | undefined;
    vice: string | undefined;
    aversion: string | undefined;
    tenet: string | undefined;
    leanings: string | undefined;
    protean: Protean | undefined;
    backstory: string | undefined;
    constructor({ calling, vice, aversion, tenet, leanings, protean, backstory, }: {
        calling: string | undefined;
        vice: string | undefined;
        aversion: string | undefined;
        tenet: string | undefined;
        leanings: string | undefined;
        protean: Protean | undefined;
        backstory: string | undefined;
    });
    static from(props: Record<string, string>): Personality;
    hasAny(): boolean;
}
export declare class Protean {
    name: string;
    connection: string | undefined;
    domains: ProteanDomain[];
    constructor({ name, connection, domains, }: {
        name: string;
        connection: string | undefined;
        domains: ProteanDomain[];
    });
    static fromProps(props: Record<string, string>): Protean | undefined;
}
export declare class ProteanDomain {
    name: string;
    details: string | undefined;
    constructor({ name, details }: {
        name: string;
        details: string | undefined;
    });
}
//# sourceMappingURL=personality.d.ts.map