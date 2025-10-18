import { SWActorSheetV2 } from './modals/actor-sheet-modal.js';
import { registerChatCommands } from './chat-commands.js';
import {
	ActorLike,
	Foundry,
	getActorById,
	getDocumentSheetConfig,
	getTokenObjectFactory,
	TokenDocumentLike,
} from './foundry-shim.js';
import { registerInitiativeHooks } from './helpers/initiative.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { registerConditionStatusEffects } from './helpers/conditions.js';

Foundry.Hooks.once('init', async () => {
	getDocumentSheetConfig().registerSheet(Foundry.Actor, 'shattered-wilds', SWActorSheetV2, {
		label: 'Shattered Wilds Actor Sheet',
		types: ['character'],
		makeDefault: true,
	});

	// Register chat commands for dice rolling
	registerChatCommands();

	// Register initiative system hooks
	registerInitiativeHooks();

	// Register status effects for conditions
	registerConditionStatusEffects();

	// Load and register Handlebars partials early
	await registerPartials();
});

// Function to register Handlebars partials
const registerPartials = async () => {
	try {
		const Handlebars = (globalThis as { Handlebars?: { registerPartial: (name: string, template: string) => void } })
			.Handlebars;

		if (Handlebars) {
			const partials = [
				'action-row',
				'sections/stats-section',
				'sections/circumstances-section',
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
};

// Hook for when actors are created to set up default token bars
Foundry.Hooks.on('createActor', async (actor: unknown) => {
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
Foundry.Hooks.on('createToken', async (tokenDoc: unknown) => {
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
Foundry.Hooks.on('updateActor', async (actor: unknown, changes: unknown) => {
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
Foundry.Hooks.on('updateToken', async (tokenDoc: unknown, changes: unknown) => {
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

Foundry.Hooks.once('ready', () => {
	const TokenFactory = getTokenObjectFactory();
	const original = TokenFactory.prototype._onClickLeft2.bind(TokenFactory.prototype);
	TokenFactory.prototype._onClickLeft2 = function patched(event: unknown) {
		try {
			const actorId: string | undefined = this.document?.actorId ?? this.actor?.id;
			if (actorId) {
				const actor = getActorById(actorId);
				if (actor?.sheet?.render) {
					actor.sheet?.render(true);
					return; // do not call legacy sheet
				}
			}
		} catch (err) {
			console.warn('Failed to open V2 sheet, falling back:', err);
		}
		return original(event);
	};

	console.log('Shattered Wilds system ready [V5]');
});
