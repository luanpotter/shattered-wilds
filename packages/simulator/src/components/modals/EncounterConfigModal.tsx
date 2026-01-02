import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

import { useStore } from '../../store';
import { HexPosition } from '../../types/ui';
import { Button } from '../shared/Button';
import { AddCharacterDropdown } from '../shared/FilterableCharacterSelect';

interface EncounterConfigModalProps {
	encounterId: string;
	onClose: () => void;
}

export const EncounterConfigModal: React.FC<EncounterConfigModalProps> = ({ encounterId, onClose }) => {
	const characters = useStore(state => state.characters);
	const encounters = useStore(state => state.encounters);
	const updateEncounter = useStore(state => state.updateEncounter);

	const encounter = encounters.find(e => e.id === encounterId);
	const [name, setName] = useState(encounter?.name ?? '');

	// Sync local name state if encounter name changes externally
	useEffect(() => {
		if (encounter) {
			setName(encounter.name);
		}
	}, [encounter]);

	if (!encounter) {
		return <div>Encounter not found</div>;
	}

	const encounterCharacterIds = Object.keys(encounter.characterPositions);
	const encounterCharacters = encounterCharacterIds
		.map(id => characters.find(c => c.id === id))
		.filter((c): c is NonNullable<typeof c> => c !== undefined);

	const availableCharacters = characters.filter(c => !encounter.characterPositions[c.id]);

	const handleNameChange = (newName: string) => {
		setName(newName);
		updateEncounter({
			...encounter,
			name: newName,
		});
	};

	const handleRemoveCharacter = (characterId: string) => {
		const newPositions = { ...encounter.characterPositions };
		delete newPositions[characterId];
		updateEncounter({
			...encounter,
			characterPositions: newPositions,
		});
	};

	const handleAddCharacter = (characterId: string) => {
		const usedPositions = Object.values(encounter.characterPositions);
		const pos = findNextEmptyPosition(usedPositions);
		updateEncounter({
			...encounter,
			characterPositions: {
				...encounter.characterPositions,
				[characterId]: pos,
			},
		});
	};

	return (
		<div style={{ padding: '1rem', minWidth: '300px', maxWidth: '400px' }}>
			<div style={{ marginBottom: '1rem' }}>
				<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Encounter Name</span>
				<input
					type='text'
					value={name}
					onChange={e => handleNameChange(e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						backgroundColor: 'var(--background)',
						color: 'var(--text)',
						boxSizing: 'border-box',
					}}
				/>
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Characters in Encounter</span>
				{encounterCharacters.length === 0 ? (
					<p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>No characters added yet</p>
				) : (
					<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
						{encounterCharacters.map(character => (
							<li
								key={character.id}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0.5rem',
									borderBottom: '1px solid var(--text-muted)',
								}}
							>
								<span>{character.props.name}</span>
								<Button
									onClick={() => handleRemoveCharacter(character.id)}
									icon={FaTrash}
									variant='inline'
									tooltip='Remove from encounter'
								/>
							</li>
						))}
					</ul>
				)}
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Add Character</span>
				<AddCharacterDropdown
					characters={availableCharacters}
					onAdd={handleAddCharacter}
					placeholder='Select character to add...'
				/>
			</div>

			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button onClick={onClose} title='Done' />
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
