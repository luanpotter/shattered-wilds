import { ActorLike, Foundry } from '../foundry-shim.js';
import { CharacterSheet, Resource } from '@shattered-wilds/commons';
import { parseCharacterProps, sanitizeProps } from './character.js';

/**
 * Centralized resource management for all resource updates.
 * This is the single source of truth for resource changes.
 * Handles actor flags, system data, token synchronization, and cache invalidation.
 */
export async function updateActorProps(actor: ActorLike, updatedProps: Record<string, string>): Promise<void> {
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

export async function syncResourcesToSystemData(actor: ActorLike, characterSheet: CharacterSheet): Promise<void> {
	try {
		const resourceData: Record<string, { value: number; max: number }> = {};

		// Map our resources to the system data structure
		const resourceMapping = {
			hp: Resource.HeroismPoint,
			vp: Resource.VitalityPoint,
			fp: Resource.FocusPoint,
			sp: Resource.SpiritPoint,
			ap: Resource.ActionPoint,
		};

		// Get current resource values from character sheet
		for (const [systemKey, resourceEnum] of Object.entries(resourceMapping)) {
			const resourceInfo = characterSheet.getResource(resourceEnum);
			resourceData[systemKey] = {
				value: resourceInfo.current,
				max: resourceInfo.max,
			};
		}

		const currentSystemData = actor.system?.resources || {};
		let needsUpdate = false;

		for (const [key, data] of Object.entries(resourceData)) {
			const current = currentSystemData[key];
			if (!current || current.value !== data.value || current.max !== data.max) {
				needsUpdate = true;
				break;
			}
		}

		if (needsUpdate && actor.update) {
			await actor.update({
				'system.resources': resourceData,
			});
		}
	} catch (err) {
		console.warn('Failed to sync resources to system data:', err);
	}
}

/**
 * Simplified resource change function for common operations like +/- buttons
 */
export async function changeActorResource(actor: ActorLike, resource: Resource, delta: number): Promise<number> {
	if (!actor) throw new Error('Actor not found');

	// Get current props and create character sheet
	const currentProps = parseCharacterProps(actor);
	const characterSheet = CharacterSheet.from(currentProps);

	// Apply the change and get new value
	const newValue = characterSheet.updateResourceByDelta(resource, delta);

	// Update with new props
	const updatedProps = { ...currentProps, [resource]: newValue.toString() };
	await updateActorProps(actor, updatedProps);

	return newValue;
}

/**
 * Perform a long rest for the actor
 */
export async function performLongRest(actor: ActorLike): Promise<void> {
	if (!actor) throw new Error('Actor not found');

	const currentProps = parseCharacterProps(actor);
	const characterSheet = CharacterSheet.from(currentProps);
	const updatedProps = { ...currentProps };

	// Apply long rest logic
	Object.values(Resource).forEach(resource => {
		const { current, max } = characterSheet.getResource(resource);
		const updatedValue = resource === Resource.HeroismPoint ? (current < max ? current + 1 : max) : max;
		updatedProps[resource] = updatedValue.toString();
	});

	await updateActorProps(actor, updatedProps);
}

/**
 * Consume resources for an action
 */
export async function consumeActionResources(
	actor: ActorLike,
	resourceCosts: Array<{ resource: Resource; amount: number }>,
): Promise<void> {
	if (!actor) throw new Error('Actor not found');

	const currentProps = parseCharacterProps(actor);
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
		const newValue = characterSheet.updateResourceByDelta(cost.resource, -cost.amount);
		updatedProps[cost.resource] = newValue.toString();
	}

	await updateActorProps(actor, updatedProps);
}

/**
 * Force refresh any open actor sheets to reflect the updated data
 */
async function refreshActorSheets(actor: ActorLike): Promise<void> {
	// Get all rendered applications and find ones for this actor
	const windows = Foundry.ui.windows;

	for (const window of Object.values(windows)) {
		if (window.actor?.id === actor.id) {
			await window.render(false);
		}
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
	const windows = Foundry.ui.windows;
	for (const window of Object.values(windows)) {
		if (window.token?.actor?.id === actor.id) {
			await window.render(false);
		}
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
