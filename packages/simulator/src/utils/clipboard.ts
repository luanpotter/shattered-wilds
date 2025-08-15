import { CharacterSheet } from '@shattered-wilds/commons';

import { Character } from '../types/ui';
import { findNextEmptyHexPosition } from '../utils';

export const copyCharacterDataToClipboard = (character: Character) => {
	const shareString = CharacterSheet.toShareString(character.props);
	exportDataToClipboard(shareString);
};

export const importCharacterDataFromClipboard = async (characters: Character[]): Promise<Character | string> => {
	try {
		const clipboardText = await window.navigator.clipboard.readText();
		if (!clipboardText.trim()) {
			return 'Clipboard is empty';
		}

		const props = CharacterSheet.parsePropsFromShareString(clipboardText);

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
