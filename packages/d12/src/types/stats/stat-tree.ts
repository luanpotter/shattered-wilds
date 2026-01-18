import { DERIVED_STATS, DerivedStatType } from './derived-stat.js';
import { FormulaResult } from './formula.js';
import { Resource, RESOURCES } from './resources.js';
import { StatHierarchy, StatHierarchyProperties, StatType, StatTypeName } from './stat-type.js';
import { Bonus, Distance } from './value.js';

export enum ModifierSource {
	Feat = 'Feat',
	Equipment = 'Equipment',
	Component = 'Component',
	Augmentation = 'Augmentation',
	Circumstance = 'Circumstance',
}

export class CircumstanceModifier {
	source: ModifierSource;
	name: string;
	value: Bonus;

	constructor({ source, name, value }: { source: ModifierSource; name: string; value: Bonus }) {
		this.source = source;
		this.name = name;
		this.value = value;
	}

	get description(): string {
		return `${this.value.description} from ${this.source} ${this.name}`;
	}

	static fromJSON(data: { source: ModifierSource; name: string; value: { value: number } }): CircumstanceModifier {
		if (data instanceof CircumstanceModifier) return data;
		return new CircumstanceModifier({
			source: data.source,
			name: data.name,
			value: Bonus.fromJSON(data.value),
		});
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
		value: Bonus;
		statType: StatType;
	}) {
		super({ source, name, value });
		this.statType = statType;
	}

	override get description(): string {
		return `${this.value.description} ${this.statType} from ${this.source} ${this.name}`;
	}
}

export class StatTree {
	root: StatNode;
	modifiers: InherentModifier[];

	constructor(root: StatNode, modifiers: InherentModifier[]) {
		this.root = root;
		this.modifiers = modifiers;
	}

	get level(): number {
		return this.root.points;
	}

	static build(props: Record<string, string>, modifiers: InherentModifier[]): StatTree {
		const root = StatTree.buildRootNode(props);
		return new StatTree(root, modifiers);
	}

	static buildRootNode = (props: Record<string, string> = {}): StatNode => {
		const attr = (type: StatType, children: StatNode[] = []): StatNode => {
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

	private getApplicableModifiers(stat: StatType): InherentModifier[] {
		const doesModifierApplyToStat = (modifier: StatType, stat: StatType | undefined): boolean => {
			if (!stat) {
				return false;
			}
			return modifier == stat || doesModifierApplyToStat(modifier, stat.parent);
		};
		return this.modifiers.filter(modifier => doesModifierApplyToStat(modifier.statType, stat));
	}

	private getParentBaseModifier(node: StatNode): Bonus {
		const parent = node.parent;
		if (!parent) {
			return Bonus.zero();
		}
		return this.getStatTypeModifier(parent.type).baseValue;
	}

	private getSelfModifier(node: StatNode): Bonus {
		const hierarchy = node.type.hierarchy;
		const properties = StatHierarchyProperties[hierarchy];
		const value = Math.ceil(node.points * properties.baseMultiplier);
		return new Bonus({ value });
	}

	getNode(stat: StatType): StatNode {
		const node = this.root.getNode(stat);
		if (!node) {
			throw new Error(`Stat type ${stat.name} not found in tree`);
		}
		return node;
	}

	getDistance(stat: DerivedStatType.InfluenceRange | DerivedStatType.Movement): {
		value: Distance;
		description: string;
	} {
		const modifier = this.getModifier(stat);
		const value = Distance.of(modifier.value.value);
		return { value, description: modifier.description };
	}

	getModifier(stat: StatType | DerivedStatType, cms: CircumstanceModifier[] = []): StatModifier {
		if (stat instanceof StatType) {
			return this.getStatTypeModifier(stat, cms);
		}
		return this.getDerivedStatModifier(stat, cms);
	}

	getStatTypeModifier(stat: StatType, cms: CircumstanceModifier[] = []): NodeStatModifier {
		const node = this.getNode(stat);
		return this.getNodeModifier(node, cms);
	}

	getDerivedStatModifier(stat: DerivedStatType, cms: CircumstanceModifier[] = []): StatModifier {
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

	getNodeModifier(node: StatNode, cms: CircumstanceModifier[] = []): NodeStatModifier {
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

	computeDerivedStat(stat: DerivedStatType): FormulaResult {
		return DERIVED_STATS[stat].compute(this);
	}

	computeResource(resource: Resource): FormulaResult {
		return RESOURCES[resource].formula.compute(this);
	}

	valueOf(stat: StatType | DerivedStatType): Bonus {
		if (stat instanceof StatType) {
			return this.getModifier(stat).value;
		}
		const { value } = this.computeDerivedStat(stat);
		return new Bonus({ value });
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

	toProps(): Record<string, string> {
		let props: Record<string, string> = {
			...(this.points !== 0 ? { [this.type.name]: String(this.points) } : {}),
		};
		for (const child of this.children) {
			props = { ...props, ...child.toProps() };
		}
		return props;
	}
}

export class StatModifier {
	statType: StatType | DerivedStatType;
	baseValue: Bonus;
	appliedModifiers: CircumstanceModifier[];
	value: Bonus;
	overrideDescription: string | undefined;

	constructor({
		statType,
		baseValue,
		appliedModifiers,
		value,
		overrideDescription,
	}: {
		statType: StatType | DerivedStatType;
		baseValue: Bonus;
		appliedModifiers: CircumstanceModifier[];
		value: Bonus;
		overrideDescription?: string | undefined;
	}) {
		this.statType = statType;
		this.baseValue = baseValue;
		this.appliedModifiers = appliedModifiers;
		this.value = value;
		this.overrideDescription = overrideDescription;
	}

	get inherentModifier(): Bonus {
		const inherentModifiers = Bonus.add(
			this.appliedModifiers.filter(mod => mod instanceof InherentModifier).map(e => e.value),
		);

		return Bonus.add([this.baseValue, inherentModifiers]);
	}

	get name(): StatTypeName | DerivedStatType {
		if (this.statType instanceof StatType) {
			return this.statType.name;
		}
		return this.statType;
	}

	get simpleDescription(): string {
		return `${this.name} = ${this.value.description}`;
	}

	get description(): string {
		if (this.overrideDescription) {
			return this.overrideDescription;
		}
		const breakdown =
			this.appliedModifiers.length > 0
				? [
						`${this.baseValue.description} (${this.statType})`,
						...this.appliedModifiers.map(mod => `[${mod.description}]`),
					].join(' + ')
				: undefined;
		return `${this.simpleDescription}${breakdown ? ` (${breakdown})` : ''}`;
	}

	breakdown(): { name: string; value: string }[] {
		return [
			{ name: this.name, value: this.baseValue.description },
			...this.appliedModifiers.map(cm => ({ name: cm.name, value: cm.value.description })),
		];
	}

	// NOTE: we typically try to build the check with all the modifiers it needs at once,
	// but this is used specifically if the user adds a CM on the "last mile" (i.e. on the Dice Roll dialog itself)
	withAdditionalCM(cm: CircumstanceModifier): StatModifier {
		return new StatModifier({
			statType: this.statType,
			baseValue: this.baseValue,
			appliedModifiers: [...this.appliedModifiers, cm],
			value: Bonus.add([this.value, cm.value]),
			overrideDescription: this.overrideDescription,
		});
	}

	static fromJSON(data: {
		statType: StatType | DerivedStatType | string | { name: string };
		baseValue: { value: number };
		appliedModifiers: { source: ModifierSource; name: string; value: { value: number } }[];
		value: { value: number };
		overrideDescription?: string | undefined;
	}): StatModifier {
		if (data instanceof StatModifier) return data;

		// Rehydrate statType
		let statType: StatType | DerivedStatType;
		if (data.statType instanceof StatType) {
			statType = data.statType;
		} else if (typeof data.statType === 'string') {
			// Could be a StatTypeName (from StatType.toJSON) or a DerivedStatType
			const foundStatType = StatType.values.find(s => s.name === data.statType);
			statType = foundStatType ?? (data.statType as DerivedStatType);
		} else if ('name' in data.statType && typeof data.statType.name === 'string') {
			// It's a serialized StatType object, look it up by name
			statType = StatType.fromName(data.statType.name as StatTypeName);
		} else {
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
	override statType: StatType;
	parentValue: Bonus;
	selfValue: Bonus;
	baseValuePreCap: Bonus;
	wasLevelCapped: boolean;

	constructor({
		statType,
		parentValue,
		selfValue,
		baseValuePreCap,
		wasLevelCapped,
		baseValue,
		appliedModifiers,
		value,
	}: {
		statType: StatType;
		parentValue: Bonus;
		selfValue: Bonus;
		baseValuePreCap: Bonus;
		wasLevelCapped: boolean;
		baseValue: Bonus;
		appliedModifiers: CircumstanceModifier[];
		value: Bonus;
	}) {
		super({ statType, baseValue, appliedModifiers, value });
		this.statType = statType;
		this.parentValue = parentValue;
		this.selfValue = selfValue;
		this.baseValuePreCap = baseValuePreCap;
		this.wasLevelCapped = wasLevelCapped;
	}
}
