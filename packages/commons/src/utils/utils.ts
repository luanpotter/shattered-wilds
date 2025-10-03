/**
 * Maps all values of an enum to a Record<Enum, T> in a type-safe manner.
 * Ensures that all enum values are mapped by requiring a mapper function
 * that takes each enum value and returns the corresponding mapped value.
 *
 * @param enumObject The enum object (e.g., ActionType)
 * @param mapper Function that maps each enum value to the desired type T
 * @returns Record<EnumType, T> with all enum values mapped
 */
export function mapEnumToRecord<E extends string | number, T>(
	enumObject: Record<string, E>,
	mapper: (enumValue: E) => T,
): Record<E, T> {
	const result = {} as Record<E, T>;

	for (const enumValue of Object.values(enumObject)) {
		result[enumValue] = mapper(enumValue);
	}

	return result;
}

/**
 * Type-safe equivalent to Object.keys() for Records with enum keys.
 * Returns the keys with their proper enum type instead of string[].
 *
 * @param record A Record<K, T> where K is an enum type
 * @returns Array of keys with type K[] (instead of string[])
 */
export function getRecordKeys<K extends string | number, T>(record: Record<K, T>): K[] {
	return Object.keys(record) as K[];
}

/**
 * Convert a number to an ordinal string, for example 1 -> "1st", 7 -> "7th" or 22 -> "22nd".
 * @param number - The number to convert
 * @returns The ordinal string
 */
export const numberToOrdinal = (number: number): string => {
	const suffix =
		number % 100 === 11 || number % 100 === 12 || number % 100 === 13
			? 'th'
			: {
					1: 'st',
					2: 'nd',
					3: 'rd',
				}[number % 10] || 'th';
	return `${number}${suffix}`;
};

/**
 * Extracts the first paragraph from a given text.
 *
 * @param text - The text to extract the first paragraph from
 * @returns The first paragraph of the text
 */
export const firstParagraph = (text: string): string => {
	const paragraphs = text
		.split(/\n\s*\n/)
		.map(p => p.trim())
		.filter(p => p.length > 0);
	return paragraphs[0] ?? text;
};
