// Encounter import/export share string utility
// Format: base64 encoded JSON

import { Encounter, createNewEncounter } from '../types/ui';

// Version for future compatibility
const SHARE_VERSION = 1;

interface EncounterShareData {
	version: number;
	name: string;
	map: Encounter['map'];
	// Note: characterPositions are NOT exported as they reference local character IDs
}

function encode(value: string): string {
	const bytes = new TextEncoder().encode(value);
	const bin = String.fromCodePoint(...bytes);
	return btoa(bin);
}

function decode(value: string): string {
	const bin = atob(value);
	const bytes = Uint8Array.from(bin, char => char.codePointAt(0)!);
	return new TextDecoder().decode(bytes);
}

export function encounterToShareString(encounter: Encounter): string {
	const data: EncounterShareData = {
		version: SHARE_VERSION,
		name: encounter.name,
		map: encounter.map,
	};
	return encode(JSON.stringify(data));
}

export function parseEncounterFromShareString(shareString: string): Encounter {
	const json = decode(shareString);
	const data = JSON.parse(json) as EncounterShareData;

	if (!data.version || !data.name || !data.map) {
		throw new Error('Invalid encounter share string format');
	}

	// Create a new encounter with the imported data
	const encounter = createNewEncounter({
		name: data.name,
		characterIds: [],
		mapSize: data.map.size,
	});

	// Override the map with the imported one (including drawings)
	encounter.map = data.map;

	return encounter;
}

export function copyEncounterToClipboard(encounter: Encounter): void {
	const shareString = encounterToShareString(encounter);
	void window.navigator.clipboard.writeText(shareString).catch(() => {
		// Ignore clipboard errors
	});
}

export async function importEncounterFromClipboard(): Promise<Encounter | string> {
	try {
		const clipboardText = await window.navigator.clipboard.readText();
		if (!clipboardText.trim()) {
			return 'Clipboard is empty';
		}

		return parseEncounterFromShareString(clipboardText);
	} catch {
		return 'Failed to import encounter. Make sure the clipboard contains a valid encounter share string.';
	}
}
