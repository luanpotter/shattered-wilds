import { RESOURCES } from '@shattered-wilds/commons';

import { Character, StatType } from '../types';
import { findNextEmptyHexPosition } from '../utils';

export const copyCharacterDataToClipboard = (character: Character) => {
	const keyValuePairs = Object.entries(character.props)
		.filter(([key, value]) => !StatType.values.some(stat => stat.name === key) || value !== '0')
		.filter(([key, value]) => !Object.keys(RESOURCES).some(resource => resource === key) || value !== '-1')
		.filter(([, value]) => value !== '')
		.map(([key, value]) => `${key}: ${value}`)
		.join('\n');
	const base64 = btoa(keyValuePairs);
	exportDataToClipboard(base64);
};

export const importCharacterDataFromClipboard = async (characters: Character[]): Promise<Character | string> => {
	try {
		const clipboardText = await window.navigator.clipboard.readText();
		if (!clipboardText.trim()) {
			return 'Clipboard is empty';
		}

		const props: Record<string, string> = {};
		const lines = atob(clipboardText).split('\n');

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;

			const colonIndex = trimmedLine.indexOf(':');
			if (colonIndex === -1) continue;

			const key = trimmedLine.substring(0, colonIndex).trim();
			const value = trimmedLine.substring(colonIndex + 1).trim();

			props[key] = value;
		}

		return <Character>{
			id: window.crypto.randomUUID(),
			props: props as { name: string } & Record<string, string>,
			position: findNextEmptyHexPosition(characters),
			automaticMode: false,
		};
	} catch {
		return 'Failed to import from clipboard. Make sure you have clipboard permissions.';
	}
};

export const exportDataToClipboard = (value: string) => {
	void window.navigator.clipboard.writeText(value).catch(() => {
		// Ignore clipboard errors
	});
};
