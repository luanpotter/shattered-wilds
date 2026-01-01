export type ViewType =
	| '404'
	| 'home'
	| 'encounter'
	| 'character-sheets'
	| 'onboarding'
	| 'print-sheet'
	| 'print-actions';

export interface RouteState {
	view: ViewType;
	characterId?: string;
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

		if (hash === '/encounter') {
			return { view: 'encounter' };
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

	toEncounter(): void {
		window.location.hash = '#/encounter';
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
