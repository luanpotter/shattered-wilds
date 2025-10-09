import { createHexScene, createCharacterWithToken } from './vtt-api.js';
import {
	getGame,
	getHooks,
	getTokenObjectCtor,
	getDocumentSheetConfig,
	getActorConstructor,
	GameLike,
	ActorLike,
	getActors,
	getActorById,
	TokenDocumentLike,
} from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { newSWCharacterApp } from './character-app.js';
import { SWActorSheetV2 } from './actor-sheet-v2.js';
import { registerChatCommands } from './chat-commands.js';
import { configureDefaultTokenBars, fixUnlinkedTokens } from './token-bars.js';
import { registerInitiativeHooks } from './initiative.js';

getHooks().once?.('init', async () => {
	// Load and register Handlebars partials early
	try {
		const Handlebars = (globalThis as { Handlebars?: { registerPartial: (name: string, template: string) => void } })
			.Handlebars;

		if (Handlebars) {
			const partials = [
				'action-row',
				'sections/stats-section',
				'sections/feats-section',
				'sections/equipment-section',
				'sections/actions-section',
				'sections/arcane-section',
				'sections/divine-section',
				'sections/personality-section',
				'sections/misc-section',
				'sections/debug-section',
			];

			for (const partial of partials) {
				try {
					const response = await fetch(`systems/shattered-wilds/templates/partials/${partial}.html`);
					if (response.ok) {
						const template = await response.text();
						Handlebars.registerPartial(partial, template);
						console.log(`Registered ${partial} partial`);
					} else {
						console.warn(`Failed to fetch ${partial} partial:`, response.status);
					}
				} catch (err) {
					console.warn(`Failed to register ${partial} partial:`, err);
				}
			}
		}
	} catch (err) {
		console.warn('Failed to register partials:', err);
	}

	// Register V2 ActorSheet with HandlebarsApplicationMixin
	const ActorCtor = getActorConstructor();
	getDocumentSheetConfig().registerSheet(ActorCtor, 'shattered-wilds', SWActorSheetV2, {
		label: 'Shattered Wilds Actor Sheet',
		types: ['character'],
		makeDefault: true,
	});

	// Register chat commands for dice rolling
	registerChatCommands();

	// Register initiative system hooks
	registerInitiativeHooks();

	// Register status effects for conditions
	SWActorSheetV2.registerStatusEffects();
});

// Hook for when actors are created to set up default token bars
const actorHooks = getHooks();
if (actorHooks?.on) {
	actorHooks.on('createActor', async (actor: unknown) => {
		try {
			const actorData = actor as ActorLike;
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
	actorHooks.on('createToken', async (tokenDoc: unknown) => {
		try {
			const token = tokenDoc as TokenDocumentLike;
			if (token.actor && token.actor.type === 'character') {
				// Ensure the actor has proper token bar configuration
				setTimeout(async () => {
					await configureDefaultTokenBars(token.actor);
				}, 100);
			}
		} catch (err) {
			console.debug('Failed to configure token bars for new token:', err);
		}
	});

	// Hook for when actors are updated to sync token resources
	actorHooks.on('updateActor', async (actor: unknown, changes: unknown) => {
		try {
			const actorData = actor as ActorLike;
			const updateData = changes as { system?: { resources?: unknown } };

			if (actorData.type === 'character' && updateData.system?.resources) {
				// Sync resources to all active tokens for this actor
				const tokens = actorData.getActiveTokens?.() || [];
				for (const token of tokens) {
					try {
						if (token.document?.update) {
							await token.document.update({
								'actorData.system.resources': updateData.system.resources,
							});
						}
					} catch (err) {
						console.debug('Failed to sync token resources:', err);
					}
				}
			}
		} catch (err) {
			console.debug('Failed to sync actor update to tokens:', err);
		}
	});

	// Hook to prevent character tokens from becoming unlinked
	actorHooks.on('updateToken', async (tokenDoc: unknown, changes: unknown) => {
		try {
			const tokenData = tokenDoc as TokenDocumentLike;
			const updateData = changes as { actorLink?: boolean };

			// If a character token is being updated to unlink, force it back to linked
			if (tokenData.actor?.type === 'character' && updateData.actorLink === false) {
				console.log('Preventing character token from becoming unlinked');
				setTimeout(async () => {
					try {
						if (tokenData.update) {
							await tokenData.update({ actorLink: true });
						}
					} catch (err) {
						console.warn('Failed to re-link character token:', err);
					}
				}, 100); // Small delay to avoid infinite loops
			}
		} catch (err) {
			console.debug('Failed to monitor token update:', err);
		}
	});
}

getHooks().once?.('ready', () => {
	(getGame() as GameLike & { shatteredWilds?: unknown }).shatteredWilds = {
		createHexScene,
		createCharacterWithToken,
		openCharacterApp: (actorId: string) => {
			const app = newSWCharacterApp({ actorId });
			(app as { render: (force?: boolean) => unknown }).render(true);
		},
		exportActor: exportActorPropsToShareString,
		importActor: importActorPropsFromShareString,
		fixUnlinkedTokens,
		fixAllUnlinkedTokens: async () => {
			const actors = getActors().contents || [];
			for (const actor of actors) {
				if (actor.type === 'character') {
					await fixUnlinkedTokens(actor);
				}
			}
		},
		configureAllCharacterTokenBars: async () => {
			const actors = getActors().contents || [];
			for (const actor of actors) {
				if (actor.type === 'character') {
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
				const actor = getActorById(actorId);
				if (actor?.sheet?.render) {
					actor.sheet.render(true);
					return;
				}
			}
		} catch (err) {
			console.debug('Failed to open actor sheet from token double-click:', err);
		}

		// Fallback to original behavior
		original.call(this, event);
	};
});

getHooks().once?.('ready', () => {
	(getGame() as GameLike & { shatteredWilds?: unknown }).shatteredWilds = {
		createHexScene,
		createCharacterWithToken,
		openCharacterApp: (actorId: string) => {
			const app = newSWCharacterApp({ actorId });
			(app as { render: (force?: boolean) => unknown }).render(true);
		},
		exportActor: exportActorPropsToShareString,
		importActor: importActorPropsFromShareString,
		configureAllCharacterTokenBars: async () => {
			const actors = getActors().contents || [];
			for (const actor of actors) {
				if (actor.type === 'character') {
					await configureDefaultTokenBars(actor);
				}
			}
		},
		fixAllUnlinkedTokens: async () => {
			const actors = getActors().contents || [];
			let fixedCount = 0;

			for (const actor of actors) {
				if (actor.type === 'character' && actor.getActiveTokens) {
					const tokens = actor.getActiveTokens();
					for (const token of tokens) {
						if (token.document && !token.document.actorLink && token.document.update) {
							console.log('Fixing unlinked token for actor:', actor);
							await token.document.update({ actorLink: true });
							fixedCount++;
						}
					}
				}
			}

			console.log(`Fixed ${fixedCount} unlinked character tokens`);
			return fixedCount;
		},
	};

	// Patch Token double-click to open our V2 character sheet (the proper one with data handling)
	const TokenCtor = getTokenObjectCtor();
	const original = TokenCtor.prototype._onClickLeft2.bind(TokenCtor.prototype);
	TokenCtor.prototype._onClickLeft2 = function patched(event: unknown) {
		try {
			const actorId: string | undefined = this.document?.actorId ?? this.actor?.id;
			if (actorId) {
				const actor = getActorById(actorId);

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

	console.log('Shattered Wilds system ready (V4)');

	// Auto-fix unlinked tokens on world startup
	setTimeout(async () => {
		console.log('Shattered Wilds: Checking for unlinked character tokens...');
		try {
			const actors = getActors().contents || [];
			let fixedCount = 0;

			for (const actor of actors) {
				if (actor.type === 'character' && actor.getActiveTokens) {
					const tokens = actor.getActiveTokens();
					for (const token of tokens) {
						if (token.document && !token.document.actorLink && token.document.update) {
							console.log('Fixing unlinked token:', token);
							await token.document.update({ actorLink: true });
							fixedCount++;
						}
					}
				}
			}

			if (fixedCount > 0) {
				console.log(`Shattered Wilds: Fixed ${fixedCount} unlinked character tokens`);
			} else {
				console.log('Shattered Wilds: All character tokens are properly linked');
			}
		} catch (err) {
			console.warn('Shattered Wilds: Failed to check/fix unlinked tokens:', err);
		}
	}, 2000); // Wait 2 seconds after ready to ensure all data is loaded
});
