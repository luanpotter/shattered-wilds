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
      <div style={{ marginBottom: '8px', display: 'flex', gap: '4px' }}>
        <input
          type="text"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          placeholder="New character name"
          style={{ 
            flex: 1, 
            boxSizing: 'border-box', 
            fontSize: '0.9em',
            padding: '4px'
          }}
        />
        <button onClick={handleAddCharacter} style={{ padding: '4px 8px', fontSize: '0.9em' }}>
          <FaPlus /> Add
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9em' }}>
        {characters.map((character) => (
          <div
            key={character.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 6px',
              border: '1px solid var(--text)',
              borderRadius: '4px',
            }}
          >
            <span>{character.name}</span>
            <button onClick={() => handleOpenCharacterSheet(character)} style={{ padding: '2px 6px', fontSize: '0.9em' }}>
              <FaEdit /> Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 