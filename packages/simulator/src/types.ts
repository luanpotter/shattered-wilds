export interface Point {
	x: number;
	y: number;
}

export interface Character {
	id: string;
	name: string;
	position?: {
		q: number;
		r: number;
	};
}

export interface Window {
	id: string;
	title: string;
	type: 'character-sheet' | 'character-list' | 'character-creation';
	characterId?: string;
	position: {
		x: number;
		y: number;
	};
	hexPosition?: {
		q: number;
		r: number;
	};
}

export interface GridState {
	scale: number;
	offset: {
		x: number;
		y: number;
	};
}
