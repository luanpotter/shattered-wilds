import { DerivedStatType } from './derived-stat.js';
import { FormulaResult } from './formula.js';
import { Resource } from './resources.js';
import { StatType, StatTypeName } from './stat-type.js';
import { Bonus, Distance } from './value.js';
export declare enum ModifierSource {
    Feat = "Feat",
    Equipment = "Equipment",
    Component = "Component",
    Augmentation = "Augmentation",
    Circumstance = "Circumstance"
}
export declare class CircumstanceModifier {
    source: ModifierSource;
    name: string;
    value: Bonus;
    constructor({ source, name, value }: {
        source: ModifierSource;
        name: string;
        value: Bonus;
    });
    get description(): string;
    static fromJSON(data: {
        source: ModifierSource;
        name: string;
        value: {
            value: number;
        };
    }): CircumstanceModifier;
}
export declare class InherentModifier extends CircumstanceModifier {
    statType: StatType;
    constructor({ source, name, value, statType, }: {
        source: ModifierSource;
        name: string;
        value: Bonus;
        statType: StatType;
    });
    get description(): string;
}
export declare class StatTree {
    root: StatNode;
    modifiers: InherentModifier[];
    constructor(root: StatNode, modifiers: InherentModifier[]);
    get level(): number;
    static build(props: Record<string, string>, modifiers: InherentModifier[]): StatTree;
    static buildRootNode: (props?: Record<string, string>) => StatNode;
    private getApplicableModifiers;
    private getParentBaseModifier;
    private getSelfModifier;
    getNode(stat: StatType): StatNode;
    getDistance(stat: DerivedStatType.InfluenceRange | DerivedStatType.Movement): {
        value: Distance;
        description: string;
    };
    getModifier(stat: StatType | DerivedStatType, cms?: CircumstanceModifier[]): StatModifier;
    getStatTypeModifier(stat: StatType, cms?: CircumstanceModifier[]): NodeStatModifier;
    getDerivedStatModifier(stat: DerivedStatType, cms?: CircumstanceModifier[]): StatModifier;
    getNodeModifier(node: StatNode, cms?: CircumstanceModifier[]): NodeStatModifier;
    computeDerivedStat(stat: DerivedStatType): FormulaResult;
    computeResource(resource: Resource): FormulaResult;
    valueOf(stat: StatType | DerivedStatType): Bonus;
    fullReset(): {
        key: string;
        value: string;
    }[];
}
export declare class StatNode {
    type: StatType;
    points: number;
    children: StatNode[];
    parent: StatNode | null;
    constructor(type: StatType, points?: number, children?: StatNode[]);
    get allocatablePoints(): number;
    get allocatedPoints(): number;
    get unallocatedPoints(): number;
    get canChildrenAllocatePoint(): boolean;
    get canAllocatePoint(): boolean;
    get canDeallocatePoint(): boolean;
    get childrenHaveUnallocatedPoints(): boolean;
    get hasUnallocatedPoints(): boolean;
    resetNode(): {
        key: string;
        value: string;
    }[];
    getNode(type: StatType | undefined): StatNode | undefined;
}
export declare class StatModifier {
    statType: StatType | DerivedStatType;
    baseValue: Bonus;
    appliedModifiers: CircumstanceModifier[];
    value: Bonus;
    overrideDescription: string | undefined;
    constructor({ statType, baseValue, appliedModifiers, value, overrideDescription, }: {
        statType: StatType | DerivedStatType;
        baseValue: Bonus;
        appliedModifiers: CircumstanceModifier[];
        value: Bonus;
        overrideDescription?: string | undefined;
    });
    get inherentModifier(): Bonus;
    get name(): StatTypeName | DerivedStatType;
    get simpleDescription(): string;
    get description(): string;
    breakdown(): {
        name: string;
        value: string;
    }[];
    withAdditionalCM(cm: CircumstanceModifier): StatModifier;
    static fromJSON(data: {
        statType: StatType | DerivedStatType | string | {
            name: string;
        };
        baseValue: {
            value: number;
        };
        appliedModifiers: {
            source: ModifierSource;
            name: string;
            value: {
                value: number;
            };
        }[];
        value: {
            value: number;
        };
        overrideDescription?: string | undefined;
    }): StatModifier;
}
export declare class NodeStatModifier extends StatModifier {
    statType: StatType;
    parentValue: Bonus;
    selfValue: Bonus;
    baseValuePreCap: Bonus;
    wasLevelCapped: boolean;
    constructor({ statType, parentValue, selfValue, baseValuePreCap, wasLevelCapped, baseValue, appliedModifiers, value, }: {
        statType: StatType;
        parentValue: Bonus;
        selfValue: Bonus;
        baseValuePreCap: Bonus;
        wasLevelCapped: boolean;
        baseValue: Bonus;
        appliedModifiers: CircumstanceModifier[];
        value: Bonus;
    });
}
//# sourceMappingURL=stat-tree.d.ts.map