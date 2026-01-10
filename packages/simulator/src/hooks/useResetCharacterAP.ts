import { CharacterSheet, Resource } from '@shattered-wilds/d12';

import { useStore } from '../store';

import { PropUpdater } from './usePropUpdates';

export const useResetCharacterAP = () => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	return (characterId: string) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			return;
		}
		const sheet = CharacterSheet.from(character.props);
		const propUpdater = new PropUpdater({ character, sheet, updateCharacterProp });
		propUpdater.updateResourceToMax(Resource.ActionPoint);
	};
};
