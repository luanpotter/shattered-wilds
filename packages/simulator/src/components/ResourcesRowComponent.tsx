import { CharacterSheet, CurrentResources, Resource } from '@shattered-wilds/commons';
import React from 'react';
import { FaBatteryFull } from 'react-icons/fa';

import { useStore } from '../store';

import { ResourceInputComponent } from './ResourceInputComponent';
import { Button } from './shared/Button';

export const ResourcesRowComponent: React.FC<{
	variant: 'normal' | 'inline';
	characterId: string;
}> = ({ variant, characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);

	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const handleRefillPoints = () => {
		Object.values(Resource).forEach(resource => {
			updateCharacterProp(character, resource, CurrentResources.MAX_VALUE.toString());
		});
	};
	return (
		<>
			{Object.values(Resource).map(resource => (
				<ResourceInputComponent
					key={resource}
					variant={variant}
					character={character}
					sheet={sheet}
					resource={resource}
				/>
			))}
			<div style={{ display: 'flex', alignItems: 'end', marginBottom: '0.75rem' }}>
				<Button variant={variant} title='Refill points' icon={FaBatteryFull} onClick={handleRefillPoints} />
			</div>
		</>
	);
};
