import React from 'react';
import { FaArrowLeft, FaCrosshairs, FaEdit, FaPlay, FaTimes } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { Character, HexPosition } from '../../types/ui';
import { BattleGrid } from '../HexGrid';
import { Button } from '../shared/Button';
import { AddCharacterDropdown } from '../shared/FilterableCharacterSelect';

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
	const { closeAllModals } = useModals();

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

	const addCharacterToEncounter = (characterId: string, pos: HexPosition) => {
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

	const availableCharacters = characters.filter(c => !encounter.characterPositions[c.id]);

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
					<Button onClick={handleRecenter} icon={FaCrosshairs} title='Re-center' />
					<Button onClick={handleCloseAllModals} icon={FaTimes} title='Close All' />
				</div>
			</div>

			{editMode && (
				<div
					style={{
						padding: '0.5rem 1rem',
						borderBottom: '1px solid var(--text)',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						flexShrink: 0,
					}}
				>
					<AddCharacterDropdown
						characters={availableCharacters}
						onAdd={characterId => {
							const usedPositions = Object.values(encounter.characterPositions);
							const pos = findNextEmptyPosition(usedPositions);
							addCharacterToEncounter(characterId, pos);
						}}
						placeholder='Add character to encounter...'
					/>
				</div>
			)}

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

const findNextEmptyPosition = (usedPositions: HexPosition[], startQ = 0, startR = 0): HexPosition => {
	const isOccupied = (q: number, r: number) => usedPositions.some(p => p.q === q && p.r === r);

	if (!isOccupied(startQ, startR)) {
		return { q: startQ, r: startR };
	}

	const directions = [
		{ q: 1, r: 0 },
		{ q: 0, r: 1 },
		{ q: -1, r: 1 },
		{ q: -1, r: 0 },
		{ q: 0, r: -1 },
		{ q: 1, r: -1 },
	];

	let q = startQ;
	let r = startR;
	let radius = 1;

	while (radius < 20) {
		for (let side = 0; side < 6; side++) {
			for (let step = 0; step < radius; step++) {
				q += directions[side].q;
				r += directions[side].r;
				if (!isOccupied(q, r)) {
					return { q, r };
				}
			}
		}
		radius++;
	}

	return { q: 0, r: 0 };
};
