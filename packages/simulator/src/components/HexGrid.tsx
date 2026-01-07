import {
	ACTIONS,
	Action,
	CharacterSheet,
	DerivedStatType,
	Distance,
	Resource,
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

import { useErrors } from '../hooks/useErrors';
import { useModals } from '../hooks/useModals';
import { PropUpdater } from '../hooks/usePropUpdates';
import { useStore } from '../store';
import { getBasicAttacksFor } from '../types/grid-actions';
import {
	AreaToolState,
	Character,
	DragState,
	GameMap,
	HexCoord,
	HexVertex,
	LineToolState,
	MapMode,
	MapTool,
	Point,
	SelectToolState,
} from '../types/ui';

import { CharacterToken } from './CharacterToken';
import { gridActionRegistry, GridActionSelectionData, GridActionTool } from './hex/GridActions';
import { HexArea } from './hex/HexArea';
import { OmniBoxOptionType } from './omni/OmniBoxOption';
import { TokenContextMenu } from './TokenContextMenu';

// Dynamic icon loader from fa6
const renderFaIcon = (iconName: string): React.ReactNode => {
	const icons = Fa6Icons as Record<string, IconType>;
	const IconComponent = icons[iconName];
	if (!IconComponent) return null;
	return <IconComponent />;
};

const LEFT_CLICK_BUTTON = 0;
const RIGHT_CLICK_BUTTON = 2;
const MIDDLE_CLICK_BUTTON = 4;

// Pre-computed hex path for pointy-top hexagon with radius 5
const HEX_PATH = 'M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z';

enum OverlayType {
	Movement,
	Attack,
}

// TODO: unify action-related colors with print-friendly character sheet
const OVERLAY_TYPES: Record<OverlayType, { color: string }> = {
	[OverlayType.Movement]: {
		color: '#0daa15ff',
	},
	[OverlayType.Attack]: {
		color: '#c62828ff',
	},
};

interface AreaOverlay {
	type: OverlayType;
	range?: Distance;
}

interface PathOverlay {
	type: OverlayType;
	from: HexCoord;
	to: HexCoord;
}

interface ActionState {
	character: Character;
	data: GridActionSelectionData;
	overlay: AreaOverlay | undefined;
	hoveredPosition?: HexCoord;
}

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
	hexes: HexCoord[];
	color: string;
	mapWidth: number;
	mapHeight: number;
}

// Memoized highlight layer for movement/attack range
function HexHighlightLayerComponent({ hexes, color, mapWidth, mapHeight }: HexHighlightLayerProps) {
	return (
		<HexArea
			hexes={hexes.filter(pos => isHexInBounds(pos, mapWidth, mapHeight))}
			offset={{ q: 0, r: 0 }}
			color={color}
			isSelected={true}
			isDragging={false}
		/>
	);
}
const HexHighlightLayer = React.memo(HexHighlightLayerComponent);

const generateHexes = (width: number, height: number): HexCoord[] => {
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
const isHexInBounds = (pos: HexCoord, width: number, height: number): boolean => {
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
	encounterId: string;
	encounterCharacters: Character[];
	getCharacterPosition: (characterId: string) => HexCoord | undefined;
	updateCharacterPosition: (characterId: string, pos: HexCoord) => void;
	map: GameMap;
	updateMap: (map: GameMap) => void;
	mapMode?: MapMode;
	selectedTool?: MapTool;
	selectedColor?: string;
	onSelectionChange?: (indices: Set<number>) => void;
	currentTurnCharacterId?: string | null;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
	encounterId,
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
	// const modals = useStore(state => state.modals);
	const { openCharacterSheetModal, openAttackActionModal, openMeasureModal, openIconSelectionModal, openOmniBoxModal } =
		useModals();
	const fail = useErrors();
	const editMode = useStore(state => state.editMode);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const updateCharacterResource = (character: Character, resource: Resource, delta: number) => {
		const sheet = CharacterSheet.from(character.props);
		const propUpdater = new PropUpdater({ character, sheet, updateCharacterProp });
		propUpdater.updateResourceByDelta(resource, delta);
	};
	const consumeActionCosts = (character: Character, action: Action) => {
		for (const cost of ACTIONS[action].costs) {
			updateCharacterResource(character, cost.resource, -cost.amount);
		}
	};

	const [dragState, setDragState] = useState<DragState>({ type: 'none' });
	const [ghostPosition, setGhostPosition] = useState<Point | null>(null);
	const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		character: Character;
		position: Point;
	} | null>(null);
	const [actionState, setActionState] = useState<ActionState | null>(null);
	const [overlayState, setOverlayState] = useState<PathOverlay | null>(null);
	// tools
	const [lineToolState, setLineToolState] = useState<LineToolState | null>(null);
	const [lineToolHoveredVertex, setLineToolHoveredVertex] = useState<HexVertex | null>(null);
	const [selectToolState, setSelectToolState] = useState<SelectToolState>({
		selectedIndices: new Set(),
		selectionBox: null,
		dragStart: null,
		dragCurrent: null,
	});
	const [areaToolState, setAreaToolState] = useState<AreaToolState | null>(null);
	const [areaToolHoveredHex, setAreaToolHoveredHex] = useState<HexCoord | null>(null);
	const [stampToolHoveredHex, setStampToolHoveredHex] = useState<HexCoord | null>(null);
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
		if (!svgRef.current) {
			return null;
		}

		// Get the SVG element's CTM (Current Transformation Matrix)
		const svg = svgRef.current;

		// Create a point in screen coordinates
		const point = svg.createSVGPoint();
		point.x = x;
		point.y = y;

		// Get the current transformation matrix and its inverse
		const ctm = svg.getScreenCTM();
		if (!ctm) {
			return null;
		}

		const inverseCtm = ctm.inverse();

		// Transform the point from screen to SVG user space
		const transformedPoint = point.matrixTransform(inverseCtm);

		return { x: transformedPoint.x, y: transformedPoint.y };
	}, []);

	const eventHexCoordinates = useCallback(
		(e: React.MouseEvent): HexCoord | null => {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (!svgCoords) {
				return null;
			}
			return pixelToAxial(svgCoords.x, svgCoords.y);
		},
		[screenToSvgCoordinates],
	);

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
			const isSelecting = isSelectTool && selectToolState.selectedIndices.size > 0;
			if (e.key === 'Escape') {
				setActionState(null);
				if (isSelecting) {
					setSelectToolState(prev => ({
						...prev,
						selectedIndices: new Set(),
						selectionBox: null,
						dragStart: null,
						dragCurrent: null,
					}));
				}
			}
			if ((e.key === 'Delete' || e.key === 'Backspace') && isSelecting) {
				const newDrawings = map.drawings.filter((_, i) => !selectToolState.selectedIndices.has(i));
				updateMap({ ...map, drawings: newDrawings });
				setSelectToolState(prev => ({ ...prev, selectedIndices: new Set() }));
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isSelectTool, selectToolState.selectedIndices, map, updateMap]);

	// Notify parent when selection changes
	useEffect(() => {
		onSelectionChange?.(selectToolState.selectedIndices);
	}, [selectToolState.selectedIndices, onSelectionChange]);

	// // Clear measure state when measure modal is closed
	// useEffect(() => {
	// 	if (measureState && !measureState.isSelectingTarget) {
	// 		const hasMeasureModal = modals.some(modal => modal.type === 'measure');
	// 		if (!hasMeasureModal) {
	// 			setMeasureState(null);
	// 		}
	// 	}
	// }, [modals, measureState]);

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
		if (e.button === LEFT_CLICK_BUTTON) {
			e.preventDefault();
			e.stopPropagation();

			if (isMapMode) {
				// TODO: Handle map mode tool actions (select, line, etc.)
				console.log(`Map mode: ${selectedTool} tool clicked on character`, character.id);
				return;
			} else if (actionState?.data?.action === Action.Strike) {
				const attackerPos = getCharacterPosition(actionState.character.id);
				const targetPos = getCharacterPosition(character.id);

				if (attackerPos && targetPos) {
					// Check if the target is within range
					const selectedWeaponModeIndex = actionState.data.selectedWeaponModeIndex;
					if (selectedWeaponModeIndex === undefined) {
						fail('No weapon mode selected for attack action');
						return;
					}
					setActionState(null);
					setOverlayState({ type: OverlayType.Attack, from: attackerPos, to: targetPos });
					openAttackActionModal({
						attackerId: actionState.character.id,
						defenderId: character.id,
						attackIndex: selectedWeaponModeIndex,
						onClose: () => setOverlayState(null),
					});
				}
			} else {
				setDragState({
					type: 'character',
					objectId: character.id,
					startPosition: { x: e.clientX, y: e.clientY },
				});
				// Keep the hover state when starting drag
				setHoveredCharacter(character);
			}
		} else if (e.button === RIGHT_CLICK_BUTTON) {
			e.preventDefault();
			e.stopPropagation();

			if (isMapMode) {
				// TODO: Handle map mode right-click tool actions
				console.log(`Map mode: right-click with ${selectedTool} tool on character`, character.id);
				return;
			}

			if (actionState) {
				setActionState(null);
				return;
			}

			if (editMode) {
				handleOpenCharacterSheet(character);
			} else {
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

	const handleHexRightClick = (coords: HexCoord) => {
		// In encounter view, right-click on empty hex does nothing
		// Characters are added via the "Add character" bar
		const existingCharacter = findCharacterAtHex(coords.q, coords.r);
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
				const hex = eventHexCoordinates(e);
				if (!hex) {
					return;
				}
				setAreaToolState({
					centerHex: hex,
					radius: 0,
					previewHexes: [hex],
				});
			}

			// Handle stamp tool left click
			if (isStampTool && svgRef.current) {
				const hex = eventHexCoordinates(e);
				if (!hex) {
					return;
				}
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
	const getHexesInRange = (center: HexCoord, range: number): HexCoord[] => {
		const hexes: HexCoord[] = [];
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

	const processOverlayForActionType = (
		character: Character,
		data: GridActionSelectionData,
	): AreaOverlay | undefined => {
		switch (data.action) {
			case GridActionTool.MeasureDistance: {
				return {
					type: OverlayType.Movement,
				};
			}
			case Action.Stride: {
				return {
					type: OverlayType.Movement,
					range: getStrideRange(character),
				};
			}
			case Action.Strike: {
				const selectedWeaponModeIndex = data.selectedWeaponModeIndex;
				if (selectedWeaponModeIndex === undefined) {
					fail(`No weapon mode selected for attack action.`);
					return undefined;
				}
				const attackRange = getAttackRange(character, selectedWeaponModeIndex);
				return {
					type: OverlayType.Attack,
					range: attackRange,
				};
			}
			default:
				return undefined;
		}
	};

	const handleAction = (character: Character, data: GridActionSelectionData | undefined) => {
		if (!data) {
			const context = { type: OmniBoxOptionType.Act, encounterId, characterId: character.id };
			openOmniBoxModal({ context });
			return;
		}
		if (data.action === GridActionTool.OpenCharacterSheet) {
			handleOpenCharacterSheet(character);
			return;
		}

		const overlay = processOverlayForActionType(character, data);
		setActionState({
			character,
			overlay,
			data,
		});
	};

	// Register an action handler for OmniBox
	useEffect(() => {
		gridActionRegistry.register((character, data) => handleAction(character, data));
		return () => gridActionRegistry.unregister();
	});

	// Handle mouse move for measure hover
	const handleMouseMove = (e: React.MouseEvent) => {
		// Handle drag
		if (e.buttons === MIDDLE_CLICK_BUTTON) {
			updateGridState({
				offset: {
					x: gridState.offset.x + e.movementX / gridState.scale,
					y: gridState.offset.y + e.movementY / gridState.scale,
				},
			});
		}

		if (!svgRef.current) {
			return;
		}

		// Handle line tool drawing
		if (isLineTool && lineToolState) {
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
		} else if (isLineTool && !lineToolState) {
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
		if (isSelectTool) {
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
		if (isAreaTool && areaToolState) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const currentHex = pixelToAxial(svgCoords.x, svgCoords.y);
				const radius = hexDistance(areaToolState.centerHex, currentHex);
				const previewHexes = getHexesInRange(areaToolState.centerHex, radius);
				setAreaToolState(prev => (prev ? { ...prev, radius, previewHexes } : null));
			}
		} else if (isAreaTool && !areaToolState) {
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
		if (isStampTool) {
			const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
			if (svgCoords) {
				const hoveredHex = pixelToAxial(svgCoords.x, svgCoords.y);
				setStampToolHoveredHex(hoveredHex);
			}
		} else if (!isStampTool && stampToolHoveredHex) {
			// Clear hovered hex when not in stamp tool mode
			setStampToolHoveredHex(null);
		}

		// Handle hover
		if (actionState) {
			const hex = eventHexCoordinates(e);
			if (hex) {
				setActionState(prev => (prev ? { ...prev, hoveredPosition: hex } : null));
			}
		}
	};

	const renderActionStateOverlay = (actionState: ActionState): React.ReactNode => {
		const overlay = actionState.overlay;
		if (!overlay) {
			return null;
		}

		const pos = getCharacterPosition(actionState.character.id);
		if (!pos) {
			return null;
		}
		const overlayColor = OVERLAY_TYPES[overlay.type].color;
		const currentHex = actionState.hoveredPosition;

		return (
			<>
				{overlay.range && (
					<HexHighlightLayer
						hexes={getHexesInRange(pos, overlay.range.value)}
						color={overlayColor}
						mapWidth={map.size.width}
						mapHeight={map.size.height}
					/>
				)}
				{currentHex && (
					<HexHighlightLayer
						hexes={findHexPath(pos, currentHex)}
						color={overlayColor}
						mapWidth={map.size.width}
						mapHeight={map.size.height}
					/>
				)}
			</>
		);
	};

	const renderOverlay = (overlay: PathOverlay): React.ReactNode => {
		const overlayColor = OVERLAY_TYPES[overlay.type].color;
		return (
			<HexHighlightLayer
				hexes={findHexPath(overlay.from, overlay.to)}
				color={overlayColor}
				mapWidth={map.size.width}
				mapHeight={map.size.height}
			/>
		);
	};

	// Handle hex click for measure or stride
	const handleHexClick = (target: HexCoord) => {
		if (!actionState) {
			return; // nothing to do
		}

		const character = actionState.character;
		const from = getCharacterPosition(character.id);
		if (!from) {
			fail(`Character has no position for action: ${character.props.name}`);
			return;
		}

		const actionType = actionState.data?.action;
		switch (actionType) {
			case GridActionTool.MeasureDistance: {
				const distance = hexDistance(from, target);
				setOverlayState({ type: OverlayType.Movement, from, to: target });
				setActionState(null);
				openMeasureModal({
					fromCharacterId: character.id,
					toPosition: target,
					distance,
					onMove: () => {
						updateCharacterPosition(character.id, target);
						setOverlayState(null);
					},
					onClose: () => setOverlayState(null),
				});
				break;
			}
			case Action.Stride: {
				updateCharacterPosition(character.id, target);
				consumeActionCosts(character, Action.Stride);
				setActionState(null);
				break;
			}
			// TODO: consolidate attacking here
		}
	};

	// Handle right-click outside character token
	const handleGridRightClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setActionState(null);

		const svgCoords = screenToSvgCoordinates(e.clientX, e.clientY);
		if (!svgCoords) {
			return;
		}
		const hexCoords = pixelToAxial(svgCoords.x, svgCoords.y);

		if (isMapMode) {
			console.log(`Map mode: right-click with ${selectedTool} tool on hex ${hexCoords}`);
		} else {
			handleHexRightClick(hexCoords);
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
					// TODO: simplify this logic
					isLineTool || isAreaTool
						? 'crosshair'
						: actionState
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
					const hex = eventHexCoordinates(e);
					if (!hex) {
						return;
					}
					if (isMapMode) {
						console.log(`Map mode: left-click with ${selectedTool} tool on hex ${hex}`);
					} else if (actionState) {
						handleHexClick(hex);
					}
				}}
			>
				{/* Base Grid Layer - Static, memoized */}
				<StaticHexGrid width={map.size.width} height={map.size.height} />

				{/* Movement Range Highlight Layer (hover) */}
				{!isMapMode && hoveredCharacter && getCharacterPosition(hoveredCharacter.id) && !actionState && (
					<HexHighlightLayer
						hexes={getHexesInRange(
							getCharacterPosition(hoveredCharacter.id)!,
							CharacterSheet.from(hoveredCharacter.props).getStatTree().computeDerivedStat(DerivedStatType.Movement)
								.value,
						)}
						color={OVERLAY_TYPES[OverlayType.Movement].color}
						mapWidth={map.size.width}
						mapHeight={map.size.height}
					/>
				)}

				{actionState && renderActionStateOverlay(actionState)}
				{overlayState && renderOverlay(overlayState)}

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
					onAction={handleAction}
				/>
			)}
		</div>
	);
};
