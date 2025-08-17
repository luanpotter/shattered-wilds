import { createHexScene, createCharacterWithToken } from './vtt-api.js';
import { getGame, getHooks, getTokenObjectCtor, getDocumentSheetConfig } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { newSWCharacterApp } from './character-app.js';
import { SWActorSheetV2 } from './actor-sheet-v2.js';
import { registerChatCommands } from './chat-commands.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { registerInitiativeHooks } from './initiative.js';

getHooks().once('init', () => {
	// Register V2 ActorSheet with HandlebarsApplicationMixin
	const ActorCtor = (globalThis as unknown as { Actor: unknown }).Actor;
	getDocumentSheetConfig().registerSheet(ActorCtor, 'shattered-wilds', SWActorSheetV2, {
		label: 'Shattered Wilds Actor Sheet',
		types: ['character'],
		makeDefault: true,
	});

	// Register chat commands for dice rolling
	registerChatCommands();

	// Register initiative system hooks
	registerInitiativeHooks();
});

// Hook for when actors are created to set up default token bars
const hooks = getHooks();
if (hooks?.on) {
	hooks.on('createActor', async (actor: unknown) => {
		try {
			const actorData = actor as { type?: string };
			if (actorData.type === 'character') {
				// Small delay to ensure actor is fully created
				setTimeout(async () => {
					await configureDefaultTokenBars(actor);
				}, 100);
			}
		} catch (err) {
			console.debug('Failed to configure default token bars for new actor:', err);
		}
	});

	// Hook for when tokens are created to configure token bars
	hooks.on('createToken', async (tokenDoc: unknown) => {
		try {
			const token = tokenDoc as { actor?: unknown };
			if (token.actor) {
				const actorData = token.actor as { type?: string };

				if (actorData.type === 'character') {
					// Ensure the actor has proper token bar configuration
					setTimeout(async () => {
						await configureDefaultTokenBars(token.actor);
					}, 100);
				}
			}
		} catch (err) {
			console.debug('Failed to configure token bars for new token:', err);
		}
	});
}

getHooks().once('ready', () => {
	(getGame() as { shatteredWilds?: unknown }).shatteredWilds = {
		createHexScene,
		createCharacterWithToken,
		openCharacterApp: (actorId: string) => {
			const app = newSWCharacterApp({ actorId });
			(app as { render: (force?: boolean) => unknown }).render(true);
		},
		exportActor: exportActorPropsToShareString,
		importActor: importActorPropsFromShareString,
		configureAllCharacterTokenBars: async () => {
			const game = getGame();
			const actors = (game as { actors?: { contents?: unknown[] } }).actors?.contents || [];
			for (const actor of actors) {
				const actorData = actor as { type?: string };
				if (actorData.type === 'character') {
					await configureDefaultTokenBars(actor);
				}
			}
		},
	};

	// Patch Token double-click to open our V2 character sheet (the proper one with data handling)
	const TokenCtor = getTokenObjectCtor();
	const original = TokenCtor.prototype._onClickLeft2.bind(TokenCtor.prototype);
	TokenCtor.prototype._onClickLeft2 = function patched(event: unknown) {
		try {
			const actorId: string | undefined = this.document?.actorId ?? this.actor?.id;
			if (actorId) {
				const game = getGame();
				const actors = (game as { actors?: { get?: (id: string) => unknown } }).actors;
				const actor = actors?.get?.(actorId) as { sheet?: { render?: (force?: boolean) => unknown } };

				if (actor?.sheet?.render) {
					actor.sheet.render(true);
					return; // do not call legacy sheet
				}
			}
		} catch (err) {
			console.warn('Failed to open V2 sheet, falling back:', err);
		}
		return original(event);
	};

	console.log('Shattered Wilds system ready (V3)');
});
