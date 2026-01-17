import { CharacterSheet, DivineSection } from '@shattered-wilds/d12';
import React from 'react';

import { useStore } from '../../store';
import { ActionRowComponent } from '../ActionRowComponent';
import { Bar } from '../shared/Bar';
import Block from '../shared/Block';
import LabeledInput from '../shared/LabeledInput';

interface DivineSectionProps {
	characterId: string;
}

export const DivineSectionComponent: React.FC<DivineSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const characterSheet = CharacterSheet.from(character.props);

	const divineSection = DivineSection.create({ characterId, characterSheet });

	if (!divineSection) {
		return null; // not a mystic
	}

	return <DivineSectionInner characterId={characterId} divineSection={divineSection} />;
};

const DivineSectionInner: React.FC<{
	characterId: string;
	divineSection: DivineSection;
}> = ({ characterId, divineSection }) => {
	const { influenceRange, baseModifier, pureDivineChanneling } = divineSection;

	return (
		<Block>
			<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Divine</h3>
			<div style={{ display: 'flex', gap: '8px' }}>
				<LabeledInput
					variant='normal'
					label='Base Modifier'
					value={`${baseModifier.name} (${baseModifier.value.description})`}
					tooltip={baseModifier.description}
					disabled
				/>
				<LabeledInput
					variant='normal'
					label='Range Increment'
					tooltip={influenceRange.description}
					value={influenceRange.value.description}
					disabled
				/>
			</div>
			<Bar />
			<ActionRowComponent actionRow={pureDivineChanneling} characterId={characterId} />
		</Block>
	);
};
