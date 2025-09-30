import { describe, it, expect } from 'vitest';
import { mapEnumToRecord, getRecordKeys } from './utils.js';

describe('mapEnumToRecord', () => {
	it('should map all enum values to a record', () => {
		enum TestEnum {
			First = 'first',
			Second = 'second',
			Third = 'third',
		}
		const mapper = (enumValue: TestEnum) => `mapped-${enumValue}`;

		const result = mapEnumToRecord(TestEnum, mapper);

		expect(result).toEqual({
			[TestEnum.First]: 'mapped-first',
			[TestEnum.Second]: 'mapped-second',
			[TestEnum.Third]: 'mapped-third',
		});
		expect(Object.keys(result)).toHaveLength(3);
		expect(result[TestEnum.First]).toBe('mapped-first');
		expect(result[TestEnum.Second]).toBe('mapped-second');
		expect(result[TestEnum.Third]).toBe('mapped-third');
	});
});

describe('getRecordKeys', () => {
	it('should return type-safe keys for a record with enum keys', () => {
		enum TestEnum {
			Alpha = 'alpha',
			Beta = 'beta',
			Gamma = 'gamma',
		}
		const record: Record<TestEnum, string> = {
			[TestEnum.Alpha]: 'value-alpha',
			[TestEnum.Beta]: 'value-beta',
			[TestEnum.Gamma]: 'value-gamma',
		};

		const keys = getRecordKeys(record);

		expect(keys).toHaveLength(3);
		expect(keys).toContain(TestEnum.Alpha);
		expect(keys).toContain(TestEnum.Beta);
		expect(keys).toContain(TestEnum.Gamma);
		expect(keys.sort()).toEqual([TestEnum.Alpha, TestEnum.Beta, TestEnum.Gamma].sort());
	});
});
