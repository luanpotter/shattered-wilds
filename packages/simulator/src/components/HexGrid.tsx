import React, { useRef, useEffect, useState, useCallback } from 'react';

import { useStore } from '../store';
import { CharacterSheet, DragState, Point, Character, HexPosition, Weapon } from '../types';
import { findNextWindowPosition, findCharacterAtPosition, axialToPixel } from '../utils';

import { CharacterToken } from './CharacterToken';
import { TokenContextMenu } from './TokenContextMenu';

const Hex: React.FC<{ q: number; r: number; children?: React.ReactNode }> = ({
	q,
	r,
	children,
}) => {
	const { x, y } = axialToPixel(q, r);
	return <g transform={`translate(${x},${y})`}>{children}</g>;
};

const generateHexes = (width: number, height: number): HexPosition[] => {
	const hexes = [];

	// Create a true rectangular grid with a consistent number of hexes per row/column
	// In axial coordinates:
	// - Going along constant r-value = "diagonal rows"
	// - Going along constant q-value = "vertical columns"

	// Calculate the bounds to make a rectangular visual shape
	// We need to offset the q-values for each row to make a rectangle
	for (let r = -height; r <= height; r++) {
		// Calculate q-offset based on row (r) to ensure a rectangular grid
		// This makes sure each row starts at the right position to form a rectangle
		const qOffset = Math.floor(r / 2);

		// Each row has exactly the same number of hexes (2*width + 1)
		for (let i = 0; i <= 2 * width; i++) {
			// Calculate q value with offset to align the grid into a rectangle
			const q = i - width - qOffset;

			hexes.push({ q, r });
		}
	}

	return hexes;
};

interface BattleGridProps {
	disabled?: boolean;
	dragState: DragState;
	onStartCharacterDrag: (character: Character, startPosition: Point) => void;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
	disabled,
	dragState,
	onStartCharacterDrag,
}) => {
	const gridRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const characters = useStore(state => state.characters);
	const gridState = useStore(state => state.gridState);
	const updateGridState = useStore(state => state.updateGridState);
	const addWindow = useStore(state => state.addWindow);
	const windows = useStore(state => state.windows);
	const editMode = useStore(state => state.editMode);
	const [ghostPosition, setGhostPosition] = useState<Point | null>(null);
	const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		character: Character;
		position: Point;
	} | null>(null);
	const [attackState, setAttackState] = useState<{
		attacker: Character;
		attackIndex: number;
		isSelectingTarget: boolean;
	} | null>(null);

	// This function converts screen coordinates to SVG user space coordinates
	const screenToSvgCoordinates = useCallback((x: number, y: number): Point | null => {
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
	}, []);

	useEffect(() => {
		if (dragState.type === 'character' && dragState.startPosition && svgRef.current) {
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

	const handleCharacterMouseEnter = (character: Character) => {
		setHoveredCharacter(character);
	};

	const handleCharacterMouseLeave = () => {
		// Only clear hover state if we're not dragging
		if (dragState.type !== 'character') {
			setHoveredCharacter(null);
		}
	};

	const handleOpenCharacterSheet = (character: Character) => {
		addWindow({
			id: window.crypto.randomUUID(),
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId: character.id,
			position: findNextWindowPosition(windows),
		});
	};

	const handleAttackAction = (attacker: Character, attackIndex: number) => {
		setAttackState({
			attacker,
			attackIndex,
			isSelectingTarget: true,
		});
	};

	const getAttackRange = (attacker: Character, attackIndex: number): number => {
		const sheet = CharacterSheet.from(attacker.props);
		const attacks = sheet.getBasicAttacks();
		const attack = attacks[attackIndex];

		if (!attack) return 1;

		// Get the weapon from equipment to check traits and range
		const weapon = sheet.equipment.items.find(item => item.name === attack.name);
		if (!weapon) {
			return 1; // Default melee range
		}

		// Check if it's a weapon
		if (weapon instanceof Weapon) {
			// Check for polearm trait (2 hex range)
			if (weapon.traits.some(trait => trait.toLowerCase().includes('polearm'))) {
				return 2;
			}

			// Check for ranged weapon with explicit range
			if (weapon.range && weapon.range > 0) {
				return weapon.range; // Range in meters = range in hexes
			}
		}

		// Default to adjacent (1 hex) for melee
		return 1;
	};

	const handleCharacterMouseDown = (e: React.MouseEvent, character: Character) => {
		if (e.button === 0) {
			// Left click
			if (attackState?.isSelectingTarget) {
				// We're in attack mode - select this character as target
				e.preventDefault();
				e.stopPropagation();

				// Check if the target is within range
				const attackRange = getAttackRange(attackState.attacker, attackState.attackIndex);
				const distance = getHexDistance(attackState.attacker.position!, character.position!);

				if (distance <= attackRange) {
					// Valid target - open Attack Action Modal
					addWindow({
						id: window.crypto.randomUUID(),
						title: 'Attack Action',
						type: 'attack-action',
						position: findNextWindowPosition(windows),
						attackerId: attackState.attacker.id,
						defenderId: character.id,
						attackIndex: attackState.attackIndex,
					});

					// Clear attack state
					setAttackState(null);
				}
				// If not in range, do nothing (could add feedback later)

				return;
			}

			// Normal drag behavior
			e.preventDefault();
			e.stopPropagation();

			const pos = { x: e.clientX, y: e.clientY };
			onStartCharacterDrag(character, pos);
			// Keep the hover state when starting drag
			setHoveredCharacter(character);
		} else if (e.button === 2) {
			// Right click - handle based on mode
			e.preventDefault();
			e.stopPropagation();

			if (editMode) {
				// In edit mode, directly open character sheet
				handleOpenCharacterSheet(character);
			} else {
				// In play mode, show context menu at correct position relative to grid
				if (gridRef.current) {
					const rect = gridRef.current.getBoundingClientRect();
					setContextMenu({
						character,
						position: {
							x: e.clientX - rect.left,
							y: e.clientY - rect.top,
						},
					});
				}
			}
		}
	};

	const handleHexRightClick = (q: number, r: number) => {
		// Check if there's already a character at this position
		const existingCharacter = findCharacterAtPosition(characters, q, r);

		if (!existingCharacter) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Create Character (${q}, ${r})`,
				type: 'character-creation',
				position: findNextWindowPosition(windows),
				hexPosition: { q, r },
			});
		}
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

	// Function to get all hexes within range
	const getHexesInRange = (center: HexPosition, range: number): HexPosition[] => {
		const hexes: HexPosition[] = [];
		for (let q = -range; q <= range; q++) {
			for (let r = -range; r <= range; r++) {
				// Check if this hex is within range
				if (Math.abs(q + r) <= range) {
					hexes.push({
						q: center.q + q,
						r: center.r + r,
					});
				}
			}
		}
		return hexes;
	};

	// Function to calculate hex distance between two positions
	const getHexDistance = (pos1: HexPosition, pos2: HexPosition): number => {
		return (
			(Math.abs(pos1.q - pos2.q) +
				Math.abs(pos1.q + pos1.r - pos2.q - pos2.r) +
				Math.abs(pos1.r - pos2.r)) /
			2
		);
	};

	return (
		<div
			ref={gridRef}
			style={{
				width: '100%',
				height: '100%',
				overflow: 'hidden',
				position: 'relative',
			}}
			onWheel={handleWheel}
			onMouseMove={handleDrag}
			onMouseDown={handleMouseDown}
			onContextMenu={e => e.preventDefault()}
		>
			<svg
				ref={svgRef}
				width='100%'
				height='100%'
				viewBox='-100 -100 200 200'
				style={{
					transform: `scale(${gridState.scale}) translate(${gridState.offset.x}px, ${gridState.offset.y}px)`,
				}}
			>
				{/* Base Grid Layer */}
				<g>
					{generateHexes(10, 10).map(({ q, r }, i) => (
						<Hex key={i} q={q} r={r}>
							<path
								d='M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z'
								fill='var(--background-alt)'
								stroke='var(--text)'
								strokeWidth='0.5'
								data-hex={`${q},${r}`}
								style={{
									cursor: dragState.type === 'character' ? 'grabbing' : 'pointer',
								}}
								onContextMenu={e => {
									e.preventDefault();
									e.stopPropagation();
									handleHexRightClick(q, r);
								}}
							/>
						</Hex>
					))}
				</g>

				{/* Movement Range Highlight Layer */}
				{hoveredCharacter?.position && !attackState?.isSelectingTarget && (
					<g style={{ pointerEvents: 'none' }}>
						{getHexesInRange(
							hoveredCharacter.position,
							CharacterSheet.from(hoveredCharacter.props).derivedStats.movement.value
						).map(({ q, r }, i) => (
							<Hex key={`range-${i}`} q={q} r={r}>
								<path
									d='M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z'
									fill='rgba(0, 255, 0, 0.2)'
									stroke='rgba(0, 255, 0, 0.5)'
									strokeWidth='0.5'
								/>
							</Hex>
						))}
					</g>
				)}

				{/* Attack Range Highlight Layer */}
				{attackState?.isSelectingTarget && attackState.attacker.position && (
					<g style={{ pointerEvents: 'none' }}>
						{getHexesInRange(
							attackState.attacker.position,
							getAttackRange(attackState.attacker, attackState.attackIndex)
						).map(({ q, r }, i) => (
							<Hex key={`attack-range-${i}`} q={q} r={r}>
								<path
									d='M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z'
									fill='rgba(255, 0, 0, 0.2)'
									stroke='rgba(255, 0, 0, 0.5)'
									strokeWidth='0.5'
								/>
							</Hex>
						))}
					</g>
				)}

				{/* Character Tokens Layer */}
				<g>
					{generateHexes(10, 10).map(({ q, r }, i) => (
						<Hex key={`char-${i}`} q={q} r={r}>
							{characters
								.filter(c => c.position?.q === q && c.position?.r === r)
								.map(character => (
									<CharacterToken
										key={character.id}
										character={character}
										onClick={e => handleCharacterMouseDown(e, character)}
										onMouseEnter={() => handleCharacterMouseEnter(character)}
										onMouseLeave={handleCharacterMouseLeave}
										isGhost={dragState.type === 'character' && dragState.objectId === character.id}
									/>
								))}
						</Hex>
					))}
				</g>

				{/* Ghost Token Layer */}
				{dragState.type === 'character' && dragState.objectId && ghostPosition && (
					<g transform={`translate(${ghostPosition.x},${ghostPosition.y})`}>
						{characters.find(c => c.id === dragState.objectId) && (
							<CharacterToken
								character={characters.find(c => c.id === dragState.objectId)!}
								isGhost={true}
							/>
						)}
					</g>
				)}
			</svg>

			{contextMenu && (
				<TokenContextMenu
					character={contextMenu.character}
					position={contextMenu.position}
					onClose={() => setContextMenu(null)}
					onOpenCharacterSheet={handleOpenCharacterSheet}
					onAttackAction={handleAttackAction}
				/>
			)}
		</div>
	);
};
