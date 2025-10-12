import { ActionCost, Check, FeatSlot, FeatDefinition, Condition, Consequence } from '@shattered-wilds/commons';

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
	widthPixels?: number;
	heightPixels?: number;
}

// Modal type discriminated unions
export type Modal = BaseModal &
	(
		| {
				type: 'character-list';
		  }
		| {
				type: 'character-creation';
				hexPosition?: HexPosition;
		  }
		| {
				type: 'character-sheet';
				characterId: string;
		  }
		| {
				type: 'race-setup';
				characterId: string;
		  }
		| {
				type: 'class-setup';
				characterId: string;
		  }
		| {
				type: 'feats-setup';
				characterId: string;
		  }
		| {
				type: 'basic-attacks';
				characterId: string;
		  }
		| {
				type: 'dice-roll';
				characterId: string;
				check: Check;
				onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
				initialTargetDC?: number;
		  }
		| {
				type: 'attack-action';
				attackerId: string;
				defenderId: string;
				attackIndex: number;
		  }
		| {
				type: 'measure';
				fromCharacterId: string;
				toPosition: HexPosition;
				distance: number;
		  }
		| {
				type: 'consume-resource';
				characterId: string;
				actionCosts: ActionCost[];
		  }
		| {
				type: 'feat-selection';
				characterId: string;
				slot: FeatSlot;
		  }
		| {
				type: 'feat-parameter-setup';
				characterId: string;
				slot: FeatSlot | undefined;
				baseFeat: FeatDefinition<string | void>;
		  }
		| {
				type: 'item';
				characterId: string;
				itemIndex?: number; // if provided, edit/view existing; else create new
		  }
		| {
				type: 'add-condition';
				characterId: string;
				onConfirm: (condition: Condition, rank: number) => void;
		  }
		| {
				type: 'add-consequence';
				characterId: string;
				onConfirm: (consequence: Consequence, rank: number) => void;
		  }
	);

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
