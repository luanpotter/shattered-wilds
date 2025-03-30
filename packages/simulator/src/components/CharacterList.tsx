import React, { useState } from 'react';
import { FaPlus, FaEdit } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';

export const CharacterList: React.FC = () => {
  const characters = useStore((state) => state.characters);
  const addWindow = useStore((state) => state.addWindow);
  const addCharacter = useStore((state) => state.addCharacter);
  const [newCharacterName, setNewCharacterName] = useState('');

  const handleAddCharacter = () => {
    if (newCharacterName.trim()) {
      addCharacter({
        id: window.crypto.randomUUID(),
        name: newCharacterName.trim(),
      });
      setNewCharacterName('');
    }
  };

  const handleOpenCharacterSheet = (character: Character) => {
    addWindow({
      id: window.crypto.randomUUID(),
      title: `${character.name}'s Sheet`,
      type: 'character-sheet',
      characterId: character.id,
      position: { x: 100, y: 100 },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          placeholder="New character name"
          style={{ flex: 1 }}
        />
        <button onClick={handleAddCharacter}>
          <FaPlus /> Add
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {characters.map((character) => (
          <div
            key={character.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              border: '1px solid var(--text)',
              borderRadius: '4px',
            }}
          >
            <span>{character.name}</span>
            <button onClick={() => handleOpenCharacterSheet(character)}>
              <FaEdit /> Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 