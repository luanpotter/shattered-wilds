import React from 'react';

import { useStore } from '../store';

import Block from './shared/Block';

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
			<textarea
				defaultValue={character.props['misc'] ?? ''}
				onBlur={e => updateCharacterProp(character, 'misc', e.target.value)}
				disabled={!editMode}
				style={{
					width: '100%',
					minHeight: '200px',
					background: 'var(--background-alt)',
					color: 'var(--text)',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					padding: '8px',
					boxSizing: 'border-box',
				}}
			/>
		</Block>
	);
};
