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
