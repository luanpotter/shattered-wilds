import { ActionCost, Check, FeatSlot, FeatDefinition } from '@shattered-wilds/commons';

export interface Point {
	x: number;
	y: number;
}

export interface HexPosition {
	q: number;
	r: number;
}

export type DragType = 'none' | 'modal' | 'grid' | 'character';

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

// Base modal interface with common properties
interface BaseModal {
	id: string;
	title: string;
	position: Point;
	width?: string;
	height?: string;
}

// Modal type discriminated unions
export type Modal =
	| (BaseModal & {
			type: 'character-list';
	  })
	| (BaseModal & {
			type: 'character-creation';
			hexPosition?: HexPosition;
	  })
	| (BaseModal & {
			type: 'character-sheet';
			characterId: string;
	  })
	| (BaseModal & {
			type: 'race-setup';
			characterId: string;
	  })
	| (BaseModal & {
			type: 'class-setup';
			characterId: string;
	  })
	| (BaseModal & {
			type: 'feats-setup';
			characterId: string;
	  })
	| (BaseModal & {
			type: 'basic-attacks';
			characterId: string;
	  })
	| (BaseModal & {
			type: 'dice-roll';
			characterId: string;
			check: Check;
			onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
			initialTargetDC?: number;
	  })
	| (BaseModal & {
			type: 'attack-action';
			attackerId: string;
			defenderId: string;
			attackIndex: number;
	  })
	| (BaseModal & {
			type: 'measure';
			fromCharacterId: string;
			toPosition: HexPosition;
			distance: number;
	  })
	| (BaseModal & {
			type: 'consume-resource';
			characterId: string;
			actionCosts: ActionCost[];
	  })
	| (BaseModal & {
			type: 'feat-selection';
			characterId: string;
			slot: FeatSlot;
	  })
	| (BaseModal & {
			type: 'feat-parameter-setup';
			characterId: string;
			slot: FeatSlot | undefined;
			baseFeat: FeatDefinition<string | void>;
	  })
	| (BaseModal & {
			type: 'item';
			characterId: string;
			itemIndex?: number; // if provided, edit/view existing; else create new
	  });

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
