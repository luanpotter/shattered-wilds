import React, { useRef, useEffect, useState, useCallback } from "react";

import { useStore } from "../store";
import { Point, Character } from "../types";

const generateHexes = (width: number, height: number) => {
  const hexes = [];
  for (let q = -width; q <= width; q++) {
    for (let r = -height; r <= height; r++) {
      hexes.push({ q, r });
    }
  }
  return hexes;
};

const Hex: React.FC<{
  q: number;
  r: number;
  onDoubleClick: () => void;
  children?: React.ReactNode;
}> = ({ q, r, children }) => {
  // Convert axial coordinates to pixel coordinates
  const x = q * 10 + r * 5;
  const y = r * 8.66; // sqrt(3) * 5

  return <g transform={`translate(${x},${y})`}>{children}</g>;
};

interface BattleGridProps {
  disabled?: boolean;
  dragState: {
    type: "none" | "window" | "grid" | "character";
    objectId?: string;
    startPosition?: Point;
  };
  onStartCharacterDrag: (character: Character, startPosition: Point) => void;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
  disabled,
  dragState,
  onStartCharacterDrag,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const characters = useStore((state) => state.characters);
  const gridState = useStore((state) => state.gridState);
  const updateGridState = useStore((state) => state.updateGridState);
  const addCharacter = useStore((state) => state.addCharacter);
  const addWindow = useStore((state) => state.addWindow);
  const [ghostPosition, setGhostPosition] = useState<Point | null>(null);

  // This function converts screen coordinates to SVG user space coordinates
  const screenToSvgCoordinates = useCallback(
    (x: number, y: number): Point | null => {
      if (!svgRef.current) return null;

      // Get the SVG element's CTM (Current Transformation Matrix)
      const svg = svgRef.current;

      // Create a point in screen coordinates
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;

      // Get the current transformation matrix and its inverse
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const inverseCtm = ctm.inverse();

      // Transform the point from screen to SVG user space
      const transformedPoint = point.matrixTransform(inverseCtm);

      return { x: transformedPoint.x, y: transformedPoint.y };
    },
    [],
  );

  useEffect(() => {
    if (
      dragState.type === "character" &&
      dragState.startPosition &&
      svgRef.current
    ) {
      const svgCoords = screenToSvgCoordinates(
        dragState.startPosition.x,
        dragState.startPosition.y
      );

      if (svgCoords) {
        setGhostPosition(svgCoords);
      }
    } else {
      setGhostPosition(null);
    }
  }, [dragState, screenToSvgCoordinates]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    updateGridState({
      scale: Math.max(0.5, Math.min(2, gridState.scale * delta)),
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (disabled) return;
    if (e.buttons === 4) {
      updateGridState({
        offset: {
          x: gridState.offset.x + e.movementX / gridState.scale,
          y: gridState.offset.y + e.movementY / gridState.scale,
        },
      });
    }
  };

  const handleCharacterMouseDown = (
    e: React.MouseEvent,
    character: Character
  ) => {
    if (e.button === 0) {
      // Left click - drag
      e.preventDefault();
      e.stopPropagation();

      const pos = { x: e.clientX, y: e.clientY };
      onStartCharacterDrag(character, pos);
    } else if (e.button === 2) {
      // Right click - open character sheet
      e.preventDefault();
      e.stopPropagation();
      
      handleOpenCharacterSheet(character);
    }
  };

  const handleHexDoubleClick = ({ q, r }: { q: number; r: number }) => {
    // Check if there's already a character at this position
    const existingCharacter = characters.find(
      (c) => c.position?.q === q && c.position?.r === r
    );

    if (!existingCharacter) {
      addCharacter({
        id: window.crypto.randomUUID(),
        name: `Character ${characters.length + 1}`,
        position: { q, r },
      });
    }
  };

  const handleOpenCharacterSheet = (character: Character) => {
    addWindow({
      id: window.crypto.randomUUID(),
      title: `${character.name}'s Sheet`,
      type: "character-sheet",
      characterId: character.id,
      position: { x: 100, y: 100 },
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click
      e.preventDefault(); // Prevent the scroll markers from appearing
    } else if (e.button === 2) {
      // Right click
      e.preventDefault(); // Prevent context menu
    }
  };

  return (
    <div
      ref={gridRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
      onWheel={handleWheel}
      onMouseMove={handleDrag}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu globally
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="-100 -100 200 200"
        style={{
          transform: `scale(${gridState.scale}) translate(${gridState.offset.x}px, ${gridState.offset.y}px)`,
        }}
      >
        {generateHexes(10, 10).map(({ q, r }, i) => (
          <Hex
            key={i}
            q={q}
            r={r}
            onDoubleClick={() => handleHexDoubleClick({ q, r })}
          >
            <path
              d="M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z"
              fill="var(--background-alt)"
              stroke="var(--text)"
              strokeWidth="0.5"
              data-hex={`${q},${r}`}
              style={{
                cursor: dragState.type === "character" ? "grabbing" : "pointer",
              }}
            />
            <g>
              {characters
                .filter((c) => c.position?.q === q && c.position?.r === r)
                .map((character) => (
                  <g
                    key={character.id}
                    onMouseDown={(e) => handleCharacterMouseDown(e, character)}
                    style={{
                      cursor:
                        dragState.type === "character" &&
                        dragState.objectId === character.id
                          ? "grabbing"
                          : "grab",
                      opacity:
                        dragState.type === "character" &&
                        dragState.objectId === character.id
                          ? 0.3
                          : 1,
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="3"
                      fill="var(--primary)"
                      stroke="var(--text)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="var(--text)"
                      fontSize="4"
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {character.name.slice(0, 2).toUpperCase()}
                    </text>
                  </g>
                ))}
            </g>
          </Hex>
        ))}

        {dragState.type === "character" &&
          dragState.objectId &&
          ghostPosition && (
            <g
              transform={`translate(${ghostPosition.x},${ghostPosition.y})`}
              style={{ pointerEvents: "none" }}
            >
              <circle
                cx="0"
                cy="0"
                r="3"
                fill="var(--primary)"
                stroke="var(--text)"
                strokeWidth="0.5"
                opacity="0.7"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--text)"
                fontSize="4"
                style={{ userSelect: "none" }}
              >
                {(
                  characters.find((c) => c.id === dragState.objectId)?.name ||
                  "??"
                )
                  .slice(0, 2)
                  .toUpperCase()}
              </text>
            </g>
          )}
      </svg>
    </div>
  );
};
