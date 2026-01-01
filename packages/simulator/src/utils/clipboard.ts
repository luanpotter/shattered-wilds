import { CharacterSheet } from '@shattered-wilds/commons';

import { Character, createNewCharacter } from '../types/ui';

export const copyCharacterDataToClipboard = (character: Character) => {
	const shareString = CharacterSheet.toShareString(character.props);
	exportDataToClipboard(shareString);
};

export const importCharacterDataFromClipboard = async (): Promise<Character | string> => {
	try {
		const clipboardText = await window.navigator.clipboard.readText();
		if (!clipboardText.trim()) {
			return 'Clipboard is empty';
		}

		const props = CharacterSheet.parsePropsFromShareString(clipboardText);
		return createNewCharacter({ props });
	} catch {
		return 'Failed to import from clipboard. Make sure you have clipboard permissions.';
	}
};

export const exportDataToClipboard = (value: string) => {
	void window.navigator.clipboard.writeText(value).catch(() => {
		// Ignore clipboard errors
	});
};
