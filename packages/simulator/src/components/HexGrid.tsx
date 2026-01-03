import {
	CharacterSheet,
	DerivedStatType,
	Distance,
	axialToPixel,
	pixelToAxial,
	hexDistance,
	findHexPath,
	findNearestVertex,
	findVertexPath,
} from '@shattered-wilds/commons';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { getBasicAttacksFor } from '../types/grid-actions';
import { DragState, Point, Character, HexPosition, MapMode, MapTool, LineToolState } from '../types/ui';

import { CharacterToken } from './CharacterToken';
import { TokenContextMenu } from './TokenContextMenu';

// Pre-computed hex path for pointy-top hexagon with radius 5
const HEX_PATH = 'M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z';

interface StaticHexGridProps {
	width: number;
	height: number;
}

// Memoized static hex grid - renders all hexes as a single static layer
function StaticHexGridComponent({ width, height }: StaticHexGridProps) {
	const hexes = useMemo(() => generateHexes(width, height), [width, height]);

	return (
		<g>
			{hexes.map(({ q, r }) => {
				const { x, y } = axialToPixel(q, r);
				return (
					<path
						key={`${q},${r}`}
						d={HEX_PATH}
						transform={`translate(${x},${y})`}
						fill='var(--background-alt)'
						stroke='var(--text)'
						strokeWidth='0.5'
						data-hex={`${q},${r}`}
					/>
				);
			})}
		</g>
	);
}
const StaticHexGrid = React.memo(StaticHexGridComponent);

interface HexHighlightLayerProps {
	hexes: HexPosition[];
	fillColor: string;
	strokeColor: string;
	strokeWidth?: number;
	mapWidth: number;
	mapHeight: number;
}

// Memoized highlight layer for movement/attack range
function HexHighlightLayerComponent({
	hexes,
	fillColor,
	strokeColor,
	strokeWidth = 0.5,
	mapWidth,
	mapHeight,
}: HexHighlightLayerProps) {
	return (
		<g style={{ pointerEvents: 'none' }}>
			{hexes
				.filter(pos => isHexInBounds(pos, mapWidth, mapHeight))
				.map(({ q, r }) => {
					const { x, y } = axialToPixel(q, r);
					return (
						<path
							key={`${q},${r}`}
							d={HEX_PATH}
							transform={`translate(${x},${y})`}
							fill={fillColor}
							stroke={strokeColor}
							strokeWidth={strokeWidth}
						/>
					);
				})}
		</g>
	);
}
const HexHighlightLayer = React.memo(HexHighlightLayerComponent);

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

// Check if a hex position is within the grid bounds
const isHexInBounds = (pos: HexPosition, width: number, height: number): boolean => {
	const { q, r } = pos;

	// Check vertical bounds
	if (r < -height || r > height) {
		return false;
	}

	// Calculate the q range for this row (same logic as generateHexes)
	const qOffset = Math.floor(r / 2);
	const minQ = -width - qOffset;
	const maxQ = width - qOffset;

	return q >= minQ && q <= maxQ;
};

// Calculate the SVG viewBox dimensions based on map size
// Hex dimensions: horizontal spacing = 10, vertical spacing = 8.66
// Hex radius (pointy-top) = 5
const calculateViewBox = (width: number, height: number): string => {
	// The grid spans from r = -height to r = +height
	// Vertical: y goes from -height * 8.66 to +height * 8.66
	const verticalExtent = height * 8.66;

	// For horizontal, we need to account for the hex arrangement
	// Each row has 2*width + 1 hexes, spanning roughly (2*width + 1) * 10 in x
	// But the actual x position depends on q and r: x = q * 10 + r * 5
	// At r = 0, q ranges from -width to +width, so x ranges from -width*10 to +width*10
	// At r = -height, q is offset by floor(-height/2), adding r*5 = -height*5
	// At r = +height, q is offset by floor(height/2), adding r*5 = +height*5
	const horizontalExtent = width * 10 + height * 5;

	// Add padding for hex radius (5) on all sides
	const padding = 6;
	const minX = -horizontalExtent - padding;
	const minY = -verticalExtent - padding;
	const svgWidth = 2 * horizontalExtent + 2 * padding;
	const svgHeight = 2 * verticalExtent + 2 * padding;

	return `${minX} ${minY} ${svgWidth} ${svgHeight}`;
};

interface BattleGridProps {
	encounterCharacters: Character[];
	getCharacterPosition: (characterId: string) => HexPosition | undefined;
	updateCharacterPosition: (characterId: string, pos: HexPosition) => void;
	mapSize: { width: number; height: number };
	mapMode?: MapMode;
	selectedTool?: MapTool;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
	encounterCharacters,
	getCharacterPosition,
	updateCharacterPosition,
	mapSize,
	mapMode = 'encounter',
	selectedTool = 'select',
}) => {
	const isMapMode = mapMode === 'map';
	const gridRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const gridState = useStore(state => state.gridState);
	const updateGridState = useStore(state => state.updateGridState);
	const modals = useStore(state => state.modals);
	const { openCharacterSheetModal, openAttackActionModal, openMeasureModal } = useModals();
	const editMode = useStore(state => state.editMode);
	const [dragState, setDragState] = useState<DragState>({ type: 'none' });
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
	const [measureState, setMeasureState] = useState<{
		fromCharacter: Character;
		isSelectingTarget: boolean;
		hoveredPosition?: HexPosition;
	} | null>(null);
	const [lineToolState, setLineToolState] = useState<LineToolState | null>(null);

	// Line tool helper: check if we're actively using the line tool
	const isLineTool = isMapMode && selectedTool === 'line';

	const findCharacterAtHex = useCallback(
		(q: number, r: number): Character | undefined => {
			return encounterCharacters.find(c => {
				const pos = getCharacterPosition(c.id);
				return pos?.q === q && pos?.r === r;
			});
		},
		[encounterCharacters, getCharacterPosition],
	);

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
			const svgCoords = screenToSvgCoordinates(dragState.startPosition.x, dragState.startPosition.y);

			if (svgCoords) {
				setGhostPosition(svgCoords);
			}
		} else {
			setGhostPosition(null);
		}
	}, [dragState, screenToSvgCoordinates]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (measureState?.isSelectingTarget) {
					setMeasureState(null);
				} else if (attackState?.isSelectingTarget) {
					setAttackState(null);
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [measureState, attackState]);

	// Clear measure state when measure modal is closed
	useEffect(() => {
		if (measureState && !measureState.isSelectingTarget) {
			const hasMeasureModal = modals.some(modal => modal.type === 'measure');
			if (!hasMeasureModal) {
				setMeasureState(null);
			}
		}
	}, [modals, measureState]);

	// Handle drag move and drop
	useEffect(() => {
		if (dragState.type !== 'character') return;

		const handleMouseMove = (e: MouseEvent) => {
			if (dragState.type === 'character') {
				setDragState(prev => ({
					...prev,
					startPosition: { x: e.clientX, y: e.clientY },
				}));
			}
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (dragState.type === 'character' && dragState.objectId) {
				const character = encounterCharacters.find(c => c.id === dragState.objectId);
				if (!character) {
					setDragState({ type: 'none' });
					return;
				}

				const element = document.elementFromPoint(e.clientX, e.clientY);
				if (!element) {
					setDragState({ type: 'none' });
					return;
				}

				let current = element;
				while (current && !current.hasAttribute('data-hex') && current.parentElement) {
					current = current.parentElement;
				}

				if (current && current.hasAttribute('data-hex')) {
					const hexData = current.getAttribute('data-hex');
					if (hexData) {
						const [q, r] = hexData.split(',').map(Number);
						const existingCharacter = findCharacterAtHex(q, r);

						if (!existingCharacter || existingCharacter.id === character.id) {
							updateCharacterPosition(character.id, { q, r });
						}
					}
				}
			}

			setDragState({ type: 'none' });
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [dragState, encounterCharacters, updateCharacterPosition, findCharacterAtHex]);

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		updateGridState({
			scale: gridState.scale * delta,
		});
	};

	const handleCharacterMouseEnter = (character: Character) => {
		if (isMapMode) {
			return;
		}
		setHoveredCharacter(character);
	};

	const handleCharacterMouseLeave = () => {
		if (dragState.type !== 'character') {
			setHoveredCharacter(null);
		}
	};

	const handleOpenCharacterSheet = (character: Character) => {
		openCharacterSheetModal({ characterId: character.id });
	};

	const handleAttackAction = (attacker: Character, attackIndex: number) => {
		setAttackState({
			attacker,
			attackIndex,
			isSelectingTarget: true,
		});
	};

	const getAttackRange = (attacker: Character, attackIndex: number): Distance => {
		const sheet = CharacterSheet.from(attacker.props);
		const attacks = getBasicAttacksFor(sheet);
		const attack = attacks[attackIndex];

		if (!attack) {
			throw new Error(`Attack not found: ${attackIndex}`);
		}
		return attack.range;
	};

	const handleCharacterMouseDown = (e: React.MouseEvent, character: Character) => {
		if (e.button === 0) {
			// Left click
			if (isMapMode) {
				// In map mode, handle based on selected tool
				e.preventDefault();
				e.stopPropagation();
				// TODO: Handle map mode tool actions (select, line, etc.)
				console.log(`Map mode: ${selectedTool} tool clicked on character`, character.id);
				return;
			}

			if (attackState?.isSelectingTarget) {
				// We're in attack mode - select this character as target
				e.preventDefault();
				e.stopPropagation();

				const attackerPos = getCharacterPosition(attackState.attacker.id);
				const targetPos = getCharacterPosition(character.id);

				if (attackerPos && targetPos) {
					// Check if the target is within range
					const attackRange = getAttackRange(attackState.attacker, attackState.attackIndex).value;
					const distance = hexDistance(attackerPos, targetPos);

					if (distance <= attackRange) {
						// Valid target - open Attack Action Modal
						openAttackActionModal({
							attackerId: attackState.attacker.id,
							defenderId: character.id,
							attackIndex: attackState.attackIndex,
						});

						// Clear attack state
						setAttackState(null);
					}
				}
				// If not in range, do nothing (could add feedback later)

				return;
			}

			// Normal drag behavior
			e.preventDefault();
			e.stopPropagation();

			setDragState({
				type: 'character',
				objectId: character.id,
				startPosition: { x: e.clientX, y: e.clientY },
			});
			// Keep the hover state when starting drag
			setHoveredCharacter(character);
		} else if (e.button === 2) {
			// Right click - handle based on mode
			e.preventDefault();
			e.stopPropagation();

			if (isMapMode) {
				// In map mode, right-click does not open token options
				// TODO: Handle map mode right-click tool actions
				console.log(`Map mode: right-click with ${selectedTool} tool on character`, character.id);
				return;
			}

			if (measureState?.isSelectingTarget) {
				// Cancel measure mode when right-clicking on character
				setMeasureState(null);
				return;
			}

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
		// In encounter view, right-click on empty hex does nothing
		// Characters are added via the "Add character" bar
		const existingCharacter = findCharacterAtHex(q, r);
		if (existingCharacter && editMode) {
			openCharacterSheetModal({ characterId: existingCharacter.id });
		}
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 0) {
			// Left click: allow drag, block default
			e.preventDefault();

			// Handle line tool start
			if (isLineTool && svgRef.current) {
				const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
				if (svgCoords) {
					const startVertex = findNearestVertex(svgCoords, 10);
					if (startVertex) {
						setLineToolState({
							startVertex,
							currentEndVertex: startVertex,
							pathVertices: [startVertex],
						});
					}
				}
			}
		}
		// For middle and right click, do not block default behavior
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (e.button === 0 && isLineTool && lineToolState) {
			// Line tool finished - for now just log the path, later we'll persist it
			console.log('Line tool finished with path:', lineToolState.pathVertices);
			// Clear the line tool state (the line is "committed")
			// TODO: Actually persist the line to the map state
			setLineToolState(null);
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

	// Handle measure action
	const handleMeasureAction = (character: Character) => {
		setMeasureState({
			fromCharacter: character,
			isSelectingTarget: true,
		});
	};

	// Handle mouse move for measure hover
	const handleMouseMove = (e: React.MouseEvent) => {
		// Handle drag
		if (e.buttons === 4) {
			updateGridState({
				offset: {
					x: gridState.offset.x + e.movementX / gridState.scale,
					y: gridState.offset.y + e.movementY / gridState.scale,
				},
			});
		}

		// Handle line tool drawing
		if (isLineTool && lineToolState && svgRef.current) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				// Find nearest vertex to the current mouse position
				const nearestVertex = findNearestVertex(svgCoords, 10);
				if (nearestVertex) {
					// Compute the path from start to current end vertex
					const pathVertices = findVertexPath(lineToolState.startVertex, nearestVertex, 10);
					setLineToolState(prev =>
						prev
							? {
									...prev,
									currentEndVertex: nearestVertex,
									pathVertices,
								}
							: null,
					);
				}
			}
		}

		// Handle measure hover
		if (measureState?.isSelectingTarget && svgRef.current) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				// Convert SVG coordinates to hex coordinates
				const hoveredHex = pixelToAxial(svgCoords.x, svgCoords.y);
				setMeasureState(prev => (prev ? { ...prev, hoveredPosition: hoveredHex } : null));
			}
		}
	};

	// Handle hex click for measure
	const handleHexClick = (q: number, r: number) => {
		const fromPos = getCharacterPosition(measureState?.fromCharacter.id ?? '');
		if (measureState?.isSelectingTarget && fromPos) {
			const toPosition = { q, r };
			const distance = hexDistance(fromPos, toPosition);
			const characterId = measureState.fromCharacter.id;

			// Open measure modal with move callback
			openMeasureModal({
				fromCharacterId: characterId,
				toPosition,
				distance,
				onMove: () => {
					updateCharacterPosition(characterId, toPosition);
					setMeasureState(null);
				},
			});

			// Keep measure state active to maintain highlight
			setMeasureState(prev => (prev ? { ...prev, isSelectingTarget: false } : null));
		}
	};

	// Handle right-click outside character token
	const handleGridRightClick = (e: React.MouseEvent) => {
		e.preventDefault();

		if (isMapMode) {
			// In map mode, handle based on selected tool
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const { q, r } = pixelToAxial(svgCoords.x, svgCoords.y);
				// TODO: Handle map mode right-click tool actions on hex
				console.log(`Map mode: right-click with ${selectedTool} tool on hex`, { q, r });
			}
			return;
		}

		if (measureState?.isSelectingTarget) {
			// Cancel measure mode
			setMeasureState(null);
			return;
		}

		// Get hex coordinates from click position
		const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
		if (svgCoords) {
			const { q, r } = pixelToAxial(svgCoords.x, svgCoords.y);
			handleHexRightClick(q, r);
		}
	};

	return (
		<div
			ref={gridRef}
			style={{
				width: '100%',
				height: '100%',
				overflow: 'hidden',
				position: 'relative',
				cursor: isLineTool
					? 'crosshair'
					: measureState?.isSelectingTarget
						? 'crosshair'
						: dragState.type === 'character'
							? 'grabbing'
							: 'default',
			}}
			onWheel={handleWheel}
			onMouseMove={handleMouseMove}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onContextMenu={e => {
				e.preventDefault();
				handleGridRightClick(e);
			}}
		>
			<svg
				ref={svgRef}
				width='100%'
				height='100%'
				viewBox={calculateViewBox(mapSize.width, mapSize.height)}
				style={{
					transform: `scale(${gridState.scale}) translate(${gridState.offset.x}px, ${gridState.offset.y}px)`,
				}}
				onClick={e => {
					if (isMapMode) {
						// In map mode, handle based on selected tool
						const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
						if (svgCoords) {
							const { q, r } = pixelToAxial(svgCoords.x, svgCoords.y);
							// TODO: Handle map mode left-click tool actions on hex
							console.log(`Map mode: left-click with ${selectedTool} tool on hex`, { q, r });
						}
						return;
					}
					if (measureState?.isSelectingTarget) {
						const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
						if (svgCoords) {
							const { q, r } = pixelToAxial(svgCoords.x, svgCoords.y);
							handleHexClick(q, r);
						}
					}
				}}
			>
				{/* Base Grid Layer - Static, memoized */}
				<StaticHexGrid width={mapSize.width} height={mapSize.height} />

				{/* Movement Range Highlight Layer */}
				{!isMapMode &&
					hoveredCharacter &&
					getCharacterPosition(hoveredCharacter.id) &&
					!attackState?.isSelectingTarget &&
					!measureState?.isSelectingTarget && (
						<HexHighlightLayer
							hexes={getHexesInRange(
								getCharacterPosition(hoveredCharacter.id)!,
								CharacterSheet.from(hoveredCharacter.props).getStatTree().computeDerivedStat(DerivedStatType.Movement)
									.value,
							)}
							fillColor='rgba(0, 255, 0, 0.2)'
							strokeColor='rgba(0, 255, 0, 0.5)'
							mapWidth={mapSize.width}
							mapHeight={mapSize.height}
						/>
					)}

				{/* Attack Range Highlight Layer */}
				{attackState?.isSelectingTarget && getCharacterPosition(attackState.attacker.id) && (
					<HexHighlightLayer
						hexes={getHexesInRange(
							getCharacterPosition(attackState.attacker.id)!,
							getAttackRange(attackState.attacker, attackState.attackIndex).value,
						)}
						fillColor='rgba(255, 0, 0, 0.2)'
						strokeColor='rgba(255, 0, 0, 0.5)'
						mapWidth={mapSize.width}
						mapHeight={mapSize.height}
					/>
				)}

				{/* Measure Path Highlight Layer */}
				{measureState && getCharacterPosition(measureState.fromCharacter.id) && measureState.hoveredPosition && (
					<HexHighlightLayer
						hexes={findHexPath(getCharacterPosition(measureState.fromCharacter.id)!, measureState.hoveredPosition)}
						fillColor='rgba(0, 255, 0, 0.3)'
						strokeColor='rgba(0, 255, 0, 0.7)'
						strokeWidth={1}
						mapWidth={mapSize.width}
						mapHeight={mapSize.height}
					/>
				)}

				{/* Character Tokens Layer - Render directly from characters, not hexes */}
				<g>
					{encounterCharacters.map(character => {
						const pos = getCharacterPosition(character.id);
						if (!pos) return null;
						const { x, y } = axialToPixel(pos.q, pos.r);
						return (
							<g key={character.id} transform={`translate(${x},${y})`}>
								<CharacterToken
									character={character}
									onClick={e => handleCharacterMouseDown(e, character)}
									onMouseEnter={() => handleCharacterMouseEnter(character)}
									onMouseLeave={handleCharacterMouseLeave}
									isGhost={dragState.type === 'character' && dragState.objectId === character.id}
									interactive={!isMapMode}
								/>
							</g>
						);
					})}
				</g>

				{/* Line Tool Preview Layer */}
				{lineToolState && lineToolState.pathVertices.length > 1 && (
					<g style={{ pointerEvents: 'none' }}>
						<polyline
							points={lineToolState.pathVertices.map(v => `${v.x},${v.y}`).join(' ')}
							fill='none'
							stroke='var(--accent)'
							strokeWidth='1'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
						{/* Start vertex marker */}
						<circle cx={lineToolState.startVertex.x} cy={lineToolState.startVertex.y} r='1.5' fill='var(--accent)' />
						{/* End vertex marker */}
						<circle
							cx={lineToolState.currentEndVertex.x}
							cy={lineToolState.currentEndVertex.y}
							r='1.5'
							fill='var(--accent)'
						/>
					</g>
				)}

				{/* Ghost Token Layer */}
				{dragState.type === 'character' && dragState.objectId && ghostPosition && (
					<g transform={`translate(${ghostPosition.x},${ghostPosition.y})`}>
						{encounterCharacters.find(c => c.id === dragState.objectId) && (
							<CharacterToken character={encounterCharacters.find(c => c.id === dragState.objectId)!} isGhost={true} />
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
					onMeasureAction={handleMeasureAction}
				/>
			)}
		</div>
	);
};
