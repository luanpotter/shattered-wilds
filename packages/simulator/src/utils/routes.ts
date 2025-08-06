export type ViewType = 'simulator' | 'character-sheets' | 'onboarding';

export interface RouteState {
	view: ViewType;
	characterId?: string;
}

export const Navigator = {
	parseRoute(): RouteState {
		const hash = window.location.hash.slice(1); // Remove the # prefix

		if (hash === '/characters' || hash.startsWith('/characters/')) {
			const match = hash.match(/^\/characters\/(.+)$/);
			return match ? { view: 'character-sheets', characterId: match[1] } : { view: 'character-sheets' };
		}

		if (hash === '/onboarding') {
			return { view: 'onboarding' };
		}

		return { view: 'simulator' };
	},

	toSimulator(): void {
		window.location.hash = '#/';
	},

	toCharacterSheets(): void {
		window.location.hash = '#/characters';
	},

	toCharacterSheet(characterId: string): void {
		window.location.hash = `#/characters/${characterId}`;
	},

	toOnboarding(): void {
		window.location.hash = '#/onboarding';
	},
} as const;
