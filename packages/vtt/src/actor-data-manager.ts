// Utility to manage actor data persistence and ensure character data survives token creation

import { getGame } from './foundry-shim.js';

export interface ActorLike {
	id?: string;
	name?: string;
	flags?: Record<string, unknown>;
	prototypeToken?: {
		actorData?: {
			flags?: Record<string, unknown>;
		};
		flags?: Record<string, unknown>;
	};
	update?: (data: Record<string, unknown>) => Promise<unknown>;
	setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
}

// Ensure actor data is preserved in the prototype token for new token creation
export async function ensureActorDataPersistence(actor: ActorLike): Promise<void> {
	try {
		const flags = actor.flags as Record<string, unknown> | undefined;
		const swFlags = flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined;
		const props = swFlags?.props ?? {};

		// If the actor has character data, ensure it's embedded in the prototype token
		if (Object.keys(props).length > 0) {
			// Store the character props in the prototype token's actor data
			// This ensures that when new tokens are created, they inherit the character data
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

// Get actor data with multiple fallback strategies
export function getActorData(actorId: string | undefined): ActorLike | null {
	if (!actorId) return null;

	try {
		const game = getGame();
		const actors = (game as { actors?: { get?: (id: string) => unknown } }).actors;

		// Try to get from the game's actor collection
		const actor = actors?.get?.(actorId) as ActorLike | undefined;
		if (actor) {
			return actor;
		}

		// Try to get from the global actor registry (fallback)
		const globalThis = window as unknown as { game?: { actors?: { contents?: ActorLike[] } } };
		const allActors = globalThis.game?.actors?.contents || [];
		const foundActor = allActors.find(a => a.id === actorId);

		return foundActor || null;
	} catch (err) {
		console.warn('Failed to retrieve actor data:', err);
		return null;
	}
}

// Ensure character props are accessible via multiple paths for robustness
export function getCharacterProps(actor: ActorLike): Record<string, string> {
	if (!actor || !actor.id) return {};

	try {
		// Debug logging to track prop access
		console.error(`Getting props for actor ${actor.id} (${actor.name})`);

		// Primary path: actor flags
		const flags = actor.flags as Record<string, unknown> | undefined;
		const swFlags = flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined;
		let props = swFlags?.props ?? {};

		// Debug the primary path
		console.error(`Primary props for ${actor.id}:`, Object.keys(props).length, 'items');
		console.error(`Actor flags structure:`, {
			hasFlags: !!flags,
			flagsKeys: flags ? Object.keys(flags) : [],
			hasSWFlags: !!swFlags,
			swFlagsKeys: swFlags ? Object.keys(swFlags) : [],
			hasProps: !!swFlags?.props,
			propsKeys: swFlags?.props ? Object.keys(swFlags.props) : [],
		});

		// Fallback path: prototype token actor data (for tokens created from prototypes)
		if (Object.keys(props).length === 0) {
			const prototypeFlags = actor.prototypeToken?.actorData?.flags as Record<string, unknown> | undefined;
			const prototypeSWFlags = prototypeFlags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined;
			const prototypeProps = prototypeSWFlags?.props;
			if (prototypeProps) {
				props = prototypeProps;
				console.debug(`Using prototype props for ${actor.id}:`, Object.keys(props).length, 'items');
			}
		}

		// Return a copy to prevent shared references
		return { ...props };
	} catch (err) {
		console.warn('Failed to get character props:', err);
		return {};
	}
}
