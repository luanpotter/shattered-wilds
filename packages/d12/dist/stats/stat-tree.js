import { DERIVED_STATS } from './derived-stat.js';
import { RESOURCES } from './resources.js';
import { StatHierarchy, StatHierarchyProperties, StatType } from './stat-type.js';
import { Bonus, Distance } from './value.js';
export var ModifierSource;
(function (ModifierSource) {
    ModifierSource["Feat"] = "Feat";
    ModifierSource["Equipment"] = "Equipment";
    ModifierSource["Component"] = "Component";
    ModifierSource["Augmentation"] = "Augmentation";
    ModifierSource["Circumstance"] = "Circumstance";
})(ModifierSource || (ModifierSource = {}));
export class CircumstanceModifier {
    source;
    name;
    value;
    constructor({ source, name, value }) {
        this.source = source;
        this.name = name;
        this.value = value;
    }
    get description() {
        return `${this.value.description} from ${this.source} ${this.name}`;
    }
    static fromJSON(data) {
        if (data instanceof CircumstanceModifier)
            return data;
        return new CircumstanceModifier({
            source: data.source,
            name: data.name,
            value: Bonus.fromJSON(data.value),
        });
    }
}
export class InherentModifier extends CircumstanceModifier {
    statType;
    constructor({ source, name, value, statType, }) {
        super({ source, name, value });
        this.statType = statType;
    }
    get description() {
        return `${this.value.description} ${this.statType} from ${this.source} ${this.name}`;
    }
}
export class StatTree {
    root;
    modifiers;
    constructor(root, modifiers) {
        this.root = root;
        this.modifiers = modifiers;
    }
    get level() {
        return this.root.points;
    }
    static build(props, modifiers) {
        const root = StatTree.buildRootNode(props);
        return new StatTree(root, modifiers);
    }
    static buildRootNode = (props = {}) => {
        const attr = (type, children = []) => {
            const parsed = parseInt(props[type.name] || '0', 10);
            const value = isNaN(parsed) ? 0 : parsed;
            return new StatNode(type, value, children);
        };
        return attr(StatType.Level, [
            attr(StatType.Body, [
                attr(StatType.STR, [attr(StatType.Muscles), attr(StatType.Stance), attr(StatType.Lift)]),
                attr(StatType.DEX, [attr(StatType.Finesse), attr(StatType.Evasiveness), attr(StatType.Agility)]),
                attr(StatType.CON, [attr(StatType.Toughness), attr(StatType.Stamina), attr(StatType.Resilience)]),
            ]),
            attr(StatType.Mind, [
                attr(StatType.INT, [attr(StatType.IQ), attr(StatType.Knowledge), attr(StatType.Memory)]),
                attr(StatType.WIS, [attr(StatType.Perception), attr(StatType.Awareness), attr(StatType.Intuition)]),
                attr(StatType.CHA, [attr(StatType.Speechcraft), attr(StatType.Presence), attr(StatType.Empathy)]),
            ]),
            attr(StatType.Soul, [
                attr(StatType.DIV, [attr(StatType.Devotion), attr(StatType.Aura), attr(StatType.Attunement)]),
                attr(StatType.FOW, [attr(StatType.Discipline), attr(StatType.Tenacity), attr(StatType.Resolve)]),
                attr(StatType.LCK, [attr(StatType.Fortune), attr(StatType.Karma), attr(StatType.Serendipity)]),
            ]),
        ]);
    };
    getApplicableModifiers(stat) {
        const doesModifierApplyToStat = (modifier, stat) => {
            if (!stat) {
                return false;
            }
            return modifier == stat || doesModifierApplyToStat(modifier, stat.parent);
        };
        return this.modifiers.filter(modifier => doesModifierApplyToStat(modifier.statType, stat));
    }
    getParentBaseModifier(node) {
        const parent = node.parent;
        if (!parent) {
            return Bonus.zero();
        }
        return this.getStatTypeModifier(parent.type).baseValue;
    }
    getSelfModifier(node) {
        const hierarchy = node.type.hierarchy;
        const properties = StatHierarchyProperties[hierarchy];
        const value = Math.ceil(node.points * properties.baseMultiplier);
        return new Bonus({ value });
    }
    getNode(stat) {
        const node = this.root.getNode(stat);
        if (!node) {
            throw new Error(`Stat type ${stat.name} not found in tree`);
        }
        return node;
    }
    getDistance(stat) {
        const modifier = this.getModifier(stat);
        const value = Distance.of(modifier.value.value);
        return { value, description: modifier.description };
    }
    getModifier(stat, cms = []) {
        if (stat instanceof StatType) {
            return this.getStatTypeModifier(stat, cms);
        }
        return this.getDerivedStatModifier(stat, cms);
    }
    getStatTypeModifier(stat, cms = []) {
        const node = this.getNode(stat);
        return this.getNodeModifier(node, cms);
    }
    getDerivedStatModifier(stat, cms = []) {
        const { value, tooltip } = this.computeDerivedStat(stat);
        const bonus = Bonus.of(value);
        const nonZeroCms = cms.filter(cm => cm.value.isNotZero);
        return new StatModifier({
            statType: stat,
            baseValue: bonus,
            appliedModifiers: nonZeroCms,
            value: Bonus.add([bonus, ...nonZeroCms.map(mod => mod.value)]),
            overrideDescription: tooltip,
        });
    }
    getNodeModifier(node, cms = []) {
        const parentValue = this.getParentBaseModifier(node);
        const selfValue = this.getSelfModifier(node);
        const baseValuePreCap = Bonus.add([selfValue, parentValue]);
        const wasLevelCapped = node.type.hierarchy !== StatHierarchy.Skill && baseValuePreCap.value > this.level;
        const baseValue = Bonus.of(wasLevelCapped ? this.level : baseValuePreCap.value);
        const appliedModifiers = [...this.getApplicableModifiers(node.type), ...cms].filter(mod => mod.value.isNotZero);
        const value = Bonus.add([baseValue, ...appliedModifiers.map(mod => mod.value)]);
        return new NodeStatModifier({
            statType: node.type,
            parentValue,
            selfValue,
            baseValuePreCap,
            wasLevelCapped,
            baseValue,
            appliedModifiers,
            value,
        });
    }
    computeDerivedStat(stat) {
        return DERIVED_STATS[stat].compute(this);
    }
    computeResource(resource) {
        return RESOURCES[resource].formula.compute(this);
    }
    valueOf(stat) {
        if (stat instanceof StatType) {
            return this.getModifier(stat).value;
        }
        const { value } = this.computeDerivedStat(stat);
        return new Bonus({ value });
    }
    fullReset() {
        // reset all nodes but the level
        return this.root.children.flatMap(child => child.resetNode());
    }
}
export class StatNode {
    type;
    points;
    children;
    parent = null;
    constructor(type, points = 0, children = []) {
        this.type = type;
        this.points = points;
        this.children = children;
        // Set parent references
        this.children.forEach(child => (child.parent = this));
    }
    get allocatablePoints() {
        if (this.children.length === 0) {
            return 0;
        }
        return Math.max(0, this.points - 1);
    }
    get allocatedPoints() {
        return this.children.reduce((sum, child) => sum + child.points, 0);
    }
    get unallocatedPoints() {
        return this.allocatablePoints - this.allocatedPoints;
    }
    get canChildrenAllocatePoint() {
        // Children can allocate if there are unallocated points to propagate
        // AND there are children to allocate to
        return this.unallocatedPoints > 0 && this.children.length > 0;
    }
    get canAllocatePoint() {
        return this.parent?.canChildrenAllocatePoint ?? true;
    }
    get canDeallocatePoint() {
        // Can deallocate if:
        // 1. This node has at least 1 point allocated, AND
        // 2. After deallocation, children won't exceed the new propagation limit
        if (this.points <= 0) {
            return false;
        }
        const newPoints = this.points - 1;
        const newAllocatablePoints = Math.max(0, newPoints - 1);
        return this.allocatedPoints <= newAllocatablePoints;
    }
    get childrenHaveUnallocatedPoints() {
        return this.hasUnallocatedPoints || this.children.some(child => child.childrenHaveUnallocatedPoints);
    }
    get hasUnallocatedPoints() {
        return this.unallocatedPoints > 0;
    }
    resetNode() {
        // Reset this node and all children to 0, return the prop updates needed
        const updates = [];
        // Reset this node to 0
        updates.push({ key: this.type.name, value: '0' });
        // Recursively reset all children
        for (const child of this.children) {
            updates.push(...child.resetNode());
        }
        return updates;
    }
    getNode(type) {
        if (type === undefined)
            return undefined;
        if (this.type === type) {
            return this;
        }
        for (const child of this.children) {
            const found = child.getNode(type);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
}
export class StatModifier {
    statType;
    baseValue;
    appliedModifiers;
    value;
    overrideDescription;
    constructor({ statType, baseValue, appliedModifiers, value, overrideDescription, }) {
        this.statType = statType;
        this.baseValue = baseValue;
        this.appliedModifiers = appliedModifiers;
        this.value = value;
        this.overrideDescription = overrideDescription;
    }
    get inherentModifier() {
        const inherentModifiers = Bonus.add(this.appliedModifiers.filter(mod => mod instanceof InherentModifier).map(e => e.value));
        return Bonus.add([this.baseValue, inherentModifiers]);
    }
    get name() {
        if (this.statType instanceof StatType) {
            return this.statType.name;
        }
        return this.statType;
    }
    get simpleDescription() {
        return `${this.name} = ${this.value.description}`;
    }
    get description() {
        if (this.overrideDescription) {
            return this.overrideDescription;
        }
        const breakdown = this.appliedModifiers.length > 0
            ? [
                `${this.baseValue.description} (${this.statType})`,
                ...this.appliedModifiers.map(mod => `[${mod.description}]`),
            ].join(' + ')
            : undefined;
        return `${this.simpleDescription}${breakdown ? ` (${breakdown})` : ''}`;
    }
    breakdown() {
        return [
            { name: this.name, value: this.baseValue.description },
            ...this.appliedModifiers.map(cm => ({ name: cm.name, value: cm.value.description })),
        ];
    }
    // NOTE: we typically try to build the check with all the modifiers it needs at once,
    // but this is used specifically if the user adds a CM on the "last mile" (i.e. on the Dice Roll dialog itself)
    withAdditionalCM(cm) {
        return new StatModifier({
            statType: this.statType,
            baseValue: this.baseValue,
            appliedModifiers: [...this.appliedModifiers, cm],
            value: Bonus.add([this.value, cm.value]),
            overrideDescription: this.overrideDescription,
        });
    }
    static fromJSON(data) {
        if (data instanceof StatModifier)
            return data;
        // Rehydrate statType
        let statType;
        if (data.statType instanceof StatType) {
            statType = data.statType;
        }
        else if (typeof data.statType === 'string') {
            // Could be a StatTypeName (from StatType.toJSON) or a DerivedStatType
            const foundStatType = StatType.values.find(s => s.name === data.statType);
            statType = foundStatType ?? data.statType;
        }
        else if ('name' in data.statType && typeof data.statType.name === 'string') {
            // It's a serialized StatType object, look it up by name
            statType = StatType.fromName(data.statType.name);
        }
        else {
            throw new Error('Unable to rehydrate statType');
        }
        return new StatModifier({
            statType,
            baseValue: Bonus.fromJSON(data.baseValue),
            appliedModifiers: data.appliedModifiers.map(cm => CircumstanceModifier.fromJSON(cm)),
            value: Bonus.fromJSON(data.value),
            overrideDescription: data.overrideDescription,
        });
    }
}
export class NodeStatModifier extends StatModifier {
    statType;
    parentValue;
    selfValue;
    baseValuePreCap;
    wasLevelCapped;
    constructor({ statType, parentValue, selfValue, baseValuePreCap, wasLevelCapped, baseValue, appliedModifiers, value, }) {
        super({ statType, baseValue, appliedModifiers, value });
        this.statType = statType;
        this.parentValue = parentValue;
        this.selfValue = selfValue;
        this.baseValuePreCap = baseValuePreCap;
        this.wasLevelCapped = wasLevelCapped;
    }
}
//# sourceMappingURL=stat-tree.js.map