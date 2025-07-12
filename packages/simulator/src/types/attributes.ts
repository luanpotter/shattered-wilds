import { AttributeType, AttributeHierarchy, AttributeHierarchyProperties, Modifier } from './core';

export class AttributeTree {
	root: Attribute;
	modifiers: Modifier[];

	constructor(root: Attribute, modifiers: Modifier[]) {
		this.root = root;
		this.modifiers = modifiers;
	}

	// level getter
	get level(): number {
		return this.root.baseValue;
	}

	// Check if a modifier applies to a particular node
	private isApplicableModifier(mod: Modifier, node: Attribute): boolean {
		// Find the path from the node to the root to see if mod.attributeType is in the hierarchy
		let current: Attribute | null = node;
		while (current) {
			if (current.type === mod.attributeType) {
				return true;
			}
			current = current.parent;
		}
		return false;
	}

	getApplicableModifiers(node: Attribute): Modifier[] {
		return this.modifiers.filter(mod => this.isApplicableModifier(mod, node));
	}

	getTotalModifierValue(node: Attribute): number {
		return this.getApplicableModifiers(node).reduce((sum, mod) => sum + mod.value, 0);
	}

	valueOf(type: AttributeType): number {
		const node = this.root.getNode(type);
		if (!node) {
			throw new Error(`Attribute type ${type.name} not found in tree`);
		}
		return this.getFinalModifier(node).value;
	}

	private getBaseModifier(node: Attribute): number {
		const hierarchy = node.type.hierarchy;
		const properties = AttributeHierarchyProperties[hierarchy];
		return Math.floor(node.nodeValue * properties.baseMultiplier);
	}

	private getParentModifier(node: Attribute): number {
		if (!node.parent) {
			return 0;
		}
		// For non-level nodes, we get the parent's final value
		// For the level node (root), there is no parent
		if (node.type === AttributeType.Level) {
			return 0;
		}
		return this.getFinalModifier(node.parent).value;
	}

	getFinalModifier(node: Attribute): AttributeValue {
		const baseModifier = this.getBaseModifier(node);
		const parentModifier = this.getParentModifier(node);
		const levelCap = this.level + 10;
		const modifiers = this.getApplicableModifiers(node);

		return new AttributeValue(parentModifier, node.nodeValue, baseModifier, levelCap, modifiers);
	}
}

export class Attribute {
	type: AttributeType;
	baseValue: number;
	children: Attribute[];
	parent: Attribute | null = null;

	constructor(type: AttributeType, baseValue: number = 0, children: Attribute[] = []) {
		this.type = type;
		this.baseValue = baseValue;
		this.children = children;
		// Set parent references
		this.children.forEach(child => (child.parent = this));
	}

	get totalPointsToPropagate(): number {
		// Every node reserves 1 point for itself, propagates the rest
		// e.g., value 2 can propagate 1 point, value 3 can propagate 2 points
		return Math.max(0, this.baseValue - 1 - this.childrenAllocatedPoints);
	}

	get childrenAllocatedPoints(): number {
		return this.children.reduce((sum, child) => sum + child.baseValue, 0);
	}

	get unallocatedPoints(): number {
		return this.totalPointsToPropagate;
	}

	get canChildrenAllocatePoint(): boolean {
		// Children can allocate if there are unallocated points to propagate
		// AND there are children to allocate to
		return this.unallocatedPoints > 0 && this.children.length > 0;
	}

	get canDeallocatePoint(): boolean {
		// Can deallocate if:
		// 1. This node has at least 1 point allocated, AND
		// 2. After deallocation, children won't exceed the new propagation limit
		if (this.baseValue <= 0) {
			return false;
		}

		// After deallocating 1 point: newBaseValue = baseValue - 1
		// New max for children = max(0, newBaseValue - 1) = max(0, baseValue - 2)
		const newMaxForChildren = Math.max(0, this.baseValue - 2);
		return this.childrenAllocatedPoints <= newMaxForChildren;
	}

	get nodeValue(): number {
		return this.baseValue;
	}

	hasUnallocatedPoints(): boolean {
		return this.unallocatedPoints > 0 || this.children.some(child => child.hasUnallocatedPoints());
	}

	reset(): { key: string; value: string }[] {
		// Reset this node and all children to 0, return the prop updates needed
		const updates: { key: string; value: string }[] = [];

		// Reset this node to 0
		updates.push({ key: this.type.name, value: '0' });

		// Recursively reset all children
		for (const child of this.children) {
			updates.push(...child.reset());
		}

		return updates;
	}

	getNode(type: AttributeType | null): Attribute | null {
		if (type === null) return null;
		if (this.type === type) {
			return this;
		}
		for (const child of this.children) {
			const found = child.getNode(type);
			if (found) {
				return found;
			}
		}
		return null;
	}

	grouped(hierarchy: AttributeHierarchy): Attribute[] {
		return this.children.filter(child => child.type.hierarchy === hierarchy);
	}
}

export class AttributeValue {
	parentValue?: number;
	nodeValue: number;
	nodeModifier: number;
	levelCap: number;
	modifiers: Modifier[];

	constructor(
		parentValue: number,
		nodeValue: number,
		nodeModifier: number,
		levelCap: number,
		modifiers: Modifier[]
	) {
		this.parentValue = parentValue;
		this.nodeValue = nodeValue;
		this.nodeModifier = nodeModifier;
		this.levelCap = levelCap;
		this.modifiers = modifiers;
	}

	get uncappedBaseValue(): number {
		return this.nodeModifier + (this.parentValue ?? 0);
	}

	get baseValue(): number {
		let baseValue = this.uncappedBaseValue;
		if (this.levelCap) {
			baseValue = Math.min(baseValue, this.levelCap);
		}
		return baseValue;
	}

	get modifierValue(): number {
		return this.modifiers.reduce((acc, mod) => acc + mod.value, 0);
	}

	get value(): number {
		return this.baseValue + this.modifierValue;
	}

	get wasLevelCapped(): boolean {
		if (this.levelCap == null) {
			return false;
		}
		return this.uncappedBaseValue > this.levelCap;
	}

	get hasModifiers(): boolean {
		return this.modifiers.length > 0;
	}
}

export const makeAttributeTree = (values: Record<string, string> = {}): Attribute => {
	const attr = (type: AttributeType, children: Attribute[] = []): Attribute => {
		const value = parseInt(values[type.name] ?? '0');
		return new Attribute(type, value, children);
	};

	return attr(AttributeType.Level, [
		attr(AttributeType.Body, [
			attr(AttributeType.STR, [
				attr(AttributeType.Muscles),
				attr(AttributeType.Stance),
				attr(AttributeType.Lift),
			]),
			attr(AttributeType.DEX, [
				attr(AttributeType.Finesse),
				attr(AttributeType.Evasiveness),
				attr(AttributeType.Agility),
			]),
			attr(AttributeType.CON, [
				attr(AttributeType.Toughness),
				attr(AttributeType.Stamina),
				attr(AttributeType.Resilience),
			]),
		]),
		attr(AttributeType.Mind, [
			attr(AttributeType.INT, [
				attr(AttributeType.IQ),
				attr(AttributeType.Knowledge),
				attr(AttributeType.Memory),
			]),
			attr(AttributeType.WIS, [
				attr(AttributeType.Perception),
				attr(AttributeType.Awareness),
				attr(AttributeType.Intuition),
			]),
			attr(AttributeType.CHA, [
				attr(AttributeType.Speechcraft),
				attr(AttributeType.Presence),
				attr(AttributeType.Empathy),
			]),
		]),
		attr(AttributeType.Soul, [
			attr(AttributeType.DIV, [
				attr(AttributeType.Revelation),
				attr(AttributeType.Attunement),
				attr(AttributeType.Devotion),
			]),
			attr(AttributeType.FOW, [
				attr(AttributeType.Discipline),
				attr(AttributeType.Tenacity),
				attr(AttributeType.Resolve),
			]),
			attr(AttributeType.LCK, [
				attr(AttributeType.Karma),
				attr(AttributeType.Fortune),
				attr(AttributeType.Serendipity),
			]),
		]),
	]);
};
