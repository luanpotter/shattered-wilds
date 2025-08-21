import { CharacterSheet } from '@shattered-wilds/commons';
import { ActorLike, getCharacterProps } from './actor-data-manager';

export const parseCharacterSheet = (actor: ActorLike): CharacterSheet | undefined => {
	if (!actor) return undefined;

	const rawProps = getCharacterProps(actor);
	const props = Object.fromEntries(
		Object.entries(rawProps).map(([key, value]) => {
			if (key.startsWith('feat_')) {
				// Convert feat_1_Minor_0 back to feat.1.Minor.0
				const transformedKey = key.replace(/^feat_(\d+)_(\w+)_(\d+)$/, 'feat.$1.$2.$3');
				return [transformedKey, value];
			} else if (key.includes('_')) {
				// Convert other sanitized keys back to dot notation (e.g., upbringing_plus -> upbringing.plus)
				const transformedKey = key.replace(/_/g, '.');
				return [transformedKey, value];
			}
			return [key, value];
		}),
	);

	try {
		if (Object.keys(props).length > 0) {
			return CharacterSheet.from(props);
		}
	} catch (err) {
		console.warn('Failed to create CharacterSheet:', err);
	}
	return undefined;
};
