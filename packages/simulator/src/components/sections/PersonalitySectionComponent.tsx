import { CharacterSheet } from '@shattered-wilds/d12';
import React from 'react';

import { useStore } from '../../store';
import Block from '../shared/Block';
import LabeledTextArea from '../shared/LabeledTextArea';

interface PersonalitySectionProps {
	characterId: string;
}

export const PersonalitySectionComponent: React.FC<PersonalitySectionProps> = ({ characterId }) => {
	const editMode = useStore(state => state.editMode);
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);
	const personality = sheet.personality;
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	return (
		<Block>
			<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Personality</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
				<LabeledTextArea
					label='Backstory'
					value={personality.backstory ?? ''}
					rows={4}
					onBlur={value => updateCharacterProp(character, 'backstory', value)}
					disabled={!editMode}
				/>
				<hr style={{ width: '100%', color: 'white' }} />
				<LabeledTextArea
					label='Calling'
					value={personality.calling ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'calling', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Vice'
					value={personality.vice ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'vice', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Aversion'
					value={personality.aversion ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'aversion', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Tenet'
					value={personality.tenet ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'tenet', value)}
					disabled={!editMode}
				/>
				<LabeledTextArea
					label='Leanings'
					value={personality.leanings ?? ''}
					rows={2}
					onBlur={value => updateCharacterProp(character, 'leanings', value)}
					disabled={!editMode}
				/>
			</div>
		</Block>
	);
};
