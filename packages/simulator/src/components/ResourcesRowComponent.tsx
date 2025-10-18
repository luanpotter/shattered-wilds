import { CharacterSheet, Resource } from '@shattered-wilds/commons';
import React from 'react';

import { useStore } from '../store';

import { ResourceInputComponent } from './ResourceInputComponent';

export const ResourcesRowComponent: React.FC<{
	variant: 'normal' | 'inline';
	characterId: string;
}> = ({ variant, characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);

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
		</>
	);
};
