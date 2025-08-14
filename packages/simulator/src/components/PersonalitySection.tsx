import React from 'react';

import { useStore } from '../store';

import Block from './shared/Block';
import LabeledTextArea from './shared/LabeledTextArea';

interface PersonalitySectionProps {
	characterId: string;
}

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({ characterId }) => {
	const editMode = useStore(state => state.editMode);
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	return (
		<Block>
			<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Personality</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
				<LabeledTextArea
					label='Calling'
					value={character.props['calling'] ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'calling', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Vice'
					value={character.props['vice'] ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'vice', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Aversion'
					value={character.props['aversion'] ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'aversion', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Tenet'
					value={character.props['tenet'] ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'tenet', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Leanings'
					value={character.props['leanings'] ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'leanings', value)}
					disabled={!editMode}
				/>
			</div>
		</Block>
	);
};
