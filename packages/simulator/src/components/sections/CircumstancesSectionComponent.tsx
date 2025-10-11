import { CharacterSheet, CircumstancesSection, Resource } from '@shattered-wilds/commons';
import React from 'react';

import { useStore } from '../../store';
import Block from '../shared/Block';

export const CircumstancesSectionComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const characterSheet = CharacterSheet.from(character.props);

	const circumstancesSection = CircumstancesSection.create({ characterSheet });

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Circumstances</h3>
			</div>
			CIRCUMSTANCES :: {circumstancesSection.resources[Resource.HeroismPoint].current}
		</Block>
	);
};
