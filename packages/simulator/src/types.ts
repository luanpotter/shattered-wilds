export interface Character {
  id: string;
  name: string;
  position?: {
    q: number;
    r: number;
  };
}

export interface Window {
  id: string;
  title: string;
  type: 'character-sheet' | 'character-list';
  characterId?: string;
  position: {
    x: number;
    y: number;
  };
  isMinimized: boolean;
}

export interface GridState {
  scale: number;
  offset: {
    x: number;
    y: number;
  };
} 