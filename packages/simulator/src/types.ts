export interface Point {
	x: number;
	y: number;
}

export interface HexPosition {
	q: number;
	r: number;
}

export type DragType = 'none' | 'window' | 'grid' | 'character';

export interface DragState {
	type: DragType;
	objectId?: string;
	startPosition?: Point;
	offset?: Point;
}

export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Tellur = 'Tellur',
}

export enum CharacterClass {
	Fighter = 'Fighter',
	Berserker = 'Berserker',
	Swashbuckler = 'Swashbuckler',
	Marksman = 'Marksman',
	Hunter = 'Hunter',
	Rogue = 'Rogue',
	Guardian = 'Guardian',
	Barbarian = 'Barbarian',
	Scout = 'Scout',
}

export interface CharacterSheet {
	name: string;
	race: Race;
	class: CharacterClass;
}

export interface Character {
	id: string;
	position?: HexPosition;
	sheet: CharacterSheet;
}

/**
 * Get character initials for display
 * - For multi-word names (e.g., "Foo Bar"), returns initials ("FB")
 * - For single-word names (e.g., "Warrior"), returns first two letters ("WA")
 */
export function getCharacterInitials(character: Character): string {
	const name = character.sheet.name.trim();

	// Check if name has multiple words
	if (name.includes(' ')) {
		// Split by spaces and get first letter of each word
		return name
			.split(' ')
			.map((word: string) => word.charAt(0).toUpperCase())
			.join('');
	}

	// If single word, return first two letters
	return name.slice(0, 2).toUpperCase();
}

export interface Window {
	id: string;
	title: string;
	type: 'character-sheet' | 'character-list' | 'character-creation';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
}

export interface GridState {
	scale: number;
	offset: Point;
}
