import { Box, HexCoord, Point, filterInstanceOf } from '@shattered-wilds/commons';
import {
	ACTIONS,
	Action,
	ActionDefinition,
	ActionValueParameter,
	ActionValueUnit,
	CharacterSheet,
	DerivedStatType,
	Distance,
	Resource,
	Formula,
} from '@shattered-wilds/d12';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useErrors } from '../../hooks/useErrors';
import { useModals } from '../../hooks/useModals';
import { PropUpdater } from '../../hooks/usePropUpdates';
import { useTurnTrackerHooks } from '../../hooks/useTurnTrackerHooks';
import { useStore } from '../../store';
import { Drawing, displaceDrawing, drawingContainsPoint, drawingIntersectsBox } from '../../types/drawings';
import { getBasicAttacksFor } from '../../types/grid-actions';
import {
	AreaToolState,
	Character,
	DragState,
	Encounter,
	GameMap,
	LineToolState,
	MapMode,
	MapTool,
	SelectToolState,
} from '../../types/ui';
import { CharacterToken } from '../CharacterToken';
import { OmniBoxOptionType } from '../omni/OmniBoxOption';
import { TokenContextMenu } from '../TokenContextMenu';

import { DrawingComponent } from './DrawingComponent';
import { GridActionSelectionData, GridActionTool, gridActionRegistry } from './GridActions';
import { HexAreaComponent } from './HexAreaComponent';
import { hexGrid } from './HexGrid';
import { StaticHexGrid } from './StaticHexGrid';

const LEFT_CLICK_BUTTON = 0;
const MIDDLE_CLICK_BUTTON = 1;
const RIGHT_CLICK_BUTTON = 2;

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

interface HexGridComponentProps {
	encounterId: string;
	encounter: Encounter;
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

export const HexGridComponent: React.FC<HexGridComponentProps> = ({
	encounterId,
	encounter,
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

	const characters = useStore(state => state.characters);
	const encounterCharacters: Character[] = Object.keys(encounter.characterPositions)
		.map(charId => characters.find(c => c.id === charId))
		.filter((c): c is Character => c !== undefined);

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
	const { endTurn } = useTurnTrackerHooks();

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
	const [lineToolHoveredVertex, setLineToolHoveredVertex] = useState<Point | null>(null);
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

	const addDrawing = useCallback(
		(drawing: Drawing) => updateMap({ ...map, drawings: [...map.drawings, drawing] }),
		[updateMap, map],
	);

	const findCharacterAtHex = useCallback(
		(hex: HexCoord): Character | undefined => {
			return encounterCharacters.find(c => {
				const pos = getCharacterPosition(c.id);
				return pos?.q === hex.q && pos?.r === hex.r;
			});
		},
		[encounterCharacters, getCharacterPosition],
	);

	const screenToSvgCoordinates = useCallback(({ x, y }: Point): Point | null => {
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

	const eventToSvgCoordinates = useCallback(
		(event: { clientX: number; clientY: number }): Point | null => {
			return screenToSvgCoordinates({ x: event.clientX, y: event.clientY });
		},
		[screenToSvgCoordinates],
	);

	const eventHexCoordinates = useCallback(
		(e: React.MouseEvent): HexCoord | null => {
			const svgCoords = eventToSvgCoordinates(e);
			if (!svgCoords) {
				return null;
			}
			return hexGrid.pixelToAxial(svgCoords);
		},
		[eventToSvgCoordinates],
	);

	const findDrawingAtPoint = useCallback(
		(point: Point): number | null => {
			for (let i = map.drawings.length - 1; i >= 0; i--) {
				if (drawingContainsPoint({ hexGrid, drawing: map.drawings[i], point })) {
					return i;
				}
			}
			return null;
		},
		[map.drawings],
	);

	const findDrawingsInBox = useCallback(
		(box: Box): Set<number> => {
			const result = new Set<number>();
			map.drawings.forEach((drawing, index) => {
				if (drawingIntersectsBox({ hexGrid, drawing, box })) {
					result.add(index);
				}
			});
			return result;
		},
		[map.drawings],
	);

	useEffect(() => {
		if (dragState.type === 'character' && dragState.startPosition && svgRef.current) {
			setGhostPosition(dragState.startPosition);
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

	// Handle drag move and drop
	useEffect(() => {
		if (dragState.type !== 'character') return;

		const handleMouseMove = (e: MouseEvent) => {
			const point = eventToSvgCoordinates(e);
			if (point && dragState.type === 'character') {
				setDragState(prev => ({ ...prev, startPosition: point }));
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
						const hex = { q, r };
						const existingCharacter = findCharacterAtHex(hex);

						if (!existingCharacter || existingCharacter.id === character.id) {
							updateCharacterPosition(character.id, hex);
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
	}, [dragState, encounterCharacters, updateCharacterPosition, findCharacterAtHex, eventToSvgCoordinates]);

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
				return;
			}

			if (actionState?.data?.action === Action.Strike) {
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
						initialConfig: {
							attackAction: Action.Strike,
							weaponModeIndex: selectedWeaponModeIndex,
						},
						onClose: () => setOverlayState(null),
					});
				}
			} else {
				const point = eventToSvgCoordinates(e);
				if (!point) {
					return;
				}
				setDragState({
					type: 'character',
					objectId: character.id,
					startPosition: point,
				});
				// Keep the hover state when starting drag
				setHoveredCharacter(character);
			}
		} else if (e.button === RIGHT_CLICK_BUTTON) {
			e.preventDefault();
			e.stopPropagation();

			if (isMapMode) {
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
		const existingCharacter = findCharacterAtHex(coords);
		if (existingCharacter && editMode) {
			openCharacterSheetModal({ characterId: existingCharacter.id });
		}
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const point = eventToSvgCoordinates(e);
		if (!point) {
			return;
		}
		const hex = hexGrid.pixelToAxial(point);

		if (e.button === LEFT_CLICK_BUTTON) {
			// Left click: allow drag, block default
			e.preventDefault();
			if (!svgRef.current) {
				return;
			}

			if (isLineTool) {
				const startVertex = hexGrid.findNearestVertex(point);
				if (startVertex) {
					setLineToolState({
						startVertex,
						currentEndVertex: startVertex,
						pathVertices: [startVertex],
					});
				}
			} else if (isSelectTool) {
				const clickedDrawingIndex = findDrawingAtPoint(point);
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
						setSelectToolState(prev => ({ ...prev, dragStart: point, dragCurrent: point }));
					} else {
						setSelectToolState(prev => ({
							...prev,
							selectedIndices: new Set([clickedDrawingIndex]),
							dragStart: point,
							dragCurrent: point,
						}));
					}
				} else {
					setSelectToolState(prev => ({
						...prev,
						selectedIndices: e.shiftKey ? prev.selectedIndices : new Set(),
						selectionBox: { start: point, end: point },
						dragStart: null,
						dragCurrent: null,
					}));
				}
			} else if (isAreaTool) {
				setAreaToolState({
					centerHex: hex,
					radius: 0,
					previewHexes: [hex],
				});
			} else if (isStampTool) {
				if (lastStampIcon) {
					addDrawing({ type: 'stamp', hex, icon: lastStampIcon, color: selectedColor });
				} else {
					openIconSelectionModal({
						currentIcon: null,
						onSelect: (icon: string) => {
							setLastStampIcon(icon);
							addDrawing({ type: 'stamp', hex, icon, color: selectedColor });
						},
					});
				}
			}
		}

		// Handle stamp tool right click
		if (e.button === RIGHT_CLICK_BUTTON && isStampTool && svgRef.current) {
			e.preventDefault();
			openIconSelectionModal({
				currentIcon: lastStampIcon,
				onSelect: (icon: string) => {
					setLastStampIcon(icon);
					addDrawing({ type: 'stamp', hex, icon, color: selectedColor });
				},
			});
		}

		// For middle and right click, do not block default behavior
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (e.button === LEFT_CLICK_BUTTON && isLineTool && lineToolState) {
			if (
				lineToolState.startVertex.x !== lineToolState.currentEndVertex.x ||
				lineToolState.startVertex.y !== lineToolState.currentEndVertex.y
			) {
				addDrawing({
					type: 'line',
					start: lineToolState.startVertex,
					end: lineToolState.currentEndVertex,
					color: selectedColor,
				});
			}
			setLineToolState(null);
		}

		if (e.button === LEFT_CLICK_BUTTON && isSelectTool) {
			const { selectionBox, dragStart, dragCurrent } = selectToolState;
			if (selectionBox) {
				const selected = findDrawingsInBox(new Box({ ...selectionBox }));
				setSelectToolState(prev => ({
					...prev,
					selectedIndices: e.shiftKey ? new Set([...prev.selectedIndices, ...selected]) : selected,
					selectionBox: null,
				}));
			} else if (dragStart && dragCurrent) {
				const newDrawings = map.drawings.map((drawing, i) => {
					if (!selectToolState.selectedIndices.has(i)) return drawing;
					return displaceDrawing({
						hexGrid,
						drawing,
						delta: { start: dragStart, end: dragCurrent },
					});
				});
				updateMap({ ...map, drawings: newDrawings });
				setSelectToolState(prev => ({ ...prev, dragStart: null, dragCurrent: null }));
			}
		}

		if (e.button === LEFT_CLICK_BUTTON && isAreaTool && areaToolState) {
			if (areaToolState.previewHexes.length > 0) {
				addDrawing({ type: 'area', hexes: areaToolState.previewHexes, color: selectedColor });
			}
			setAreaToolState(null);
		}
	};

	const getFormulaForDistance = (actionDef: ActionDefinition): Formula | undefined => {
		return filterInstanceOf(actionDef.parameters, ActionValueParameter)?.find(
			param => param.unit === ActionValueUnit.Hex,
		)?.formula;
	};

	const getValueForDistance = (actionDef: ActionDefinition, character: Character): Distance | undefined => {
		const statTree = CharacterSheet.from(character.props).getStatTree();
		const result = getFormulaForDistance(actionDef)?.compute(statTree);
		return result ? Distance.of(result.value) : undefined;
	};

	const processOverlayForActionType = (
		character: Character,
		data: GridActionSelectionData,
	): AreaOverlay | undefined => {
		const actionDef = data.action in ACTIONS ? ACTIONS[data.action as Action] : undefined;
		const distanceParameter = actionDef ? getValueForDistance(actionDef, character) : undefined;
		if (distanceParameter) {
			return { type: OverlayType.Movement, range: distanceParameter };
		}

		switch (data.action) {
			case GridActionTool.MeasureDistance: {
				return { type: OverlayType.Movement };
			}
			case Action.Strike: {
				const selectedWeaponModeIndex = data.selectedWeaponModeIndex;
				if (selectedWeaponModeIndex === undefined) {
					fail(`No weapon mode selected for attack action.`);
					return undefined;
				}
				const attackRange = getAttackRange(character, selectedWeaponModeIndex);
				return { type: OverlayType.Attack, range: attackRange };
			}
			default:
				fail(`No overlay defined for action type: ${data.action}`);
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
		if (data.action === GridActionTool.EndTurn) {
			endTurn(encounter);
			return;
		}

		const overlay = processOverlayForActionType(character, data);
		setActionState({ character, overlay, data });
	};

	useEffect(() => {
		gridActionRegistry.register((character, data) => handleAction(character, data));
		return () => gridActionRegistry.unregister();
	});

	const handleMouseMove = (e: React.MouseEvent) => {
		if (e.button === MIDDLE_CLICK_BUTTON) {
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

		const point = eventToSvgCoordinates(e);
		if (!point) {
			return;
		}
		const hex = hexGrid.pixelToAxial(point);

		if (isLineTool && lineToolState) {
			const nearestVertex = hexGrid.findNearestVertex(point);
			if (nearestVertex) {
				const pathVertices = hexGrid.findVertexPath(lineToolState.startVertex, nearestVertex);
				setLineToolState(prev => (prev ? { ...prev, currentEndVertex: nearestVertex, pathVertices } : null));
			}
		} else if (isLineTool && !lineToolState) {
			const nearestVertex = hexGrid.findNearestVertex(point);
			setLineToolHoveredVertex(nearestVertex);
		} else if (!isLineTool && lineToolHoveredVertex) {
			setLineToolHoveredVertex(null);
		}

		if (isSelectTool) {
			if (selectToolState.selectionBox) {
				setSelectToolState(prev => ({
					...prev,
					selectionBox: prev.selectionBox ? { ...prev.selectionBox, end: point } : null,
				}));
			} else if (selectToolState.dragStart && e.button !== MIDDLE_CLICK_BUTTON) {
				setSelectToolState(prev => ({ ...prev, dragCurrent: point }));
			}
		}

		if (isAreaTool && areaToolState) {
			const radius = hexGrid.hexDistance(areaToolState.centerHex, hex);
			const previewHexes = hexGrid.getHexesInRange(areaToolState.centerHex, radius);
			setAreaToolState(prev => (prev ? { ...prev, radius, previewHexes } : null));
		} else if (isAreaTool && !areaToolState) {
			setAreaToolHoveredHex(hex);
		} else if (!isAreaTool && areaToolHoveredHex) {
			setAreaToolHoveredHex(null);
		}

		if (isStampTool) {
			setStampToolHoveredHex(hex);
		} else if (!isStampTool && stampToolHoveredHex) {
			setStampToolHoveredHex(null);
		}

		if (actionState) {
			setActionState(prev => (prev ? { ...prev, hoveredPosition: hex } : null));
		}
	};

	const highlight = (overlayType: OverlayType, hexes: HexCoord[]) => {
		const overlayColor = OVERLAY_TYPES[overlayType].color;
		return <HexAreaComponent hexes={hexes} color={overlayColor} mapSize={map.size} isSelected={true} />;
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
		const currentHex = actionState.hoveredPosition;

		return (
			<>
				{overlay.range && highlight(overlay.type, hexGrid.getHexesInRange(pos, overlay.range.value))}
				{currentHex && highlight(overlay.type, hexGrid.findHexPath(pos, currentHex))}
			</>
		);
	};

	const renderOverlay = (overlay: PathOverlay): React.ReactNode => {
		return highlight(overlay.type, hexGrid.findHexPath(overlay.from, overlay.to));
	};

	const handleHexClick = (target: HexCoord) => {
		if (!actionState) {
			return;
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
				const distance = hexGrid.hexDistance(from, target);
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
			case Action.Stride:
			case Action.SideStep:
			case Action.Climb:
			case Action.PassThrough:
			case Action.Run: {
				updateCharacterPosition(character.id, target);
				consumeActionCosts(character, actionType);
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

		const hex = eventHexCoordinates(e);
		if (hex && !isMapMode) {
			handleHexRightClick(hex);
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
					if (!isMapMode && actionState) {
						handleHexClick(hex);
					}
				}}
			>
				{/* Base Grid Layer - Static, memoized */}
				<StaticHexGrid width={map.size.width} height={map.size.height} />

				{/* Movement Range Highlight Layer (hover) */}
				{!isMapMode &&
					hoveredCharacter &&
					getCharacterPosition(hoveredCharacter.id) &&
					!actionState &&
					highlight(
						OverlayType.Movement,
						hexGrid.getHexesInRange(getCharacterPosition(hoveredCharacter.id)!, getStrideRange(hoveredCharacter).value),
					)}

				{actionState && renderActionStateOverlay(actionState)}
				{overlayState && renderOverlay(overlayState)}

				{/* Saved Drawings Layer */}
				<g style={{ pointerEvents: 'none' }}>
					{map.drawings.map((drawing, index) => {
						const { selectedIndices, dragStart, dragCurrent } = selectToolState;
						const isSelected = selectedIndices.has(index);
						const dragBox =
							isSelected && dragStart !== null && dragCurrent !== null
								? new Box({ start: dragStart, end: dragCurrent })
								: null;
						return (
							<DrawingComponent
								key={index}
								hexGrid={hexGrid}
								drawing={drawing}
								isSelected={isSelected}
								dragBox={dragBox}
								map={map}
							/>
						);
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
						if (!pos) {
							return null;
						}
						const { x, y } = hexGrid.axialToPixel(pos);
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
							const vertices = hexGrid.getHexVertices(areaToolHoveredHex);
							const pathData = `M${vertices.map((v: Point) => `${v.x},${v.y}`).join(' L')} Z`;
							return (
								<path d={pathData} fill='var(--accent)' fillOpacity={0.2} stroke='var(--accent)' strokeWidth='0.3' />
							);
						})()}
					</g>
				)}

				{/* Area Tool Preview Layer */}
				{areaToolState && (
					<HexAreaComponent hexes={areaToolState.previewHexes} mapSize={map.size} color='var(--accent)' />
				)}

				{/* Stamp Tool Preview Layer */}
				{stampToolHoveredHex && isStampTool && (
					<g style={{ pointerEvents: 'none' }}>
						{(() => {
							const vertices = hexGrid.getHexVertices(stampToolHoveredHex);
							const pathData = `M${vertices.map((v: Point) => `${v.x},${v.y}`).join(' L')} Z`;
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
