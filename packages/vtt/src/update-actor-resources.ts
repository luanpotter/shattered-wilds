import { ActorLike, getUI } from './foundry-shim.js';
import { CharacterSheet, Resource } from '@shattered-wilds/commons';
import { sanitizeProps, parseCharacterProps } from './characters.js';

/**
 * Centralized resource management for all resource updates.
 * This is the single source of truth for resource changes.
 * Handles actor flags, system data, token synchronization, and cache invalidation.
 */
export async function updateActorResources(actor: ActorLike, updatedProps: Record<string, string>): Promise<void> {
	if (!actor) return;

	try {
		// Sanitize props for Foundry storage
		const sanitizedProps = sanitizeProps(updatedProps);
		const characterSheet = CharacterSheet.from(updatedProps);
		const systemResourceData = getSystemResourceData(characterSheet);

		// Batch all updates in a single actor.update call for consistency
		const updateData: Record<string, unknown> = {
			'flags.shattered-wilds.props': sanitizedProps,
			'system.resources': systemResourceData,
			'prototypeToken.actorData.flags.shattered-wilds.props': sanitizedProps,
		};

		// Perform the atomic update
		if (actor.update) {
			await actor.update(updateData);
		}

		// Force refresh any open actor sheets for this actor
		await refreshActorSheets(actor);

		// Update any existing tokens for this actor
		await syncTokenResources(actor, systemResourceData);
	} catch (error) {
		console.error('Failed to update actor resources:', error);
		throw error;
	}
}

/**
 * Simplified resource change function for common operations like +/- buttons
 */
export async function changeActorResource(actor: ActorLike, resource: Resource, delta: number): Promise<number> {
	if (!actor) throw new Error('Actor not found');

	// Get current props and create character sheet
	const currentProps = getCurrentActorProps(actor);
	const characterSheet = CharacterSheet.from(currentProps);

	// Apply the change and get new value
	const newValue = characterSheet.updateResource(resource, delta);

	// Update with new props
	const updatedProps = { ...currentProps, [resource]: newValue.toString() };
	await updateActorResources(actor, updatedProps);

	return newValue;
}

/**
 * Perform a long rest for the actor
 */
export async function performLongRest(actor: ActorLike): Promise<void> {
	if (!actor) throw new Error('Actor not found');

	const currentProps = getCurrentActorProps(actor);
	const characterSheet = CharacterSheet.from(currentProps);
	const updatedProps = { ...currentProps };

	// Apply long rest logic
	Object.values(Resource).forEach(resource => {
		const { current, max } = characterSheet.getResource(resource);
		const updatedValue = resource === Resource.HeroismPoint ? (current < max ? current + 1 : max) : max;
		updatedProps[resource] = updatedValue.toString();
	});

	await updateActorResources(actor, updatedProps);
}

/**
 * Consume resources for an action
 */
export async function consumeActionResources(
	actor: ActorLike,
	resourceCosts: Array<{ resource: Resource; amount: number }>,
): Promise<void> {
	if (!actor) throw new Error('Actor not found');

	const currentProps = getCurrentActorProps(actor);
	const characterSheet = CharacterSheet.from(currentProps);
	const updatedProps = { ...currentProps };

	// Check if all resources are available
	for (const cost of resourceCosts) {
		const { current } = characterSheet.getResource(cost.resource);
		if (current < cost.amount) {
			throw new Error(`Insufficient ${cost.resource}: has ${current}, needs ${cost.amount}`);
		}
	}

	// Apply all costs
	for (const cost of resourceCosts) {
		const newValue = characterSheet.updateResource(cost.resource, -cost.amount);
		updatedProps[cost.resource] = newValue.toString();
	}

	await updateActorResources(actor, updatedProps);
}

/**
 * Get current actor props with proper fallback handling
 */
function getCurrentActorProps(actor: ActorLike): Record<string, string> {
	return parseCharacterProps(actor);
}

/**
 * Force refresh any open actor sheets to reflect the updated data
 */
async function refreshActorSheets(actor: ActorLike): Promise<void> {
	try {
		// Get all rendered applications and find ones for this actor
		const ui = getUI();
		const apps = ui.windows;
		if (!apps) return;

		for (const app of Object.values(apps)) {
			// Check if this is an actor sheet for our actor
			if (app.actor?.id === actor.id && app.render) {
				// Force a render to refresh the data
				await app.render(false);
			}
		}
	} catch (error) {
		console.warn('Failed to refresh actor sheets:', error);
	}
}

/**
 * Synchronize resources to any existing tokens for this actor
 */
async function syncTokenResources(
	actor: ActorLike,
	systemResourceData: Record<string, { value: number; max: number }>,
): Promise<void> {
	try {
		// Get all tokens for this actor
		const actorWithTokens = actor as {
			getActiveTokens?: () => Array<{
				document?: {
					update?: (data: Record<string, unknown>) => Promise<unknown>;
					actorData?: Record<string, unknown>;
				};
			}>;
		};
		const tokens = actorWithTokens.getActiveTokens?.() || [];

		// Update each token's actor data
		for (const token of tokens) {
			try {
				if (token.document?.update) {
					// Update both the token's actor data and delta source
					await token.document.update({
						'actorData.system.resources': systemResourceData,
						// Also update the delta source to ensure changes propagate
						'delta.system.resources': systemResourceData,
					});
				}
			} catch (error) {
				console.warn('Failed to sync token resources:', error);
			}
		}

		// Additionally, force refresh any token sheets that might be open
		await refreshTokenSheets(actor);
	} catch (error) {
		console.warn('Failed to sync token resources:', error);
	}
}

/**
 * Force refresh any open token sheets to reflect the updated data
 */
async function refreshTokenSheets(actor: ActorLike): Promise<void> {
	try {
		const ui = getUI();
		const apps = ui.windows;
		if (!apps) return;

		for (const app of Object.values(apps)) {
			// Check if this is a token sheet for our actor
			const tokenApp = app as {
				token?: { actor?: { id?: string } };
				render?: (force?: boolean) => Promise<unknown>;
			};
			if (tokenApp.token?.actor?.id === actor.id && tokenApp.render) {
				await tokenApp.render(false);
			}
		}
	} catch (error) {
		console.warn('Failed to refresh token sheets:', error);
	}
}

function getSystemResourceData(sheet: CharacterSheet): Record<string, { value: number; max: number }> {
	return {
		hp: extractResource(sheet, Resource.HeroismPoint),
		vp: extractResource(sheet, Resource.VitalityPoint),
		fp: extractResource(sheet, Resource.FocusPoint),
		sp: extractResource(sheet, Resource.SpiritPoint),
		ap: extractResource(sheet, Resource.ActionPoint),
	};
}

function extractResource(sheet: CharacterSheet, resource: Resource): { value: number; max: number } {
	const info = sheet.getResource(resource);
	return { value: info.current, max: info.max };
}
