import { describe, it, expect } from 'vitest';
import { StatNode, StatTree, StatType } from '../types.js';

describe('StatTree', () => {
	describe('buildRootNode', () => {
		it('should create a tree with all 40 stat nodes', () => {
			const tree = StatTree.buildRootNode();

			// Count all nodes by traversing the tree
			const countNodes = (node: StatNode): number => {
				return 1 + node.children.reduce((sum: number, child: StatNode) => sum + countNodes(child), 0);
			};

			const totalNodes = countNodes(tree);

			// 1 Level + 3 Realms + 9 Attributes + 27 Skills = 40 total nodes
			expect(totalNodes).toBe(40);
		});

		it('should have Level as the root node', () => {
			const tree = StatTree.buildRootNode();

			expect(tree.type).toBe(StatType.Level);
			expect(tree.parent).toBe(null);
		});

		it('should have 3 realm children under Level', () => {
			const tree = StatTree.buildRootNode();

			expect(tree.children).toHaveLength(3);
			expect(tree.children.map(child => child.type)).toEqual([StatType.Body, StatType.Mind, StatType.Soul]);
		});

		it('should have 3 attributes under each realm', () => {
			const tree = StatTree.buildRootNode();

			// Body realm should have STR, DEX, CON
			const bodyRealm = tree.children.find(child => child.type === StatType.Body);
			expect(bodyRealm?.children).toHaveLength(3);
			expect(bodyRealm?.children.map(child => child.type)).toEqual([StatType.STR, StatType.DEX, StatType.CON]);

			// Mind realm should have INT, WIS, CHA
			const mindRealm = tree.children.find(child => child.type === StatType.Mind);
			expect(mindRealm?.children).toHaveLength(3);
			expect(mindRealm?.children.map(child => child.type)).toEqual([StatType.INT, StatType.WIS, StatType.CHA]);

			// Soul realm should have DIV, FOW, LCK
			const soulRealm = tree.children.find(child => child.type === StatType.Soul);
			expect(soulRealm?.children).toHaveLength(3);
			expect(soulRealm?.children.map(child => child.type)).toEqual([StatType.DIV, StatType.FOW, StatType.LCK]);
		});

		it('should have 3 skills under each attribute', () => {
			const tree = StatTree.buildRootNode();

			// Find STR attribute and check its skills
			const bodyRealm = tree.children.find(child => child.type === StatType.Body);
			const strAttribute = bodyRealm?.children.find(child => child.type === StatType.STR);

			expect(strAttribute?.children).toHaveLength(3);
			expect(strAttribute?.children.map(child => child.type)).toEqual([
				StatType.Muscles,
				StatType.Stance,
				StatType.Lift,
			]);
		});

		it('should initialize all nodes with base value 0 by default', () => {
			const tree = StatTree.buildRootNode();

			// Check that Level starts with 0
			expect(tree.points).toBe(0);

			// Check that all children also start with 0
			const checkAllNodes = (node: StatNode): void => {
				expect(node.points).toBe(0);
				node.children.forEach(checkAllNodes);
			};

			tree.children.forEach(checkAllNodes);
		});

		it('should set values from the provided values object', () => {
			const values = {
				Level: '5',
				STR: '3',
				Muscles: '2',
			};

			const tree = StatTree.buildRootNode(values);

			expect(tree.points).toBe(5);

			const bodyRealm = tree.children.find(child => child.type === StatType.Body);
			const strAttribute = bodyRealm?.children.find(child => child.type === StatType.STR);
			const musclesSkill = strAttribute?.children.find(child => child.type === StatType.Muscles);

			expect(strAttribute?.points).toBe(3);
			expect(musclesSkill?.points).toBe(2);
		});

		it('should properly set parent references', () => {
			const tree = StatTree.buildRootNode();

			// Check that Level has no parent
			expect(tree.parent).toBe(null);

			// Check that realms have Level as parent
			tree.children.forEach(realm => {
				expect(realm.parent).toBe(tree);

				// Check that attributes have realm as parent
				realm.children.forEach(attribute => {
					expect(attribute.parent).toBe(realm);

					// Check that skills have attribute as parent
					attribute.children.forEach(skill => {
						expect(skill.parent).toBe(attribute);
					});
				});
			});
		});

		it('values and childrenOf', () => {
			expect(StatType.values.length).toBe(40);
			expect(StatType.childrenOf(StatType.Level)).toEqual([StatType.Body, StatType.Mind, StatType.Soul]);
			expect(StatType.childrenOf(StatType.Body)).toEqual([StatType.STR, StatType.DEX, StatType.CON]);
			expect(StatType.childrenOf(StatType.STR)).toEqual([StatType.Muscles, StatType.Stance, StatType.Lift]);
		});
	});
});
