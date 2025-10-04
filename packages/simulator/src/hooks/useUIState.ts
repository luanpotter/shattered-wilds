import { Dispatch, SetStateAction, useMemo } from 'react';

import { useStore } from '../store';
import { indexOfMatching } from '../utils';

/**
 * A hook that provides useState-like behavior but persists state in Zustand.
 * Perfect for component UI state that should survive re-renders.
 *
 * @param key - Unique key for this piece of state
 * @param defaultValue - Default value if no state exists
 * @returns [value, setValue] tuple just like useState
 */
export function useUIState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
	const value = useStore<T>(state => (state.uiState[key] as T) ?? defaultValue);
	const setValue = useStore(state => state.setUIState);

	return [
		value,
		(newValue: SetStateAction<T>) => {
			if (typeof newValue === 'function') {
				setValue<T>(key, (prev: T) => (newValue as (prev: T) => T)(prev));
			} else {
				setValue<T>(key, newValue);
			}
		},
	];
}

/**
 * Creates a scoped useState-like hook factory for a component.
 * Call this once at the top of your component to get a clean useState-like API.
 *
 * @param baseKey - Base key for this component (e.g., `actions-${characterId}`)
 * @returns An object with useState and useStateArrayItem functions
 *
 * @example
 * ```typescript
 * const { useState, useStateArrayItem } = useUIStateFactory(`actions-${characterId}`);
 * const [activeTab, setActiveTab] = useState('activeTab', ActionType.Movement);
 * const [selectedArmor, setSelectedArmor] = useStateArrayItem('armor', armors, null);
 * ```
 */
export function useUIStateFactory(baseKey: string) {
	const useState = function <T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
		const fullKey = `${baseKey}-${key}`;
		return useUIState(fullKey, defaultValue);
	};

	const useStateArrayItem = function <T>(key: string, array: readonly T[], defaultValue: T): [T, (value: T) => void] {
		const fullKey = `${baseKey}-${key}`;
		const [selectedIndex, setSelectedIndex] = useUIState<number | undefined>(fullKey, undefined);

		const selectedItem = useMemo(() => {
			if (selectedIndex === undefined || selectedIndex >= array.length) return defaultValue;
			return array[selectedIndex];
		}, [selectedIndex, array, defaultValue]);

		const setSelectedItem = useMemo(() => {
			return (item: T | undefined) => {
				if (item === undefined) {
					setSelectedIndex(undefined);
				} else {
					const index = indexOfMatching(array, (a: T) => a === item || JSON.stringify(a) === JSON.stringify(item));
					setSelectedIndex(index >= 0 ? index : undefined);
				}
			};
		}, [array, setSelectedIndex]);

		return [selectedItem, setSelectedItem];
	};

	return { useState, useStateArrayItem };
}
