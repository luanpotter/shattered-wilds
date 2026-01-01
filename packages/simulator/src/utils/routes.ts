export type ViewType =
	| '404'
	| 'home'
	| 'encounters'
	| 'encounter'
	| 'character-sheets'
	| 'onboarding'
	| 'print-sheet'
	| 'print-actions';

export interface RouteState {
	view: ViewType;
	characterId?: string;
	encounterId?: string;
}

export const Navigator = {
	parseRoute(): RouteState {
		const hash = window.location.hash.slice(1);

		if (hash === '/characters' || hash.startsWith('/characters/')) {
			const matchPrint = hash.match(/^\/characters\/(.+)\/print$/);
			if (matchPrint) {
				return { view: 'print-sheet', characterId: matchPrint[1] };
			}
			const matchSheet = hash.match(/^\/characters\/(.+)$/);
			if (matchSheet) {
				return { view: 'character-sheets', characterId: matchSheet[1] };
			}
			const matchList = hash.match(/^\/characters$/);
			if (matchList) {
				return { view: 'character-sheets' };
			}
			return { view: '404' };
		}

		if (hash === '/encounters' || hash.startsWith('/encounters/')) {
			const matchEncounter = hash.match(/^\/encounters\/(.+)$/);
			if (matchEncounter) {
				return { view: 'encounter', encounterId: matchEncounter[1] };
			}
			const matchList = hash.match(/^\/encounters$/);
			if (matchList) {
				return { view: 'encounters' };
			}
			return { view: '404' };
		}

		if (hash === '/print/actions') {
			return { view: 'print-actions' };
		}

		if (hash === '/onboarding') {
			return { view: 'onboarding' };
		}

		return { view: 'home' };
	},

	toHome(): void {
		window.location.hash = '#/';
	},

	toEncounters(): void {
		window.location.hash = '#/encounters';
	},

	toEncounter(encounterId: string): void {
		window.location.hash = `#/encounters/${encounterId}`;
	},

	toCharacterSheets(): void {
		window.location.hash = '#/characters';
	},

	toCharacterSheet(characterId: string): void {
		window.location.hash = `#/characters/${characterId}`;
	},

	toPrintView(characterId: string): void {
		window.location.hash = `#/characters/${characterId}/print`;
	},

	toOnboarding(): void {
		window.location.hash = '#/onboarding';
	},
} as const;
