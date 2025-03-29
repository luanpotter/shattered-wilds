import React from 'react';

import { useStore } from '../store';
import { Character } from '../types';

interface CharacterSheetProps {
  character: Character;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  const updateCharacter = useStore((state) => state.updateCharacter);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCharacter({ ...character, name: e.target.value });
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="character-name">Name:</label>
        <input
          id="character-name"
          type="text"
          value={character.name}
          onChange={handleNameChange}
          style={{ width: '100%' }}
        />
      </div>
      {/* Add more character sheet fields here */}
    </div>
  );
}; 