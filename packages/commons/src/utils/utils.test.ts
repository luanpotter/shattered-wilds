import { describe, it, expect } from 'vitest';
import {
	mapEnumToRecord,
	getRecordKeys,
	numberToOrdinal,
	firstParagraph,
	isEnumValue,
	lastOrNull,
	joinHumanReadableList,
} from './utils.js';

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

describe('numberToOrdinal', () => {
	it('should convert numbers to ordinal strings correctly', () => {
		// Basic cases
		expect(numberToOrdinal(1)).toBe('1st');
		expect(numberToOrdinal(2)).toBe('2nd');
		expect(numberToOrdinal(3)).toBe('3rd');
		expect(numberToOrdinal(4)).toBe('4th');
		expect(numberToOrdinal(5)).toBe('5th');
		expect(numberToOrdinal(7)).toBe('7th');
		expect(numberToOrdinal(10)).toBe('10th');

		// Special cases for 11, 12, 13 (always "th")
		expect(numberToOrdinal(11)).toBe('11th');
		expect(numberToOrdinal(12)).toBe('12th');
		expect(numberToOrdinal(13)).toBe('13th');

		// Higher numbers with special endings
		expect(numberToOrdinal(21)).toBe('21st');
		expect(numberToOrdinal(22)).toBe('22nd');
		expect(numberToOrdinal(23)).toBe('23rd');
		expect(numberToOrdinal(24)).toBe('24th');

		// Numbers ending in 11, 12, 13 (always "th")
		expect(numberToOrdinal(111)).toBe('111th');
		expect(numberToOrdinal(112)).toBe('112th');
		expect(numberToOrdinal(113)).toBe('113th');

		// Higher numbers with normal endings
		expect(numberToOrdinal(101)).toBe('101st');
		expect(numberToOrdinal(102)).toBe('102nd');
		expect(numberToOrdinal(103)).toBe('103rd');
		expect(numberToOrdinal(104)).toBe('104th');
	});

	describe('firstParagraph', () => {
		it('should extract the first paragraph from text correctly', () => {
			// Single paragraph
			expect(firstParagraph('This is a single paragraph.')).toBe('This is a single paragraph.');

			// Multiple paragraphs
			expect(firstParagraph('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.')).toBe('First paragraph.');
			expect(firstParagraph('First paragraph.\r\n\r\nSecond paragraph.\r\n\r\nThird paragraph.')).toBe(
				'First paragraph.',
			);
			expect(firstParagraph('First paragraph.\nSecond line of first paragraph.\n\nSecond paragraph.')).toBe(
				'First paragraph.\nSecond line of first paragraph.',
			);
			expect(firstParagraph('First paragraph.\r\nSecond line of first paragraph.\r\n\r\nSecond paragraph.')).toBe(
				'First paragraph.\r\nSecond line of first paragraph.',
			);
		});
	});

	describe('isEnumValue', () => {
		it('should correctly identify valid enum values', () => {
			enum SampleEnum {
				One = 'one',
				Two = 'two',
				Three = 'three',
			}

			const array = ['one', 'two', 'four', 'five', 1, null, undefined, {}, []];
			const filtered = array.filter(isEnumValue(SampleEnum));
			expect(filtered).toEqual(['one', 'two']);
		});
	});

	describe('lastOrNull', () => {
		it('should return the last element of an array or null if empty', () => {
			expect(lastOrNull([1, 2, 3])).toBe(3);
			expect(lastOrNull(['a', 'b', 'c'])).toBe('c');
			expect(lastOrNull([])).toBeNull();
			expect(lastOrNull()).toBeNull();
		});
	});

	describe('joinHumanReadableList', () => {
		it('should join lists into human-readable strings correctly', () => {
			expect(joinHumanReadableList(['Apple'])).toBe('Apple');
			expect(joinHumanReadableList(['Apple', 'Banana'])).toBe('Apple and Banana');
			expect(joinHumanReadableList(['Apple', 'Banana', 'Cherry'])).toBe('Apple, Banana, and Cherry');
			expect(joinHumanReadableList(['Apple', 'Banana', 'Cherry', 'Date'])).toBe('Apple, Banana, Cherry, and Date');
			expect(joinHumanReadableList([])).toBe('');
		});
	});
});
