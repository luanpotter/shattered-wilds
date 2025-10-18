import { getTokenDisplayModes } from './foundry-shim.js';

// Helper function to configure default token bars for Bar Brawl
export async function configureDefaultTokenBars(actor: unknown): Promise<void> {
	try {
		const actorWithPrototype = actor as {
			id?: string;
			name?: string;
			system?: Record<string, unknown>;
			prototypeToken?: {
				flags?: Record<string, unknown>;
				update?: (data: Record<string, unknown>) => Promise<unknown>;
			};
			update?: (data: Record<string, unknown>) => Promise<unknown>;
		};

		// Configure Bar Brawl resource bars
		// Bar Brawl expects Foundry CONST.TOKEN_DISPLAY_MODES constants
		const DISPLAY_MODES = getTokenDisplayModes();

		const defaultBarsObject = {
			bar1: {
				id: 'bar1',
				order: 3,
				attribute: 'resources.vp',
				mincolor: '#ff0000',
				maxcolor: '#00ff00',
				position: 'bottom-inner',
				visibility: DISPLAY_MODES.ALWAYS,
				indentation: 0,
				showMaxValue: true,
				showLabel: true,
			},
			bar2: {
				id: 'bar2',
				order: 2,
				attribute: 'resources.fp',
				mincolor: '#000080',
				maxcolor: '#87ceeb',
				position: 'bottom-inner',
				visibility: DISPLAY_MODES.ALWAYS,
				indentation: 0,
				showMaxValue: true,
				showLabel: true,
			},
			bar3: {
				id: 'bar3',
				order: 1,
				attribute: 'resources.sp',
				mincolor: '#800080',
				maxcolor: '#ffd700',
				position: 'bottom-inner',
				visibility: DISPLAY_MODES.ALWAYS,
				indentation: 0,
				showMaxValue: true,
				showLabel: true,
			},
		};

		// Configure both Bar Brawl and Foundry's built-in bars
		if (actorWithPrototype.update) {
			try {
				// Then configure Bar Brawl with correct visibility modes
				await actorWithPrototype.update({
					'prototypeToken.flags.barbrawl': {
						resourceBars: defaultBarsObject,
					},
				});

				// Also configure Foundry's built-in token bars as fallback
				await actorWithPrototype.update({
					'prototypeToken.bar1': { attribute: 'resources.vp' },
					'prototypeToken.bar2': { attribute: 'resources.fp' },
					'prototypeToken.bar3': { attribute: 'resources.sp' },
					'prototypeToken.displayBars': DISPLAY_MODES.ALWAYS,
					'prototypeToken.displayName': DISPLAY_MODES.ALWAYS,
					'prototypeToken.actorLink': true, // Ensure all tokens created from this actor are linked
					'prototypeToken.disposition': 1, // Friendly disposition for characters
					'prototypeToken.lockRotation': true, // Lock rotation for character tokens
				});
			} catch (err) {
				console.debug('Failed to configure token bars:', err);
			}
		}
	} catch (err) {
		// Bar Brawl might not be installed, fail silently
		console.debug('Failed to configure token bars (Bar Brawl may not be installed):', err);
	}
}
