import { Condition } from '@shattered-wilds/commons';
import { ActorLike } from './foundry-shim.js';

export async function ensureActorDataPersistence(actor: ActorLike): Promise<void> {
	try {
		const props = getCharacterProps(actor);
		if (Object.keys(props).length > 0) {
			if (actor.update) {
				await actor.update({
					'prototypeToken.actorData.flags.shattered-wilds.props': props,
				});
			}
		}
	} catch (err) {
		console.warn('Failed to ensure actor data persistence:', err);
	}
}

export function getCharacterProps(actor: ActorLike): Record<string, string> {
	const flags = getRawCharacterFlags(actor) as { props?: Record<string, string> } | undefined;
	return { ...flags?.props };
}

export function getCharacterConditions(actor: ActorLike): Condition[] {
	const flags = getRawCharacterFlags(actor) as { conditions?: Condition[] } | undefined;
	return [...(flags?.conditions || [])];
}

export function getRawCharacterFlags(actor: ActorLike): Record<string, unknown> {
	try {
		const flags = actor.flags as Record<string, unknown> | undefined;
		return (flags?.['shattered-wilds'] as Record<string, unknown>) || {};
	} catch (err) {
		console.warn('Failed to get character props:', err);
		return {};
	}
}
