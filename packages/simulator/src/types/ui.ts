import {
	Check,
	FeatSlot,
	FeatDefinition,
	Condition,
	Consequence,
	ResourceCost,
	Point,
	HexCoord,
	HexVertex,
} from '@shattered-wilds/commons';

import { OmniSearchContext } from '../components/omni/OmniSearchContext';

export type { Point, HexCoord, HexVertex };

export type MapMode = 'map' | 'encounter';
export type MapTool = 'select' | 'line' | 'area' | 'stamp';

export interface LineDrawing {
	type: 'line';
	start: HexVertex;
	end: HexVertex;
	color: string;
}

export interface AreaDrawing {
	type: 'area';
	hexes: HexCoord[];
	color: string;
}

export interface StampDrawing {
	type: 'stamp';
	hex: HexCoord;
	icon: string;
	color: string;
}

export type Drawing = LineDrawing | AreaDrawing | StampDrawing;

export interface GameMap {
	size: { width: number; height: number };
	drawings: Drawing[];
}

export interface LineToolState {
	startVertex: HexVertex;
	currentEndVertex: HexVertex;
	pathVertices: HexVertex[];
}

export interface AreaToolState {
	centerHex: HexCoord;
	radius: number;
	previewHexes: HexCoord[];
}

export interface SelectionBox {
	start: Point;
	end: Point;
}

export interface SelectToolState {
	selectedIndices: Set<number>;
	selectionBox: SelectionBox | null;
	dragStart: HexVertex | null;
	dragCurrent: HexVertex | null;
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

export enum ModalPositionType {
	MousePosition,
	ScreenCenter,
}

interface BaseModal {
	id: string;
	title: string;
	positionType?: ModalPositionType;
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
				hexPosition?: HexCoord;
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
				onClose: () => void;
		  }
		| {
				type: 'measure';
				fromCharacterId: string;
				toPosition: HexCoord;
				distance: number;
				onMove: () => void;
				onClose: () => void;
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
				type: 'error';
				message: string;
		  }
		| {
				type: 'encounter-config';
				encounterId: string;
		  }
		| {
				type: 'turn-tracker';
				encounterId: string;
		  }
		| {
				type: 'color-picker';
				currentColor: string;
				onColorChange: (color: string) => void;
		  }
		| {
				type: 'icon-selection';
				currentIcon: string | null;
				onSelect: (icon: string) => void;
		  }
		| {
				type: 'omni-search';
				context: OmniSearchContext | undefined;
		  }
	);

export interface Character {
	id: string;
	automaticMode?: boolean;
	props: { name: string } & Record<string, string>;
}

export interface TurnTracker {
	initiatives: Record<string, number | null>; // characterId -> initiative value (null = not rolled)
	currentTurnCharacterId: string | null; // characterId of whose turn it is
}

export interface Encounter {
	id: string;
	name: string;
	characterPositions: Record<string, HexCoord>;
	map: GameMap;
	turnTracker: TurnTracker | null;
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
	mapSize = { width: 10, height: 10 },
}: {
	name: string;
	characterIds: string[];
	existingCharacterPositions?: Record<string, HexCoord>;
	mapSize?: { width: number; height: number };
}): Encounter => {
	const characterPositions: Record<string, HexCoord> = {};
	const usedPositions: HexCoord[] = [];

	characterIds.forEach(id => {
		const existingPos = existingCharacterPositions?.[id];
		if (existingPos && !usedPositions.some(p => p.q === existingPos.q && p.r === existingPos.r)) {
			characterPositions[id] = existingPos;
			usedPositions.push(existingPos);
		} else {
			const pos = findNextEmptyHexCoordFromList(usedPositions);
			characterPositions[id] = pos;
			usedPositions.push(pos);
		}
	});

	return {
		id: window.crypto.randomUUID(),
		name,
		characterPositions,
		map: {
			size: mapSize,
			drawings: [],
		},
		turnTracker: null,
	};
};

const findNextEmptyHexCoordFromList = (usedPositions: HexCoord[], startQ = 0, startR = 0): HexCoord => {
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
