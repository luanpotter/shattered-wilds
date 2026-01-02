import React from 'react';
import { FaArrowLeft, FaCog, FaCrosshairs, FaEdit, FaPlay, FaTimes } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { Character, HexPosition } from '../../types/ui';
import { BattleGrid } from '../HexGrid';
import { Button } from '../shared/Button';

interface EncounterViewProps {
	encounterId: string;
	onBack: () => void;
}

export const EncounterView: React.FC<EncounterViewProps> = ({ encounterId, onBack }) => {
	const encounters = useStore(state => state.encounters);
	const characters = useStore(state => state.characters);
	const updateGridState = useStore(state => state.updateGridState);
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);
	const updateEncounter = useStore(state => state.updateEncounter);
	const { closeAllModals, openEncounterConfigModal } = useModals();

	const encounter = encounters.find(e => e.id === encounterId);

	if (!encounter) {
		return (
			<div style={{ padding: '2rem', textAlign: 'center' }}>
				<h2>Encounter not found</h2>
				<Button onClick={onBack} icon={FaArrowLeft} title='Back to Encounters' />
			</div>
		);
	}

	const encounterCharacters: Character[] = Object.keys(encounter.characterPositions)
		.map(charId => characters.find(c => c.id === charId))
		.filter((c): c is Character => c !== undefined);

	const getCharacterPosition = (characterId: string): HexPosition | undefined => {
		return encounter.characterPositions[characterId];
	};

	const updateCharacterPosition = (characterId: string, pos: HexPosition) => {
		updateEncounter({
			...encounter,
			characterPositions: {
				...encounter.characterPositions,
				[characterId]: pos,
			},
		});
	};

	const handleRecenter = () => {
		updateGridState({
			scale: 1,
			offset: { x: 0, y: 0 },
		});
	};

	const handleCloseAllModals = () => {
		closeAllModals();
	};

	const handleOpenConfig = () => {
		openEncounterConfigModal({ encounterId });
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
					<Button
						onClick={toggleEditMode}
						icon={editMode ? FaPlay : FaEdit}
						title={editMode ? 'Play Mode' : 'Edit Mode'}
					/>
					<Button onClick={handleOpenConfig} icon={FaCog} title='Config' />
					<Button onClick={handleRecenter} icon={FaCrosshairs} title='Re-center' />
					<Button onClick={handleCloseAllModals} icon={FaTimes} title='Close All' />
				</div>
			</div>

			<div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
				<BattleGrid
					encounterCharacters={encounterCharacters}
					getCharacterPosition={getCharacterPosition}
					updateCharacterPosition={updateCharacterPosition}
				/>
			</div>
		</div>
	);
};
