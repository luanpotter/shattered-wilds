import {
	ACTIONS,
	CharacterSheet,
	DerivedStatType,
	Distance,
	axialToPixel,
	findHexPath,
	findNearestVertex,
	findVertexPath,
	getHexNeighbors,
	getHexVertices,
	hexDistance,
	pixelToAxial,
} from '@shattered-wilds/commons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import * as Fa6Icons from 'react-icons/fa6';

import { useModals } from '../hooks/useModals';
import { PropUpdater } from '../hooks/usePropUpdates';
import { useStore } from '../store';
import { getBasicAttacksFor } from '../types/grid-actions';
import {
	AreaToolState,
	Character,
	DragState,
	GameMap,
	HexPosition,
	HexVertex,
	LineToolState,
	MapMode,
	MapTool,
	Point,
	SelectToolState,
} from '../types/ui';

import { CharacterToken } from './CharacterToken';
import { HexArea } from './hex/HexArea';
import { TokenContextMenu } from './TokenContextMenu';

// Dynamic icon loader from fa6
const renderFaIcon = (iconName: string): React.ReactNode => {
	const icons = Fa6Icons as Record<string, IconType>;
	const IconComponent = icons[iconName];
	if (!IconComponent) return null;
	return <IconComponent />;
};

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
						strokeWidth='0.3'
						strokeOpacity={0.3}
						data-hex={`${q},${r}`}
					/>
				);
			})}
		</g>
	);
}
const StaticHexGrid = React.memo(StaticHexGridComponent);

const pointToSegmentDistance = (
	p: { x: number; y: number },
	a: { x: number; y: number },
	b: { x: number; y: number },
): number => {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) {
		return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
	}
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
	const projX = a.x + t * dx;
	const projY = a.y + t * dy;
	return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
};

interface HexHighlightLayerProps {
	hexes: HexPosition[];
	fillColor: string;
	strokeColor: string;
	mapWidth: number;
	mapHeight: number;
}

// Memoized highlight layer for movement/attack range
function HexHighlightLayerComponent({ hexes, fillColor, strokeColor, mapWidth, mapHeight }: HexHighlightLayerProps) {
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
							strokeWidth={0.5}
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
	map: GameMap;
	updateMap: (map: GameMap) => void;
	mapMode?: MapMode;
	selectedTool?: MapTool;
	selectedColor?: string;
	onSelectionChange?: (indices: Set<number>) => void;
	currentTurnCharacterId?: string | null;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
	encounterCharacters,
	getCharacterPosition,
	updateCharacterPosition,
	map,
	updateMap,
	mapMode = 'encounter',
	selectedTool = 'select',
	selectedColor = 'var(--accent)',
	onSelectionChange,
	currentTurnCharacterId,
}) => {
	const isMapMode = mapMode === 'map';

	const gridRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	const gridState = useStore(state => state.gridState);
	const updateGridState = useStore(state => state.updateGridState);
	const modals = useStore(state => state.modals);
	const { openCharacterSheetModal, openAttackActionModal, openMeasureModal, openIconSelectionModal } = useModals();
	const editMode = useStore(state => state.editMode);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

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
	const [strideState, setStrideState] = useState<{
		character: Character;
		isSelectingTarget: boolean;
	} | null>(null);
	const [measureState, setMeasureState] = useState<{
		fromCharacter: Character;
		isSelectingTarget: boolean;
		hoveredPosition?: HexPosition;
	} | null>(null);
	const [lineToolState, setLineToolState] = useState<LineToolState | null>(null);
	const [lineToolHoveredVertex, setLineToolHoveredVertex] = useState<HexVertex | null>(null);
	const [selectToolState, setSelectToolState] = useState<SelectToolState>({
		selectedIndices: new Set(),
		selectionBox: null,
		dragStart: null,
		dragCurrent: null,
	});
	const [areaToolState, setAreaToolState] = useState<AreaToolState | null>(null);
	const [areaToolHoveredHex, setAreaToolHoveredHex] = useState<HexPosition | null>(null);
	const [stampToolHoveredHex, setStampToolHoveredHex] = useState<HexPosition | null>(null);
	const [lastStampIcon, setLastStampIcon] = useState<string | null>(null);

	// Tool helpers
	const isLineTool = isMapMode && selectedTool === 'line';
	const isSelectTool = isMapMode && selectedTool === 'select';
	const isAreaTool = isMapMode && selectedTool === 'area';
	const isStampTool = isMapMode && selectedTool === 'stamp';

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

	const findDrawingAtPoint = useCallback(
		(point: Point, threshold = 2): number | null => {
			for (let i = map.drawings.length - 1; i >= 0; i--) {
				const drawing = map.drawings[i];
				if (drawing.type === 'area') {
					// Check if point is inside any of the hexes
					const clickedHex = pixelToAxial(point.x, point.y);
					for (const hex of drawing.hexes) {
						if (hex.q === clickedHex.q && hex.r === clickedHex.r) {
							return i;
						}
					}
				}
				if (drawing.type === 'line') {
					const pathVertices = findVertexPath(drawing.start, drawing.end, 10);
					for (let j = 0; j < pathVertices.length - 1; j++) {
						const a = pathVertices[j];
						const b = pathVertices[j + 1];
						const dist = pointToSegmentDistance(point, a, b);
						if (dist <= threshold) {
							return i;
						}
					}
				}
				if (drawing.type === 'stamp') {
					const clickedHex = pixelToAxial(point.x, point.y);
					if (drawing.hex.q === clickedHex.q && drawing.hex.r === clickedHex.r) {
						return i;
					}
				}
			}
			return null;
		},
		[map.drawings],
	);

	const findDrawingsInBox = useCallback(
		(box: { start: Point; end: Point }): Set<number> => {
			const minX = Math.min(box.start.x, box.end.x);
			const maxX = Math.max(box.start.x, box.end.x);
			const minY = Math.min(box.start.y, box.end.y);
			const maxY = Math.max(box.start.y, box.end.y);

			// Helper to check if a point is inside the box
			const pointInBox = (p: Point) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;

			// Helper to check if a line segment intersects the box
			const segmentIntersectsBox = (p1: Point, p2: Point): boolean => {
				// If either endpoint is inside, it intersects
				if (pointInBox(p1) || pointInBox(p2)) return true;

				// Check if segment crosses any of the 4 box edges
				const boxEdges: [Point, Point][] = [
					[
						{ x: minX, y: minY },
						{ x: maxX, y: minY },
					], // top
					[
						{ x: maxX, y: minY },
						{ x: maxX, y: maxY },
					], // right
					[
						{ x: maxX, y: maxY },
						{ x: minX, y: maxY },
					], // bottom
					[
						{ x: minX, y: maxY },
						{ x: minX, y: minY },
					], // left
				];

				for (const [e1, e2] of boxEdges) {
					if (segmentsIntersect(p1, p2, e1, e2)) return true;
				}
				return false;
			};

			// Helper to check if two line segments intersect
			const segmentsIntersect = (a1: Point, a2: Point, b1: Point, b2: Point): boolean => {
				const ccw = (A: Point, B: Point, C: Point) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
				return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
			};

			const result = new Set<number>();
			map.drawings.forEach((drawing, index) => {
				if (drawing.type === 'area') {
					// Check if any hex center is inside the box
					for (const hex of drawing.hexes) {
						const { x, y } = axialToPixel(hex.q, hex.r);
						if (pointInBox({ x, y })) {
							result.add(index);
							break;
						}
					}
				}
				if (drawing.type === 'line') {
					const pathVertices = findVertexPath(drawing.start, drawing.end, 10);
					// Check if any vertex is inside or any segment intersects
					for (let i = 0; i < pathVertices.length; i++) {
						if (pointInBox(pathVertices[i])) {
							result.add(index);
							break;
						}
						if (i < pathVertices.length - 1 && segmentIntersectsBox(pathVertices[i], pathVertices[i + 1])) {
							result.add(index);
							break;
						}
					}
				}
				if (drawing.type === 'stamp') {
					const { x, y } = axialToPixel(drawing.hex.q, drawing.hex.r);
					if (pointInBox({ x, y })) {
						result.add(index);
					}
				}
			});
			return result;
		},
		[map.drawings],
	);

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
				} else if (isSelectTool && selectToolState.selectedIndices.size > 0) {
					setSelectToolState(prev => ({
						...prev,
						selectedIndices: new Set(),
						selectionBox: null,
						dragStart: null,
						dragCurrent: null,
					}));
				}
			}
			if ((e.key === 'Delete' || e.key === 'Backspace') && isSelectTool && selectToolState.selectedIndices.size > 0) {
				const newDrawings = map.drawings.filter((_, i) => !selectToolState.selectedIndices.has(i));
				updateMap({ ...map, drawings: newDrawings });
				setSelectToolState(prev => ({ ...prev, selectedIndices: new Set() }));
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [measureState, attackState, isSelectTool, selectToolState.selectedIndices, map, updateMap]);

	// Notify parent when selection changes
	useEffect(() => {
		onSelectionChange?.(selectToolState.selectedIndices);
	}, [selectToolState.selectedIndices, onSelectionChange]);

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

	const handleStrideAction = (character: Character) => {
		setStrideState({
			character,
			isSelectingTarget: true,
		});
	};

	const getStrideRange = (character: Character): Distance => {
		const sheet = CharacterSheet.from(character.props);
		const movement = sheet.getStatTree().getDistance(DerivedStatType.Movement);
		return movement.value;
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

			// Handle select tool start
			if (isSelectTool && svgRef.current) {
				const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
				if (svgCoords) {
					const clickedDrawingIndex = findDrawingAtPoint(svgCoords);
					if (clickedDrawingIndex !== null) {
						const isAlreadySelected = selectToolState.selectedIndices.has(clickedDrawingIndex);
						if (e.shiftKey) {
							const newSelected = new Set(selectToolState.selectedIndices);
							if (isAlreadySelected) {
								newSelected.delete(clickedDrawingIndex);
							} else {
								newSelected.add(clickedDrawingIndex);
							}
							setSelectToolState(prev => ({ ...prev, selectedIndices: newSelected }));
						} else if (isAlreadySelected) {
							// Store raw coordinates - each drawing type will snap to its own lattice
							setSelectToolState(prev => ({ ...prev, dragStart: svgCoords, dragCurrent: svgCoords }));
						} else {
							// Store raw coordinates - each drawing type will snap to its own lattice
							setSelectToolState(prev => ({
								...prev,
								selectedIndices: new Set([clickedDrawingIndex]),
								dragStart: svgCoords,
								dragCurrent: svgCoords,
							}));
						}
					} else {
						setSelectToolState(prev => ({
							...prev,
							selectedIndices: e.shiftKey ? prev.selectedIndices : new Set(),
							selectionBox: { start: svgCoords, end: svgCoords },
							dragStart: null,
							dragCurrent: null,
						}));
					}
				}
			}

			// Handle area tool start
			if (isAreaTool && svgRef.current) {
				const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
				if (svgCoords) {
					const centerHex = pixelToAxial(svgCoords.x, svgCoords.y);
					setAreaToolState({
						centerHex,
						radius: 0,
						previewHexes: [centerHex],
					});
				}
			}

			// Handle stamp tool left click
			if (isStampTool && svgRef.current) {
				const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
				if (svgCoords) {
					const hex = pixelToAxial(svgCoords.x, svgCoords.y);
					if (lastStampIcon) {
						// Place the previous icon
						updateMap({
							...map,
							drawings: [
								...map.drawings,
								{
									type: 'stamp',
									hex,
									icon: lastStampIcon,
									color: selectedColor,
								},
							],
						});
					} else {
						// Open selection modal
						openIconSelectionModal({
							currentIcon: null,
							onSelect: (icon: string) => {
								setLastStampIcon(icon);
								updateMap({
									...map,
									drawings: [
										...map.drawings,
										{
											type: 'stamp',
											hex,
											icon,
											color: selectedColor,
										},
									],
								});
							},
						});
					}
				}
			}
		}

		// Handle stamp tool right click
		if (e.button === 2 && isStampTool && svgRef.current) {
			e.preventDefault();
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const hex = pixelToAxial(svgCoords.x, svgCoords.y);
				openIconSelectionModal({
					currentIcon: lastStampIcon,
					onSelect: (icon: string) => {
						setLastStampIcon(icon);
						updateMap({
							...map,
							drawings: [
								...map.drawings,
								{
									type: 'stamp',
									hex,
									icon,
									color: selectedColor,
								},
							],
						});
					},
				});
			}
		}
		// For middle and right click, do not block default behavior
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (e.button === 0 && isLineTool && lineToolState) {
			if (
				lineToolState.startVertex.x !== lineToolState.currentEndVertex.x ||
				lineToolState.startVertex.y !== lineToolState.currentEndVertex.y
			) {
				updateMap({
					...map,
					drawings: [
						...map.drawings,
						{
							type: 'line',
							start: lineToolState.startVertex,
							end: lineToolState.currentEndVertex,
							color: selectedColor,
						},
					],
				});
			}
			setLineToolState(null);
		}

		if (e.button === 0 && isSelectTool) {
			if (selectToolState.selectionBox) {
				const selected = findDrawingsInBox(selectToolState.selectionBox);
				setSelectToolState(prev => ({
					...prev,
					selectedIndices: e.shiftKey ? new Set([...prev.selectedIndices, ...selected]) : selected,
					selectionBox: null,
				}));
			} else if (selectToolState.dragStart && selectToolState.dragCurrent) {
				const newDrawings = map.drawings.map((drawing, i) => {
					if (!selectToolState.selectedIndices.has(i)) return drawing;
					if (drawing.type === 'line') {
						// Snap to vertex lattice for lines
						const startVertex = findNearestVertex(selectToolState.dragStart!, 10) ?? selectToolState.dragStart!;
						const endVertex = findNearestVertex(selectToolState.dragCurrent!, 10) ?? selectToolState.dragCurrent!;
						const dx = endVertex.x - startVertex.x;
						const dy = endVertex.y - startVertex.y;
						if (dx === 0 && dy === 0) return drawing;
						// Apply offset and snap to nearest valid vertices
						const rawStart = { x: drawing.start.x + dx, y: drawing.start.y + dy };
						const rawEnd = { x: drawing.end.x + dx, y: drawing.end.y + dy };
						const newStart = findNearestVertex(rawStart, 10) ?? drawing.start;
						const newEnd = findNearestVertex(rawEnd, 10) ?? drawing.end;
						return {
							...drawing,
							start: newStart,
							end: newEnd,
						};
					}
					if (drawing.type === 'area') {
						// Snap to hex center lattice for areas
						const startHex = pixelToAxial(selectToolState.dragStart!.x, selectToolState.dragStart!.y);
						const endHex = pixelToAxial(selectToolState.dragCurrent!.x, selectToolState.dragCurrent!.y);
						const dq = endHex.q - startHex.q;
						const dr = endHex.r - startHex.r;
						if (dq === 0 && dr === 0) return drawing;
						return {
							...drawing,
							hexes: drawing.hexes.map(hex => ({
								q: hex.q + dq,
								r: hex.r + dr,
							})),
						};
					}
					if (drawing.type === 'stamp') {
						// Snap to hex center lattice for stamps
						const startHex = pixelToAxial(selectToolState.dragStart!.x, selectToolState.dragStart!.y);
						const endHex = pixelToAxial(selectToolState.dragCurrent!.x, selectToolState.dragCurrent!.y);
						const dq = endHex.q - startHex.q;
						const dr = endHex.r - startHex.r;
						if (dq === 0 && dr === 0) return drawing;
						return {
							...drawing,
							hex: {
								q: drawing.hex.q + dq,
								r: drawing.hex.r + dr,
							},
						};
					}
					return drawing;
				});
				updateMap({ ...map, drawings: newDrawings });
				setSelectToolState(prev => ({ ...prev, dragStart: null, dragCurrent: null }));
			}
		}

		if (e.button === 0 && isAreaTool && areaToolState) {
			if (areaToolState.previewHexes.length > 0) {
				updateMap({
					...map,
					drawings: [
						...map.drawings,
						{
							type: 'area',
							hexes: areaToolState.previewHexes,
							color: selectedColor,
						},
					],
				});
			}
			setAreaToolState(null);
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
		} else if (isLineTool && !lineToolState && svgRef.current) {
			// Track hovered vertex before drawing starts
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const nearestVertex = findNearestVertex(svgCoords, 10);
				setLineToolHoveredVertex(nearestVertex);
			}
		} else if (!isLineTool && lineToolHoveredVertex) {
			// Clear hovered vertex when not in line tool mode
			setLineToolHoveredVertex(null);
		}

		// Handle select tool
		if (isSelectTool && svgRef.current) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				if (selectToolState.selectionBox) {
					setSelectToolState(prev => ({
						...prev,
						selectionBox: prev.selectionBox ? { ...prev.selectionBox, end: svgCoords } : null,
					}));
				} else if (selectToolState.dragStart && e.buttons === 1) {
					// Store raw coordinates - each drawing type will snap to its own lattice
					setSelectToolState(prev => ({ ...prev, dragCurrent: svgCoords }));
				}
			}
		}

		// Handle area tool drag
		if (isAreaTool && areaToolState && svgRef.current) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const currentHex = pixelToAxial(svgCoords.x, svgCoords.y);
				const radius = hexDistance(areaToolState.centerHex, currentHex);
				const previewHexes = getHexesInRange(areaToolState.centerHex, radius);
				setAreaToolState(prev => (prev ? { ...prev, radius, previewHexes } : null));
			}
		} else if (isAreaTool && !areaToolState && svgRef.current) {
			// Track hovered hex before drawing starts
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const hoveredHex = pixelToAxial(svgCoords.x, svgCoords.y);
				setAreaToolHoveredHex(hoveredHex);
			}
		} else if (!isAreaTool && areaToolHoveredHex) {
			// Clear hovered hex when not in area tool mode
			setAreaToolHoveredHex(null);
		}

		// Handle stamp tool hover
		if (isStampTool && svgRef.current) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const hoveredHex = pixelToAxial(svgCoords.x, svgCoords.y);
				setStampToolHoveredHex(hoveredHex);
			}
		} else if (!isStampTool && stampToolHoveredHex) {
			// Clear hovered hex when not in stamp tool mode
			setStampToolHoveredHex(null);
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

	// Handle hex click for measure or stride
	const handleHexClick = (q: number, r: number) => {
		// Stride action
		const character = strideState?.character;
		const from = character ? getCharacterPosition(character.id) : null;
		if (strideState?.isSelectingTarget && character && from) {
			const toPosition = { q, r };
			const strideRange = getStrideRange(character).value;
			const distance = hexDistance(from, toPosition);
			if (distance <= strideRange) {
				updateCharacterPosition(strideState.character.id, toPosition);
				const sheet = CharacterSheet.from(character.props);
				const propUpdater = new PropUpdater({ character, sheet, updateCharacterProp });
				const strideCost = ACTIONS.Stride.costs[0];
				propUpdater.updateResourceByDelta(strideCost.resource, -strideCost.amount);
				setStrideState(null);
			}
			return;
		}

		// Measure action
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
		if (strideState?.isSelectingTarget) {
			// Cancel stride mode
			setStrideState(null);
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
				cursor:
					isLineTool || isAreaTool
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
				viewBox={calculateViewBox(map.size.width, map.size.height)}
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
					if (measureState?.isSelectingTarget || strideState?.isSelectingTarget) {
						const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
						if (svgCoords) {
							const { q, r } = pixelToAxial(svgCoords.x, svgCoords.y);
							handleHexClick(q, r);
						}
					}
				}}
			>
				{/* Base Grid Layer - Static, memoized */}
				<StaticHexGrid width={map.size.width} height={map.size.height} />

				{/* Movement Range Highlight Layer (hover) */}
				{!isMapMode &&
					hoveredCharacter &&
					getCharacterPosition(hoveredCharacter.id) &&
					!attackState?.isSelectingTarget &&
					!measureState?.isSelectingTarget &&
					!strideState?.isSelectingTarget && (
						<HexHighlightLayer
							hexes={getHexesInRange(
								getCharacterPosition(hoveredCharacter.id)!,
								CharacterSheet.from(hoveredCharacter.props).getStatTree().computeDerivedStat(DerivedStatType.Movement)
									.value,
							)}
							fillColor='rgba(0, 255, 0, 0.2)'
							strokeColor='rgba(0, 255, 0, 0.5)'
							mapWidth={map.size.width}
							mapHeight={map.size.height}
						/>
					)}

				{/* Stride Range Highlight Layer */}
				{strideState?.isSelectingTarget && getCharacterPosition(strideState.character.id) && (
					<HexHighlightLayer
						hexes={getHexesInRange(
							getCharacterPosition(strideState.character.id)!,
							getStrideRange(strideState.character).value ?? getStrideRange(strideState.character),
						)}
						fillColor='rgba(0, 255, 0, 0.2)'
						strokeColor='rgba(0, 255, 0, 0.5)'
						mapWidth={map.size.width}
						mapHeight={map.size.height}
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
						mapWidth={map.size.width}
						mapHeight={map.size.height}
					/>
				)}

				{/* Measure Path Highlight Layer */}
				{measureState && getCharacterPosition(measureState.fromCharacter.id) && measureState.hoveredPosition && (
					<HexHighlightLayer
						hexes={findHexPath(getCharacterPosition(measureState.fromCharacter.id)!, measureState.hoveredPosition)}
						fillColor='rgba(0, 255, 0, 0.2)'
						strokeColor='rgba(0, 255, 0, 0.5)'
						mapWidth={map.size.width}
						mapHeight={map.size.height}
					/>
				)}

				{/* Saved Drawings Layer */}
				<g style={{ pointerEvents: 'none' }}>
					{map.drawings.map((drawing, index) => {
						if (drawing.type === 'area') {
							const isSelected = selectToolState.selectedIndices.has(index);
							const isDragging =
								isSelected && selectToolState.dragStart !== null && selectToolState.dragCurrent !== null;

							// Calculate hex offset for dragging - snap to hex center lattice
							const offset = { q: 0, r: 0 };
							if (isDragging) {
								const startHex = pixelToAxial(selectToolState.dragStart!.x, selectToolState.dragStart!.y);
								const endHex = pixelToAxial(selectToolState.dragCurrent!.x, selectToolState.dragCurrent!.y);
								offset.q = endHex.q - startHex.q;
								offset.r = endHex.r - startHex.r;
							}

							return (
								<HexArea
									key={index}
									hexes={drawing.hexes}
									offset={offset}
									color={drawing.color}
									isSelected={isSelected}
									isDragging={isDragging}
								/>
							);
						}
						if (drawing.type === 'line') {
							const isSelected = selectToolState.selectedIndices.has(index);
							const isDragging =
								isSelected && selectToolState.dragStart !== null && selectToolState.dragCurrent !== null;
							const offsetX = isDragging ? selectToolState.dragCurrent!.x - selectToolState.dragStart!.x : 0;
							const offsetY = isDragging ? selectToolState.dragCurrent!.y - selectToolState.dragStart!.y : 0;
							// Apply offset and snap to nearest valid vertices
							const rawStart = { x: drawing.start.x + offsetX, y: drawing.start.y + offsetY };
							const rawEnd = { x: drawing.end.x + offsetX, y: drawing.end.y + offsetY };
							const adjustedStart = isDragging ? (findNearestVertex(rawStart, 10) ?? rawStart) : drawing.start;
							const adjustedEnd = isDragging ? (findNearestVertex(rawEnd, 10) ?? rawEnd) : drawing.end;
							const pathVertices = findVertexPath(adjustedStart, adjustedEnd, 10);
							return (
								<g key={index}>
									{/* Selection highlight (rendered behind) */}
									{isSelected && (
										<polyline
											points={pathVertices.map(v => `${v.x},${v.y}`).join(' ')}
											fill='none'
											stroke='var(--accent)'
											strokeWidth='1.2'
											strokeLinecap='round'
											strokeLinejoin='round'
											opacity={0.5}
										/>
									)}
									<polyline
										points={pathVertices.map(v => `${v.x},${v.y}`).join(' ')}
										fill='none'
										stroke={drawing.color}
										strokeWidth='0.4'
										strokeLinecap='round'
										strokeLinejoin='round'
										opacity={isDragging ? 0.6 : 1}
									/>
								</g>
							);
						}
						if (drawing.type === 'stamp') {
							const isSelected = selectToolState.selectedIndices.has(index);
							const isDragging =
								isSelected && selectToolState.dragStart !== null && selectToolState.dragCurrent !== null;
							// Calculate hex offset for dragging - snap to hex center lattice
							let dq = 0;
							let dr = 0;
							if (isDragging) {
								const startHex = pixelToAxial(selectToolState.dragStart!.x, selectToolState.dragStart!.y);
								const endHex = pixelToAxial(selectToolState.dragCurrent!.x, selectToolState.dragCurrent!.y);
								dq = endHex.q - startHex.q;
								dr = endHex.r - startHex.r;
							}
							const adjustedHex = { q: drawing.hex.q + dq, r: drawing.hex.r + dr };
							const center = axialToPixel(adjustedHex.q, adjustedHex.r, 10);
							// Size is 40% of hex height (which is 2 * hexRadius * sqrt(3)/2 for pointy-top)
							const hexHeight = 10 * Math.sqrt(3);
							const iconSize = hexHeight * 0.4;
							// Scale factor: we render at 100px in CSS and scale down to iconSize in SVG units
							const cssSize = 100;
							const scale = iconSize / cssSize;
							return (
								<g key={index}>
									{/* Selection circle highlight */}
									{isSelected && (
										<circle
											cx={center.x}
											cy={center.y}
											r={iconSize / 2 + 1}
											fill='none'
											stroke='var(--accent)'
											strokeWidth='0.6'
											opacity={0.5}
										/>
									)}
									{/* Icon rendered via foreignObject - scale down from CSS pixels to SVG units */}
									<g transform={`translate(${center.x}, ${center.y}) scale(${scale})`}>
										<foreignObject
											x={-cssSize / 2}
											y={-cssSize / 2}
											width={cssSize}
											height={cssSize}
											style={{ pointerEvents: 'none', opacity: isDragging ? 0.6 : 1 }}
										>
											<div
												style={{
													width: cssSize,
													height: cssSize,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													color: drawing.color,
													fontSize: cssSize * 0.8,
												}}
											>
												{renderFaIcon(drawing.icon)}
											</div>
										</foreignObject>
									</g>
								</g>
							);
						}
						return null;
					})}
				</g>

				{/* Selection Box Layer */}
				{selectToolState.selectionBox && (
					<rect
						x={Math.min(selectToolState.selectionBox.start.x, selectToolState.selectionBox.end.x)}
						y={Math.min(selectToolState.selectionBox.start.y, selectToolState.selectionBox.end.y)}
						width={Math.abs(selectToolState.selectionBox.end.x - selectToolState.selectionBox.start.x)}
						height={Math.abs(selectToolState.selectionBox.end.y - selectToolState.selectionBox.start.y)}
						fill='none'
						stroke='var(--accent)'
						strokeWidth='0.3'
						strokeDasharray='1,1'
						style={{ pointerEvents: 'none' }}
					/>
				)}

				{/* Line Tool Preview Layer */}
				{lineToolState && lineToolState.pathVertices.length >= 1 && (
					<g style={{ pointerEvents: 'none' }}>
						<polyline
							points={lineToolState.pathVertices.map(v => `${v.x},${v.y}`).join(' ')}
							fill='none'
							stroke='var(--accent)'
							strokeWidth='0.4'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
						{/* Start vertex marker */}
						<circle cx={lineToolState.startVertex.x} cy={lineToolState.startVertex.y} r='0.6' fill='var(--accent)' />
						{/* End vertex marker */}
						<circle
							cx={lineToolState.currentEndVertex.x}
							cy={lineToolState.currentEndVertex.y}
							r='0.6'
							fill='var(--accent)'
						/>
					</g>
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
									highlight={currentTurnCharacterId === character.id}
								/>
							</g>
						);
					})}
				</g>

				{/* Line Tool Hovered Vertex Preview (before drawing starts) */}
				{isLineTool && !lineToolState && lineToolHoveredVertex && (
					<circle
						cx={lineToolHoveredVertex.x}
						cy={lineToolHoveredVertex.y}
						r='0.6'
						fill='var(--accent)'
						style={{ pointerEvents: 'none' }}
					/>
				)}

				{/* Area Tool Hovered Hex Preview (before drawing starts) */}
				{isAreaTool && !areaToolState && areaToolHoveredHex && (
					<g style={{ pointerEvents: 'none' }}>
						{(() => {
							const vertices = getHexVertices(areaToolHoveredHex.q, areaToolHoveredHex.r, 10);
							const pathData = `M${vertices.map(v => `${v.x},${v.y}`).join(' L')} Z`;
							return (
								<path d={pathData} fill='var(--accent)' fillOpacity={0.2} stroke='var(--accent)' strokeWidth='0.3' />
							);
						})()}
					</g>
				)}

				{/* Area Tool Preview Layer */}
				{areaToolState && (
					<g style={{ pointerEvents: 'none' }}>
						{(() => {
							const hexSet = new Set(areaToolState.previewHexes.map(h => `${h.q},${h.r}`));
							const edgeToNeighborIndex = [1, 0, 5, 4, 3, 2];
							const boundaryEdges: { x1: number; y1: number; x2: number; y2: number }[] = [];

							for (const hex of areaToolState.previewHexes) {
								const vertices = getHexVertices(hex.q, hex.r, 10);
								const neighbors = getHexNeighbors(hex);
								for (let i = 0; i < 6; i++) {
									const neighborIndex = edgeToNeighborIndex[i];
									const neighbor = neighbors[neighborIndex];
									if (!hexSet.has(`${neighbor.q},${neighbor.r}`)) {
										const v1 = vertices[i];
										const v2 = vertices[(i + 1) % 6];
										boundaryEdges.push({ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y });
									}
								}
							}

							return (
								<>
									{areaToolState.previewHexes.map((hex, index) => {
										const vertices = getHexVertices(hex.q, hex.r, 10);
										const pathData = `M${vertices.map(v => `${v.x},${v.y}`).join(' L')} Z`;
										return <path key={index} d={pathData} fill='var(--accent)' fillOpacity={0.2} stroke='none' />;
									})}
									{boundaryEdges.map((edge, edgeIndex) => (
										<line
											key={`edge-${edgeIndex}`}
											x1={edge.x1}
											y1={edge.y1}
											x2={edge.x2}
											y2={edge.y2}
											stroke='var(--accent)'
											strokeWidth='0.3'
											strokeOpacity={0.8}
											strokeLinecap='round'
										/>
									))}
								</>
							);
						})()}
					</g>
				)}

				{/* Stamp Tool Preview Layer */}
				{stampToolHoveredHex && isStampTool && (
					<g style={{ pointerEvents: 'none' }}>
						{(() => {
							const vertices = getHexVertices(stampToolHoveredHex.q, stampToolHoveredHex.r, 10);
							const pathData = `M${vertices.map(v => `${v.x},${v.y}`).join(' L')} Z`;
							return (
								<path
									d={pathData}
									fill='var(--accent)'
									fillOpacity={0.1}
									stroke='var(--accent)'
									strokeWidth='0.3'
									strokeOpacity={0.7}
								/>
							);
						})()}
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
					onStrideAction={handleStrideAction}
					onMeasureAction={handleMeasureAction}
				/>
			)}
		</div>
	);
};
