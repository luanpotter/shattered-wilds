import { ActorLike } from './foundry-shim.js';
import { CharacterSheet, Resource } from '@shattered-wilds/commons';

/**
 * Updates actor flags and system data for resources, and prototype token for new tokens.
 * Use this everywhere you change resource values.
 */
export async function updateActorResources(actor: ActorLike, updatedProps: Record<string, string>): Promise<void> {
	if (!actor) return;
	// Update flags in memory and persistently
	if (actor.setFlag) {
		await actor.setFlag('shattered-wilds', 'props', updatedProps);
	}
	// Update system data and flags for persistence
	const characterSheet = CharacterSheet.from(updatedProps);
	if (actor.update) {
		await actor.update({
			'flags.shattered-wilds.props': updatedProps,
			'system.resources': getSystemResourceData(characterSheet),
			'prototypeToken.actorData.flags.shattered-wilds.props': updatedProps,
		});
	}
}

function getSystemResourceData(sheet: CharacterSheet): Record<string, { value: number; max: number }> {
	// Map our resources to the system data structure
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
