import { describe, expect, it } from 'vitest';
import { StatTree, StatType } from '../index.js';

describe('StatTree', () => {
	describe('point allocation', () => {
		it('level 0', () => {
			const tree = StatTree.build({}, []);

			for (const stat of StatType.values) {
				const node = tree.getNode(stat);
				expect(node.points).toBe(0);
				expect(node.allocatablePoints).toBe(0);
				expect(node.allocatedPoints).toBe(0);
				expect(node.unallocatedPoints).toBe(0);
				expect(node.canChildrenAllocatePoint).toBe(false);
				expect(node.canDeallocatePoint).toBe(false);
				expect(node.hasUnallocatedPoints).toBe(false);

				const modifier = tree.getStatTypeModifier(stat);
				expect(modifier.parentValue.value).toBe(0);
				expect(modifier.selfValue.value).toBe(0);
				expect(modifier.baseValue.value).toBe(0);
				expect(modifier.appliedModifiers).toEqual([]);
				expect(modifier.value.value).toBe(0);
			}
		});
		it('level 1', () => {
			// for level 1, there is no propagation or options
			const values = {
				Level: '1',
			};
			const tree = StatTree.build(values, []);

			const levelNode = tree.getNode(StatType.Level);
			expect(levelNode.points).toBe(1);
			expect(levelNode.allocatablePoints).toBe(0);
			expect(levelNode.allocatedPoints).toBe(0);
			expect(levelNode.unallocatedPoints).toBe(0);
			expect(levelNode.canChildrenAllocatePoint).toBe(false);
			expect(levelNode.canDeallocatePoint).toBe(true);
			expect(levelNode.hasUnallocatedPoints).toBe(false);

			const levelModifier = tree.getStatTypeModifier(StatType.Level);
			expect(levelModifier.parentValue.value).toBe(0);
			expect(levelModifier.selfValue.value).toBe(1);
			expect(levelModifier.baseValue.value).toBe(1);
			expect(levelModifier.appliedModifiers).toEqual([]);
			expect(levelModifier.value.value).toBe(1);

			for (const stat of StatType.values.filter(stat => stat != StatType.Level)) {
				const node = tree.getNode(stat);
				expect(node.points).toBe(0);
				expect(node.allocatablePoints).toBe(0);
				expect(node.allocatedPoints).toBe(0);
				expect(node.unallocatedPoints).toBe(0);
				expect(node.canChildrenAllocatePoint).toBe(false);
				expect(node.canDeallocatePoint).toBe(false);
				expect(node.hasUnallocatedPoints).toBe(false);

				const modifier = tree.getStatTypeModifier(stat);
				expect(modifier.parentValue.value).toBe(1);
				expect(modifier.selfValue.value).toBe(0);
				expect(modifier.baseValue.value).toBe(1);
				expect(modifier.appliedModifiers).toEqual([]);
				expect(modifier.value.value).toBe(1);
			}
		});
	});

	it('level 2 - missing allocation', () => {
		const values = {
			Level: '2',
		};
		const tree = StatTree.build(values, []);

		const levelNode = tree.getNode(StatType.Level);
		expect(levelNode.points).toBe(2);
		expect(levelNode.allocatablePoints).toBe(1);
		expect(levelNode.allocatedPoints).toBe(0);
		expect(levelNode.unallocatedPoints).toBe(1);
		expect(levelNode.canChildrenAllocatePoint).toBe(true);
		expect(levelNode.canDeallocatePoint).toBe(true);
		expect(levelNode.hasUnallocatedPoints).toBe(true);

		for (const stat of StatType.values) {
			expect(tree.getModifier(stat).value.value).toBe(1);
		}
	});

	it('level 2 - body', () => {
		const values = {
			Level: '2',
			Body: '1',
		};
		const tree = StatTree.build(values, []);

		const levelNode = tree.getNode(StatType.Level);
		expect(levelNode.points).toBe(2);
		expect(levelNode.allocatablePoints).toBe(1);
		expect(levelNode.allocatedPoints).toBe(1);
		expect(levelNode.unallocatedPoints).toBe(0);
		expect(levelNode.canChildrenAllocatePoint).toBe(false);
		expect(levelNode.canDeallocatePoint).toBe(false);
		expect(levelNode.hasUnallocatedPoints).toBe(false);

		const bodyNode = tree.getNode(StatType.Body);
		expect(bodyNode.points).toBe(1);
		expect(bodyNode.allocatablePoints).toBe(0);
		expect(bodyNode.allocatedPoints).toBe(0);
		expect(bodyNode.unallocatedPoints).toBe(0);
		expect(bodyNode.canChildrenAllocatePoint).toBe(false);
		expect(bodyNode.canDeallocatePoint).toBe(true);
		expect(bodyNode.hasUnallocatedPoints).toBe(false);

		const bodyModifier = tree.getStatTypeModifier(StatType.Body);
		expect(bodyModifier.parentValue.value).toBe(1);
		expect(bodyModifier.selfValue.value).toBe(1);
		expect(bodyModifier.baseValue.value).toBe(2);
		expect(bodyModifier.appliedModifiers).toEqual([]);
		expect(bodyModifier.value.value).toBe(2);

		const strNode = tree.getNode(StatType.STR);
		expect(strNode.points).toBe(0);
		const strModifier = tree.getStatTypeModifier(StatType.STR);
		expect(strModifier.parentValue.value).toBe(2);
		expect(strModifier.selfValue.value).toBe(0);
		expect(strModifier.baseValue.value).toBe(2);
		expect(strModifier.appliedModifiers).toEqual([]);
		expect(strModifier.value.value).toBe(2);

		const mindNode = tree.getNode(StatType.Mind);
		expect(mindNode.points).toBe(0);
		const mindModifier = tree.getStatTypeModifier(StatType.Mind);
		expect(mindModifier.parentValue.value).toBe(1);
		expect(mindModifier.selfValue.value).toBe(0);
		expect(mindModifier.baseValue.value).toBe(1);
		expect(mindModifier.appliedModifiers).toEqual([]);
		expect(mindModifier.value.value).toBe(1);
	});

	it('level 3 - spread', () => {
		const values = {
			Level: '3',
			Body: '1',
			Mind: '1',
		};
		const tree = StatTree.build(values, []);

		const levelNode = tree.getNode(StatType.Level);
		expect(levelNode.points).toBe(3);
		expect(levelNode.allocatablePoints).toBe(2);
		expect(levelNode.allocatedPoints).toBe(2);
		expect(levelNode.unallocatedPoints).toBe(0);
		expect(levelNode.canChildrenAllocatePoint).toBe(false);
		expect(levelNode.canDeallocatePoint).toBe(false);
		expect(levelNode.hasUnallocatedPoints).toBe(false);

		const bodyNode = tree.getNode(StatType.Body);
		expect(bodyNode.points).toBe(1);
		expect(bodyNode.allocatablePoints).toBe(0);
		expect(bodyNode.allocatedPoints).toBe(0);
		expect(bodyNode.unallocatedPoints).toBe(0);
		expect(bodyNode.canChildrenAllocatePoint).toBe(false);
		expect(bodyNode.canDeallocatePoint).toBe(true);
		expect(bodyNode.hasUnallocatedPoints).toBe(false);

		const bodyModifier = tree.getStatTypeModifier(StatType.Body);
		expect(bodyModifier.parentValue.value).toBe(1);
		expect(bodyModifier.selfValue.value).toBe(1);
		expect(bodyModifier.baseValue.value).toBe(2);
		expect(bodyModifier.appliedModifiers).toEqual([]);
		expect(bodyModifier.value.value).toBe(2);

		for (const stat of StatType.childrenOf(StatType.Body)) {
			const node = tree.getNode(stat);
			expect(node.points).toBe(0);
			expect(node.allocatablePoints).toBe(0);
			expect(node.allocatedPoints).toBe(0);
			expect(node.unallocatedPoints).toBe(0);
		}

		const mindNode = tree.getNode(StatType.Mind);
		expect(mindNode.points).toBe(1);
		expect(mindNode.allocatablePoints).toBe(0);
		expect(mindNode.allocatedPoints).toBe(0);
		expect(mindNode.unallocatedPoints).toBe(0);
		expect(mindNode.canChildrenAllocatePoint).toBe(false);
		expect(mindNode.canDeallocatePoint).toBe(true);

		const mindModifier = tree.getStatTypeModifier(StatType.Mind);
		expect(mindModifier.parentValue.value).toBe(1);
		expect(mindModifier.selfValue.value).toBe(1);
		expect(mindModifier.baseValue.value).toBe(2);
		expect(mindModifier.appliedModifiers).toEqual([]);
		expect(mindModifier.value.value).toBe(2);

		for (const stat of StatType.childrenOf(StatType.Mind)) {
			const node = tree.getNode(stat);
			expect(node.points).toBe(0);
			expect(node.allocatablePoints).toBe(0);
			expect(node.allocatedPoints).toBe(0);
			expect(node.unallocatedPoints).toBe(0);
		}

		const soulNode = tree.getNode(StatType.Soul);
		expect(soulNode.points).toBe(0);
		expect(soulNode.allocatablePoints).toBe(0);
		expect(soulNode.allocatedPoints).toBe(0);
		expect(soulNode.unallocatedPoints).toBe(0);
		expect(soulNode.canChildrenAllocatePoint).toBe(false);
		expect(soulNode.canDeallocatePoint).toBe(false);
		expect(soulNode.hasUnallocatedPoints).toBe(false);

		const soulModifier = tree.getStatTypeModifier(StatType.Soul);
		expect(soulModifier.parentValue.value).toBe(1);
		expect(soulModifier.selfValue.value).toBe(0);
		expect(soulModifier.baseValue.value).toBe(1);
		expect(soulModifier.appliedModifiers).toEqual([]);
		expect(soulModifier.value.value).toBe(1);

		for (const stat of StatType.childrenOf(StatType.Soul)) {
			const node = tree.getNode(stat);
			expect(node.points).toBe(0);
			expect(node.allocatablePoints).toBe(0);
			expect(node.allocatedPoints).toBe(0);
			expect(node.unallocatedPoints).toBe(0);
		}
	});

	it('level 3 - specialized', () => {
		const values = {
			Level: '3',
			Body: '2',
			DEX: '1',
		};
		const tree = StatTree.build(values, []);

		const levelNode = tree.getNode(StatType.Level);
		expect(levelNode.points).toBe(3);
		expect(levelNode.allocatablePoints).toBe(2);
		expect(levelNode.allocatedPoints).toBe(2);
		expect(levelNode.unallocatedPoints).toBe(0);
		expect(levelNode.canChildrenAllocatePoint).toBe(false);
		expect(levelNode.canDeallocatePoint).toBe(false);
		expect(levelNode.hasUnallocatedPoints).toBe(false);

		const bodyNode = tree.getNode(StatType.Body);
		expect(bodyNode.points).toBe(2);
		expect(bodyNode.allocatablePoints).toBe(1);
		expect(bodyNode.allocatedPoints).toBe(1);
		expect(bodyNode.unallocatedPoints).toBe(0);
		expect(bodyNode.canChildrenAllocatePoint).toBe(false);
		expect(bodyNode.canDeallocatePoint).toBe(false);
		expect(bodyNode.hasUnallocatedPoints).toBe(false);

		const bodyModifier = tree.getStatTypeModifier(StatType.Body);
		expect(bodyModifier.parentValue.value).toBe(1);
		expect(bodyModifier.selfValue.value).toBe(1);
		expect(bodyModifier.baseValue.value).toBe(2);
		expect(bodyModifier.appliedModifiers).toEqual([]);
		expect(bodyModifier.value.value).toBe(2);

		const strNode = tree.getNode(StatType.STR);
		expect(strNode.points).toBe(0);
		const strModifier = tree.getStatTypeModifier(StatType.STR);
		expect(strModifier.parentValue.value).toBe(2);
		expect(strModifier.selfValue.value).toBe(0);
		expect(strModifier.baseValue.value).toBe(2);
		expect(strModifier.appliedModifiers).toEqual([]);
		expect(strModifier.value.value).toBe(2);

		const dexNode = tree.getNode(StatType.DEX);
		expect(dexNode.points).toBe(1);
		expect(dexNode.allocatablePoints).toBe(0);
		expect(dexNode.allocatedPoints).toBe(0);
		expect(dexNode.unallocatedPoints).toBe(0);
		expect(dexNode.canChildrenAllocatePoint).toBe(false);
		expect(dexNode.canDeallocatePoint).toBe(true);

		const mindNode = tree.getNode(StatType.Mind);
		expect(mindNode.points).toBe(0);
		const mindModifier = tree.getStatTypeModifier(StatType.Mind);
		expect(mindModifier.parentValue.value).toBe(1);
		expect(mindModifier.selfValue.value).toBe(0);
		expect(mindModifier.baseValue.value).toBe(1);
		expect(mindModifier.appliedModifiers).toEqual([]);
		expect(mindModifier.value.value).toBe(1);
	});

	it('level 3 - not allocated', () => {
		const values = {
			Level: '3',
			Body: '1',
		};
		const tree = StatTree.build(values, []);

		const levelNode = tree.getNode(StatType.Level);
		expect(levelNode.points).toBe(3);
		expect(levelNode.allocatablePoints).toBe(2);
		expect(levelNode.allocatedPoints).toBe(1);
		expect(levelNode.unallocatedPoints).toBe(1);
		expect(levelNode.canChildrenAllocatePoint).toBe(true);
		expect(levelNode.canDeallocatePoint).toBe(true);
		expect(levelNode.hasUnallocatedPoints).toBe(true);
	});
});
