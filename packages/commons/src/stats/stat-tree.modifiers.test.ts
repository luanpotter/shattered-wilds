import { describe, it, expect } from 'vitest';
import {
	ClassRole,
	FEATS,
	FeatStatModifier,
	InherentModifier,
	Race,
	RACE_DEFINITIONS,
	StatTree,
	StatType,
} from '../index.js';

describe('StatTree', () => {
	describe('modifier calculation', () => {
		const compute = (values: Map<StatType, number>, modifiers: InherentModifier[] = []): Map<StatType, number> => {
			const props = Object.fromEntries(
				Array.from(values.entries()).map(([stat, value]) => [stat.name, value.toString()]),
			);
			const tree = StatTree.build(props, modifiers);
			const map = new Map<StatType, number>();
			for (const stat of StatType.values) {
				map.set(stat, tree.getModifier(stat).value.value);
			}
			return map;
		};

		const expectMap = (map: Map<StatType, number>, ...expected: [StatType, number][]) => {
			const visitedNodes = new Set<StatType>(StatType.values);
			for (const [stat, value] of expected) {
				expect(visitedNodes.delete(stat), `stat ${stat} was visited twice`).toBe(true);
				expect(map.get(stat), `stat ${stat} should be ${value}`).toBe(value);
			}
			expect(visitedNodes.size, `expected all stats to be visited, but ${visitedNodes.size} were not`).toBe(0);
		};

		const andBelow = (stat: StatType, value: number): Map<StatType, number> => {
			const map = new Map<StatType, number>();
			map.set(stat, value);
			for (const child of StatType.childrenOf(stat)) {
				for (const [key, childValue] of andBelow(child, value)) {
					map.set(key, childValue);
				}
			}
			return map;
		};

		const racialModifier = (race: Race): InherentModifier[] => {
			return RACE_DEFINITIONS[race].modifiers.map(m => FeatStatModifier.from(m).toModifier(FEATS.RacialModifier));
		};

		const classModifier = (role: ClassRole): InherentModifier[] => {
			return FEATS.ClassSpecialization.computeEffects(role)
				.filter(m => m instanceof FeatStatModifier)
				.map(m => m.toModifier(FEATS.ClassSpecialization));
		};

		it('level 0', () => {
			const values = new Map<StatType, number>();
			const map = compute(values);
			expectMap(map, ...andBelow(StatType.Level, 0));
		});

		it('level 0 - with race', () => {
			const values = new Map<StatType, number>();
			const modifiers = [...racialModifier(Race.Elf)];
			const map = compute(values, modifiers);
			expectMap(
				map,
				[StatType.Level, 0],
				[StatType.Body, 0],
				...andBelow(StatType.STR, 0),
				...andBelow(StatType.DEX, 1),
				...andBelow(StatType.CON, -1),
				...andBelow(StatType.Mind, 0),
				...andBelow(StatType.Soul, 0),
			);
		});

		it('level 1', () => {
			const values = new Map<StatType, number>([[StatType.Level, 1]]);
			const map = compute(values);
			expectMap(map, ...andBelow(StatType.Level, 1));
		});

		it('level 1 - with race and class', () => {
			const values = new Map<StatType, number>([[StatType.Level, 1]]);
			const modifiers = [...racialModifier(Race.Elf), ...classModifier(ClassRole.Ranged)];
			const map = compute(values, modifiers);
			expectMap(
				map,
				[StatType.Level, 1],
				[StatType.Body, 1],
				...andBelow(StatType.STR, 1),
				...andBelow(StatType.DEX, 3),
				...andBelow(StatType.CON, 0),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 2 - body', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 2],
				[StatType.Body, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				...andBelow(StatType.Body, 2),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 2 - mind', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 2],
				[StatType.Mind, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				...andBelow(StatType.Body, 1),
				...andBelow(StatType.Mind, 2),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 3 - body + soul', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 3],
				[StatType.Body, 1],
				[StatType.Soul, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				...andBelow(StatType.Body, 2),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 2),
			);
		});

		it('level 3 - body specialized', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 3],
				[StatType.Body, 2],
				[StatType.STR, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				[StatType.Body, 2],
				...andBelow(StatType.STR, 3),
				...andBelow(StatType.DEX, 2),
				...andBelow(StatType.CON, 2),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 4 - STR over-specialized - level cap', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 4],
				[StatType.Body, 3],
				[StatType.STR, 2],
				[StatType.Muscles, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				[StatType.Body, 3],
				[StatType.STR, 4], // should be 5 - level capped to 4
				[StatType.Muscles, 5],
				[StatType.Stance, 4],
				[StatType.Lift, 4],
				...andBelow(StatType.DEX, 3),
				...andBelow(StatType.CON, 3),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 4 - body STR + CON', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 4],
				[StatType.Body, 3],
				[StatType.STR, 1],
				[StatType.CON, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				[StatType.Body, 3],
				...andBelow(StatType.STR, 4),
				...andBelow(StatType.DEX, 3),
				...andBelow(StatType.CON, 4),
				...andBelow(StatType.Mind, 1),
				...andBelow(StatType.Soul, 1),
			);
		});

		it('level 4 - cross realm', () => {
			const values = new Map<StatType, number>([
				[StatType.Level, 4],
				[StatType.Body, 2],
				[StatType.STR, 1],
				[StatType.Mind, 2],
				[StatType.INT, 1],
				[StatType.Soul, 1],
			]);
			const map = compute(values);
			expectMap(
				map,
				[StatType.Level, 1],
				[StatType.Body, 2],
				...andBelow(StatType.STR, 3),
				...andBelow(StatType.DEX, 2),
				...andBelow(StatType.CON, 2),
				[StatType.Mind, 2],
				...andBelow(StatType.INT, 3),
				...andBelow(StatType.WIS, 2),
				...andBelow(StatType.CHA, 2),
				...andBelow(StatType.Soul, 2),
			);
		});
	});
});
