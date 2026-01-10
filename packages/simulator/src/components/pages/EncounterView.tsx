import { HexCoord } from '@shattered-wilds/commons';
import React, { useState } from 'react';
import {
	FaArrowLeft,
	FaCog,
	FaCrosshairs,
	FaEdit,
	FaFillDrip,
	FaListOl,
	FaMap,
	FaMousePointer,
	FaPenAlt,
	FaPlay,
	FaStamp,
	FaTimes,
} from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';

import { useEncounters } from '../../hooks/useEncounters';
import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { GameMap, MapMode, MapTool } from '../../types/ui';
import { HexGridComponent } from '../hex/HexGridComponent';
import { Button } from '../shared/Button';

interface EncounterViewProps {
	encounterId: string;
	onBack: () => void;
}

export const EncounterView: React.FC<EncounterViewProps> = ({ encounterId, onBack }) => {
	const [mapMode, setMapMode] = useState<MapMode>('encounter');
	const [selectedTool, setSelectedTool] = useState<MapTool>('select');
	const [selectedColor, setSelectedColor] = useState<string>('var(--accent)');
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

	const updateGridState = useStore(state => state.updateGridState);
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);
	const { closeAllModals, openEncounterConfigModal, openColorPickerModal, openTurnTrackerModal } = useModals();

	const { updateEncounter, findEncounter } = useEncounters();
	const encounter = findEncounter(encounterId);

	if (!encounter) {
		return (
			<div style={{ padding: '2rem', textAlign: 'center' }}>
				<h2>Encounter not found</h2>
				<Button onClick={onBack} icon={FaArrowLeft} title='Back to Encounters' />
			</div>
		);
	}

	// Determine currentTurnCharacterId if turn tracker is active
	const currentTurnCharacterId = encounter.turnTracker?.currentTurnCharacterId ?? null;

	const getCharacterPosition = (characterId: string): HexCoord | undefined => {
		return encounter.characterPositions[characterId];
	};

	const updateCharacterPosition = (characterId: string, pos: HexCoord) => {
		updateEncounter({
			...encounter,
			characterPositions: {
				...encounter.characterPositions,
				[characterId]: pos,
			},
		});
	};

	const updateMap = (map: GameMap) => {
		updateEncounter({ ...encounter, map });
	};

	const handleRecenter = () => {
		updateGridState({
			scale: 1,
			offset: { x: 0, y: 0 },
		});
	};

	const handleMapMode = () => {
		setMapMode(prev => (prev === 'map' ? 'encounter' : 'map'));
	};

	const handleOpenConfig = () => {
		openEncounterConfigModal({ encounterId });
	};

	const handleColorChange = (newColor: string) => {
		setSelectedColor(newColor);
		// Update color of selected drawings
		if (selectedIndices.size > 0 && encounter.map) {
			const newDrawings = encounter.map.drawings.map((drawing, index) =>
				selectedIndices.has(index) ? { ...drawing, color: newColor } : drawing,
			);
			updateMap({ ...encounter.map, drawings: newDrawings });
		}
	};

	const handleOpenColorPicker = () => {
		openColorPickerModal({
			currentColor: selectedColor,
			onColorChange: handleColorChange,
		});
	};

	const handleSelectionChange = (indices: Set<number>) => {
		setSelectedIndices(indices);
	};

	const MapControls = () => {
		return (
			<>
				<Button
					onClick={() => setSelectedTool('select')}
					icon={FaMousePointer}
					tooltip='Select Tool'
					selected={selectedTool === 'select'}
				/>
				<Button
					onClick={() => setSelectedTool('line')}
					icon={FaPenAlt}
					tooltip='Line Tool'
					selected={selectedTool === 'line'}
				/>
				<Button
					onClick={() => setSelectedTool('area')}
					icon={FaFillDrip}
					tooltip='Area Tool'
					selected={selectedTool === 'area'}
				/>
				<Button
					onClick={() => setSelectedTool('stamp')}
					icon={FaStamp}
					tooltip='Stamp Tool'
					selected={selectedTool === 'stamp'}
				/>
				<div style={{ width: '1px', background: 'var(--text)', margin: '0 4px' }} />
				<button
					onClick={handleOpenColorPicker}
					title='Pick Color'
					style={{
						width: '32px',
						height: '32px',
						backgroundColor: selectedColor,
						border: '2px solid var(--text)',
						borderRadius: '4px',
						cursor: 'pointer',
						padding: 0,
					}}
				/>
				<div style={{ width: '1px', background: 'var(--text)', margin: '0 4px' }} />
				<Button onClick={handleMapMode} icon={FaX} tooltip='Return to Encounter mode' />
			</>
		);
	};

	const handleOpenTurnTracker = () => {
		openTurnTrackerModal({ encounterId });
	};

	const EncounterControls = () => {
		return (
			<>
				<Button
					onClick={toggleEditMode}
					icon={editMode ? FaPlay : FaEdit}
					title={editMode ? 'Play Mode' : 'Edit Mode'}
				/>
				<Button onClick={handleOpenTurnTracker} icon={FaListOl} title='Turn Tracker' />
				<Button onClick={handleMapMode} icon={FaMap} title='Map' />
				<Button onClick={handleOpenConfig} icon={FaCog} title='Config' />
				<Button onClick={handleRecenter} icon={FaCrosshairs} title='Re-center' />
				<Button onClick={closeAllModals} icon={FaTimes} title='Close All' />
			</>
		);
	};

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<div
				style={{
					padding: '0.5rem 1rem',
					borderBottom: '1px solid var(--text)',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexShrink: 0,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<Button onClick={onBack} icon={FaArrowLeft} title='Back' />
					<h2 style={{ margin: 0, fontSize: '1.2rem' }}>{encounter.name}</h2>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{mapMode === 'map' ? <MapControls /> : <EncounterControls />}
				</div>
			</div>

			<div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
				<HexGridComponent
					encounterId={encounterId}
					encounter={encounter}
					getCharacterPosition={getCharacterPosition}
					updateCharacterPosition={updateCharacterPosition}
					map={encounter.map ?? { size: { width: 10, height: 10 }, drawings: [] }}
					updateMap={updateMap}
					mapMode={mapMode}
					selectedTool={selectedTool}
					selectedColor={selectedColor}
					onSelectionChange={handleSelectionChange}
					currentTurnCharacterId={encounter.turnTracker ? currentTurnCharacterId : null}
				/>
			</div>
		</div>
	);
};
