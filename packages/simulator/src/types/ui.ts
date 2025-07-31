import { Check } from '@shattered-wilds/commons';

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

export interface GridState {
	scale: number;
	offset: Point;
}

export interface Window {
	id: string;
	title: string;
	type:
		| 'character-sheet'
		| 'character-list'
		| 'character-creation'
		| 'race-setup'
		| 'class-setup'
		| 'feats-setup'
		| 'basic-attacks'
		| 'dice-roll'
		| 'attack-action'
		| 'measure';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
	check?: Check;
	attackerId?: string;
	defenderId?: string;
	attackIndex?: number;
	fromCharacterId?: string;
	toPosition?: HexPosition;
	distance?: number;
	onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
	width?: string;
	height?: string;
}

export interface Character {
	id: string;
	position?: HexPosition;
	automaticMode?: boolean;
	props: { name: string } & Record<string, string>;
}

export function getCharacterInitials(character: { props: { name: string } }): string {
	const words = character.props.name.split(' ');
	if (words.length === 1) {
		// Single word, return up to first 2 characters, uppercased
		return words[0].slice(0, 2).toUpperCase();
	} else {
		// Multiple words, return first letter of each word, uppercased
		return words
			.slice(0, 2) // Take first 2 words max
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase();
	}
}
