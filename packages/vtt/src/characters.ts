import { CharacterSheet } from '@shattered-wilds/commons';
import { getCharacterProps } from './actor-data-manager';
import { ActorLike } from './foundry-shim';

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
