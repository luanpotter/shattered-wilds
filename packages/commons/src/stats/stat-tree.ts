import { DERIVED_STATS, DerivedStatType } from './derived-stat.js';
import { FormulaResult } from './formula.js';
import { Resource, RESOURCES } from './resources.js';
import { StatHierarchyProperties, StatType } from './stat-type.js';

export enum ModifierSource {
	Feat = 'Feat',
	Equipment = 'Equipment',
	Size = 'Size',
	Circumstance = 'Circumstance',
}

// TODO(luan): create Bonus class
export const modifierToString = (value: number): string => {
	const sign = value >= 0 ? '+' : '-';
	return `${sign}${Math.abs(value)}`;
};

export class CircumstanceModifier {
	source: ModifierSource;
	name: string;
	value: number;

	constructor({ source, name, value }: { source: ModifierSource; name: string; value: number }) {
		this.source = source;
		this.name = name;
		this.value = value;
	}

	get bonusString(): string {
		return modifierToString(this.value);
	}

	get description(): string {
		return `${this.bonusString} from ${this.source} ${this.name}`;
	}
}

export class InherentModifier extends CircumstanceModifier {
	statType: StatType;

	constructor({
		source,
		name,
		value,
		statType,
	}: {
		source: ModifierSource;
		name: string;
		value: number;
		statType: StatType;
	}) {
		super({ source, name, value });
		this.statType = statType;
	}

	override get description(): string {
		return `${this.bonusString} ${this.statType} from ${this.source} ${this.name}`;
	}
}

export class StatTree {
	root: StatNode;
	modifiers: InherentModifier[];

	constructor(root: StatNode, modifiers: InherentModifier[]) {
		this.root = root;
		this.modifiers = modifiers;
	}

	static build(props: Record<string, string>, modifiers: InherentModifier[]): StatTree {
		const root = StatTree.buildRootNode(props);
		return new StatTree(root, modifiers);
	}

	static buildRootNode = (props: Record<string, string> = {}): StatNode => {
		const attr = (type: StatType, children: StatNode[] = []): StatNode => {
			const value = parseInt(props[type.name] ?? '0');
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
				attr(StatType.DIV, [attr(StatType.Revelation), attr(StatType.Attunement), attr(StatType.Devotion)]),
				attr(StatType.FOW, [attr(StatType.Discipline), attr(StatType.Tenacity), attr(StatType.Resolve)]),
				attr(StatType.LCK, [attr(StatType.Karma), attr(StatType.Fortune), attr(StatType.Serendipity)]),
			]),
		]);
	};

	private getApplicableModifiers(stat: StatType): InherentModifier[] {
		return this.modifiers.filter(mod => mod.statType === stat);
	}

	private getParentModifier(node: StatNode): number {
		const parent = node.parent;
		if (!parent) {
			return 0;
		}
		return this.getModifier(parent.type).value;
	}

	private getSelfModifier(node: StatNode): number {
		const hierarchy = node.type.hierarchy;
		const properties = StatHierarchyProperties[hierarchy];
		return Math.ceil(node.points * properties.baseMultiplier);
	}

	getNode(stat: StatType): StatNode {
		const node = this.root.getNode(stat);
		if (!node) {
			throw new Error(`Stat type ${stat.name} not found in tree`);
		}
		return node;
	}

	getModifier(stat: StatType, cms: CircumstanceModifier[] = []): StatModifier {
		const node = this.getNode(stat);
		return this.getNodeModifier(node, cms);
	}

	getNodeModifier(node: StatNode, cms: CircumstanceModifier[] = []): StatModifier {
		const parentValue = this.getParentModifier(node);
		const selfValue = this.getSelfModifier(node);
		const baseValue = selfValue + parentValue;
		const appliedModifiers = [...this.getApplicableModifiers(node.type), ...cms];
		const value = baseValue + appliedModifiers.reduce((sum, mod) => sum + mod.value, 0);
		return new StatModifier({
			statType: node.type,
			parentValue,
			selfValue,
			baseValue,
			appliedModifiers,
			value,
		});
	}

	computeDerivedStat(stat: DerivedStatType): FormulaResult {
		return DERIVED_STATS[stat].compute(this);
	}

	computeResource(resource: Resource): FormulaResult {
		return RESOURCES[resource].formula.compute(this);
	}

	valueOf(stat: StatType | DerivedStatType): number {
		if (stat instanceof StatType) {
			return this.getModifier(stat).value;
		}
		return this.computeDerivedStat(stat).value;
	}

	fullReset(): { key: string; value: string }[] {
		// reset all nodes but the level
		return this.root.children.flatMap(child => child.resetNode());
	}
}

export class StatNode {
	type: StatType;
	points: number;
	children: StatNode[];
	parent: StatNode | null = null;

	constructor(type: StatType, points: number = 0, children: StatNode[] = []) {
		this.type = type;
		this.points = points;
		this.children = children;
		// Set parent references
		this.children.forEach(child => (child.parent = this));
	}

	get allocatablePoints(): number {
		if (this.children.length === 0) {
			return 0;
		}
		return Math.max(0, this.points - 1);
	}

	get allocatedPoints(): number {
		return this.children.reduce((sum, child) => sum + child.points, 0);
	}

	get unallocatedPoints(): number {
		return this.allocatablePoints - this.allocatedPoints;
	}

	get canChildrenAllocatePoint(): boolean {
		// Children can allocate if there are unallocated points to propagate
		// AND there are children to allocate to
		return this.unallocatedPoints > 0 && this.children.length > 0;
	}

	get canAllocatePoint(): boolean {
		return this.parent?.canChildrenAllocatePoint ?? true;
	}

	get canDeallocatePoint(): boolean {
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

	get childrenHaveUnallocatedPoints(): boolean {
		return this.hasUnallocatedPoints || this.children.some(child => child.childrenHaveUnallocatedPoints);
	}

	get hasUnallocatedPoints(): boolean {
		return this.unallocatedPoints > 0;
	}

	resetNode(): { key: string; value: string }[] {
		// Reset this node and all children to 0, return the prop updates needed
		const updates: { key: string; value: string }[] = [];

		// Reset this node to 0
		updates.push({ key: this.type.name, value: '0' });

		// Recursively reset all children
		for (const child of this.children) {
			updates.push(...child.resetNode());
		}

		return updates;
	}

	getNode(type: StatType | undefined): StatNode | undefined {
		if (type === undefined) return undefined;
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
	statType: StatType;
	parentValue: number;
	selfValue: number;
	baseValue: number;
	appliedModifiers: CircumstanceModifier[];
	value: number;

	constructor({
		statType,
		parentValue,
		selfValue,
		baseValue,
		appliedModifiers,
		value,
	}: {
		statType: StatType;
		parentValue: number;
		selfValue: number;
		baseValue: number;
		appliedModifiers: CircumstanceModifier[];
		value: number;
	}) {
		this.statType = statType;
		this.parentValue = parentValue;
		this.selfValue = selfValue;
		this.baseValue = baseValue;
		this.appliedModifiers = appliedModifiers;
		this.value = value;
	}

	get inherentModifier(): number {
		const inherentModifiers = this.appliedModifiers
			.filter(mod => mod instanceof InherentModifier)
			.reduce((sum, mod) => sum + mod.value, 0);
		return this.baseValue + inherentModifiers;
	}

	get inherentModifierString(): string {
		return modifierToString(this.inherentModifier);
	}

	get baseValueString(): string {
		return modifierToString(this.baseValue);
	}

	get valueString(): string {
		return modifierToString(this.value);
	}

	get description(): string {
		const breakdown =
			this.appliedModifiers.length > 0
				? [`${this.baseValue} (${this.statType})`, ...this.appliedModifiers.map(mod => `[${mod.description}]`)].join(
						' + ',
					)
				: undefined;
		return `${this.statType.name} = ${this.value}${breakdown ? ` (${breakdown})` : ''}`;
	}
}
