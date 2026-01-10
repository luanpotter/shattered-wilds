import { Formula } from './formula.js';
export declare enum Resource {
    HeroismPoint = "HeroismPoint",
    VitalityPoint = "VitalityPoint",
    FocusPoint = "FocusPoint",
    SpiritPoint = "SpiritPoint",
    ActionPoint = "ActionPoint"
}
export declare class ResourceCost {
    resource: Resource;
    amount: number;
    variable: boolean;
    constructor({ resource, amount, variable }: {
        resource: Resource;
        amount: number;
        variable?: boolean;
    });
    get resourceDefinition(): ResourceDefinition;
    get shortDescription(): string;
    get longDescription(): string;
}
export declare class ResourceDefinition {
    key: Resource;
    fullName: string;
    shortName: string;
    shortCode: string;
    description: string;
    color: string;
    formula: Formula;
    constructor({ key, fullName, shortName, shortCode, description, color, formula, }: {
        key: Resource;
        fullName: string;
        shortName: string;
        shortCode: string;
        description: string;
        color: string;
        formula: Formula;
    });
}
export interface ResourceValue {
    resource: Resource;
    current: number;
    max: number;
}
export declare const RESOURCES: Record<Resource, ResourceDefinition>;
//# sourceMappingURL=resources.d.ts.map