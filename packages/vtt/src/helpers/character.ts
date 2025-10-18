import { CharacterSheet, Condition } from '@shattered-wilds/commons';
import { ActorLike, showNotification } from '../foundry-shim.js';
import { configureDefaultTokenBars } from '../token-bars.js';
import { promptText } from '../modals/modals.js';

export function exportActorPropsToShareString(actor: ActorLike): string {
	const props = parseCharacterProps(actor);
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: ActorLike) {
	const shareString = await promptText({ title: 'Import Character', label: 'Share String' });
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		const sanitizedProps = sanitizeProps(props);
		await actor.setFlag('shattered-wilds', 'props', sanitizedProps);

		// Ensure data persistence for token creation
		await ensureActorDataPersistence(actor);

		// Configure default token bars after successful import
		await configureDefaultTokenBars(actor);

		showNotification('info', 'Character imported');
	} catch (err) {
		console.error('Failed to import character', err);
		showNotification('error', 'Failed to import character');
	}
}

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

export const parseCharacterSheet = (actor: ActorLike): CharacterSheet | undefined => {
	const props = parseCharacterProps(actor);

	try {
		if (Object.keys(props).length > 0) {
			return CharacterSheet.from(props);
		}
	} catch (err) {
		console.warn('Failed to create CharacterSheet:', err);
	}

	return undefined;
};

export const parseCharacterProps = (actor: ActorLike): Record<string, string> => {
	const rawProps = getCharacterProps(actor);
	return unSanitizeProps(rawProps);
};

// Foundry VTT has issues when using dots in property keys

export const unSanitizeProps = (props: Record<string, string>): Record<string, string> => {
	return Object.fromEntries(
		Object.entries(props).map(([key, value]) => {
			const transformedKey = key.replace(/_/g, '.');
			return [transformedKey, value];
		}),
	);
};

export const sanitizeProps = (props: Record<string, string>): Record<string, string> => {
	return Object.fromEntries(
		Object.entries(props).map(([key, value]) => {
			const sanitizedKey = key.replace(/\./g, '_');
			return [sanitizedKey, value];
		}),
	);
};
