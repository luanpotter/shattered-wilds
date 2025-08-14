import React from 'react';

import { useStore } from '../store';

import Block from './shared/Block';
import LabeledTextArea from './shared/LabeledTextArea';

interface MiscSectionProps {
	characterId: string;
}

export const MiscSection: React.FC<MiscSectionProps> = ({ characterId }) => {
	const editMode = useStore(state => state.editMode);
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	return (
		<Block>
			<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Misc</h3>
			<LabeledTextArea
				rows={8}
				value={character.props['misc'] ?? ''}
				onBlur={value => updateCharacterProp(character, 'misc', value)}
				disabled={!editMode}
			/>
		</Block>
	);
};
