import React from 'react';
import { FaUsers, FaCrosshairs } from 'react-icons/fa';

import { CharacterList } from './components/CharacterList';
import { CharacterSheet } from './components/CharacterSheet';
import { DraggableWindow } from './components/DraggableWindow';
import { BattleGrid } from './components/HexGrid';
import { useStore } from './store';

const App = (): React.ReactElement => {
  const windows = useStore((state) => state.windows);
  const characters = useStore((state) => state.characters);
  const addWindow = useStore((state) => state.addWindow);
  const updateGridState = useStore((state) => state.updateGridState);

  const handleOpenCharacterList = () => {
    addWindow({
      id: window.crypto.randomUUID(),
      title: 'Characters',
      type: 'character-list',
      position: { x: 100, y: 100 },
      isMinimized: false,
    });
  };

  const handleRecenter = () => {
    updateGridState({
      scale: 1,
      offset: { x: 0, y: 0 },
    });
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      width: '100%'
    }}>
      <header style={{ 
        padding: '1rem',
        borderBottom: '1px solid var(--text)',
        flexShrink: 0,
        width: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ margin: '0 auto' }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0 }}>D12 Simulator</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleOpenCharacterList}>
                <FaUsers /> Characters
              </button>
              <button onClick={handleRecenter}>
                <FaCrosshairs /> Re-center
              </button>
            </div>
          </div>
        </div>
      </header>
      <main style={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100vw',
          height: '100%',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0 16px',
          boxSizing: 'border-box'
        }}>
          <BattleGrid />
        </div>
      </main>
      <footer style={{ 
        padding: '1rem',
        borderTop: '1px solid var(--text)',
        flexShrink: 0,
        marginTop: '-8px',
        width: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ margin: '0 auto' }}>
          <p style={{ margin: 0, paddingBottom: '8px' }}>&copy; 2025 - D12 Simulator - Luan Nico</p>
        </div>
      </footer>
      {windows.map((window) => (
        <DraggableWindow key={window.id} window={window}>
          {window.type === 'character-sheet' && window.characterId && (
            <CharacterSheet
              character={characters.find((c) => c.id === window.characterId) ?? {
                id: window.characterId,
                name: 'Unknown Character',
              }}
            />
          )}
          {window.type === 'character-list' && <CharacterList />}
        </DraggableWindow>
      ))}
    </div>
  );
};

export default App;
