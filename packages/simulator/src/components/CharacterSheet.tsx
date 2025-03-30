import React, { useEffect } from 'react';

import { useStore } from '../store';
import { Character } from '../types';

interface CharacterSheetProps {
	character: Character;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
	const updateCharacter = useStore(state => state.updateCharacter);
	const windows = useStore(state => state.windows);
	const updateWindow = useStore(state => state.updateWindow);

	// Update window title when character name changes
	useEffect(() => {
		// Find the window for this character
		const characterWindow = windows.find(
			w => w.type === 'character-sheet' && w.characterId === character.id
		);

		if (characterWindow) {
			// Only update if the title doesn't match the current character name
			const expectedTitle = `${character.sheet.name}'s Sheet`;
			if (characterWindow.title !== expectedTitle) {
				updateWindow({
					...characterWindow,
					title: expectedTitle,
				});
			}
		}
	}, [character.sheet.name, character.id, windows, updateWindow]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacter({
			...character,
			sheet: {
				...character.sheet,
				name: e.target.value,
			},
		});
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
					value={character.sheet.name}
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
