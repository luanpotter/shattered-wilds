import React, { useState, useEffect } from 'react';

import { useStore } from '../store';

interface CharacterCreationProps {
  hexPosition?: { q: number; r: number };
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ hexPosition }) => {
  const addCharacter = useStore((state) => state.addCharacter);
  const characters = useStore((state) => state.characters);
  const removeWindow = useStore((state) => state.removeWindow);
  const windows = useStore((state) => state.windows);
  const [characterName, setCharacterName] = useState('');

  // Set default name on mount
  useEffect(() => {
    setCharacterName(`Character ${characters.length + 1}`);
  }, [characters.length]);

  const handleCreateCharacter = () => {
    if (characterName.trim()) {
      const newCharacter = {
        id: window.crypto.randomUUID(),
        name: characterName.trim(),
      };

      // If we have hex position, add it to the character
      if (hexPosition) {
        Object.assign(newCharacter, { position: hexPosition });
      }

      addCharacter(newCharacter);

      // Find and close this window
      const currentWindow = windows.find(
        (w) => w.type === 'character-creation' && 
        (hexPosition 
          ? w.hexPosition?.q === hexPosition.q && w.hexPosition?.r === hexPosition.r
          : !w.hexPosition)
      );
      
      if (currentWindow) {
        removeWindow(currentWindow.id);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        <label htmlFor="character-name" style={{ fontSize: '0.9em', display: 'block', marginBottom: '2px' }}>Name:</label>
        <input
          id="character-name"
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          style={{ 
            width: "calc(100% - 8px)", 
            boxSizing: "border-box",
            padding: "4px",
            fontSize: "0.9em"
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
        <button 
          onClick={handleCreateCharacter}
          style={{ fontSize: "0.9em", padding: "4px 8px" }}
        >
          Create
        </button>
      </div>
    </div>
  );
}; 