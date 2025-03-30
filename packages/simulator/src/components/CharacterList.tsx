import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';

export const CharacterList: React.FC = () => {
  const characters = useStore((state) => state.characters);
  const addWindow = useStore((state) => state.addWindow);
  const addCharacter = useStore((state) => state.addCharacter);
  const removeCharacter = useStore((state) => state.removeCharacter);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const handleRequestDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      removeCharacter(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  return (
    <div>
      {confirmDelete && (
        <div style={{
          padding: '6px',
          marginBottom: '8px',
          backgroundColor: 'var(--background-alt)',
          border: '1px solid var(--text)',
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          <p style={{ margin: '0 0 6px 0' }}>
            Delete {characters.find(c => c.id === confirmDelete)?.name}?
          </p>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleCancelDelete}
              style={{ padding: '2px 6px', fontSize: '0.9em' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete}
              style={{ 
                padding: '2px 6px', 
                fontSize: '0.9em',
                backgroundColor: 'var(--error)',
                color: 'white'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
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
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleOpenCharacterSheet(character)} style={{ padding: '2px 6px', fontSize: '0.9em' }}>
                <FaEdit /> Edit
              </button>
              <button 
                onClick={() => handleRequestDelete(character.id)}
                style={{ 
                  padding: '2px 6px', 
                  fontSize: '0.9em',
                }} 
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 