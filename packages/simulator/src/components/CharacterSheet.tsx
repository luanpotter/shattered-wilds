import React from 'react';

import { useStore } from '../store';
import { Character } from '../types';

interface CharacterSheetProps {
	character: Character;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
	const updateCharacter = useStore(state => state.updateCharacter);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacter({ ...character, name: e.target.value });
	};

	return (
		<div>
			<div style={{ marginBottom: '8px' }}>
				<label
					htmlFor='character-name'
					style={{ fontSize: '0.9em', display: 'block', marginBottom: '2px' }}
				>
					Name:
				</label>
				<input
					id='character-name'
					type='text'
					value={character.name}
					onChange={handleNameChange}
					style={{
						width: 'calc(100% - 8px)',
						boxSizing: 'border-box',
						fontSize: '0.9em',
						padding: '4px',
					}}
				/>
			</div>
			{/* Add more character sheet fields here */}
		</div>
	);
};
