import { Check, FeatSlot, FeatDefinition, Condition, Consequence, ResourceCost } from '@shattered-wilds/commons';

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
				onMove?: () => void;
		  }
		| {
				type: 'consume-resource';
				characterId: string;
				costs: ResourceCost[];
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
		| {
				type: 'confirmation';
				message: string;
				confirmText?: string;
				cancelText?: string;
				onConfirm: () => void;
				onCancel: () => void;
		  }
		| {
				type: 'encounter-config';
				encounterId: string;
		  }
	);

export interface Character {
	id: string;
	automaticMode?: boolean;
	props: { name: string } & Record<string, string>;
}

export interface Encounter {
	id: string;
	name: string;
	characterPositions: Record<string, HexPosition>;
	mapSize: { width: number; height: number };
}

export const createNewCharacter = ({ props }: { props: Record<string, string> }): Character => {
	return {
		id: window.crypto.randomUUID(),
		props: props as { name: string } & Record<string, string>,
		automaticMode: false,
	};
};

export const createNewEncounter = ({
	name,
	characterIds,
	existingCharacterPositions,
}: {
	name: string;
	characterIds: string[];
	existingCharacterPositions?: Record<string, HexPosition>;
}): Encounter => {
	const characterPositions: Record<string, HexPosition> = {};
	const usedPositions: HexPosition[] = [];

	characterIds.forEach(id => {
		const existingPos = existingCharacterPositions?.[id];
		if (existingPos && !usedPositions.some(p => p.q === existingPos.q && p.r === existingPos.r)) {
			characterPositions[id] = existingPos;
			usedPositions.push(existingPos);
		} else {
			const pos = findNextEmptyHexPositionFromList(usedPositions);
			characterPositions[id] = pos;
			usedPositions.push(pos);
		}
	});

	return {
		id: window.crypto.randomUUID(),
		name,
		characterPositions,
		mapSize: { width: 10, height: 10 },
	};
};

const findNextEmptyHexPositionFromList = (usedPositions: HexPosition[], startQ = 0, startR = 0): HexPosition => {
	const isOccupied = (q: number, r: number) => usedPositions.some(p => p.q === q && p.r === r);

	if (!isOccupied(startQ, startR)) {
		return { q: startQ, r: startR };
	}

	const directions = [
		{ q: 1, r: 0 },
		{ q: 0, r: 1 },
		{ q: -1, r: 1 },
		{ q: -1, r: 0 },
		{ q: 0, r: -1 },
		{ q: 1, r: -1 },
	];

	let q = startQ;
	let r = startR;
	let radius = 1;

	while (radius < 20) {
		for (let side = 0; side < 6; side++) {
			for (let step = 0; step < radius; step++) {
				q += directions[side].q;
				r += directions[side].r;
				if (!isOccupied(q, r)) {
					return { q, r };
				}
			}
		}
		radius++;
	}

	return { q: 0, r: 0 };
};

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
