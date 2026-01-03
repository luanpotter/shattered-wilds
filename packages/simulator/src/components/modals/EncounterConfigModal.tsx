import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

import { useStore } from '../../store';
import { Drawing, HexPosition } from '../../types/ui';
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
	const [confirmDeleteDrawingType, setConfirmDeleteDrawingType] = useState<Drawing['type'] | null>(null);

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
		updateEncounter({ ...encounter, name: newName });
	};

	const handleRemoveCharacter = (characterId: string) => {
		const newPositions = { ...encounter.characterPositions };
		delete newPositions[characterId];
		updateEncounter({ ...encounter, characterPositions: newPositions });
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

			<div style={{ marginBottom: '1rem' }}>
				<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Map Size</span>
				<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<span>Width:</span>
						<input
							type='number'
							min={1}
							max={50}
							value={encounter.map?.size.width ?? 10}
							onChange={e => {
								const width = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
								const currentMap = encounter.map ?? { size: { width: 10, height: 10 }, drawings: [] };
								updateEncounter({
									...encounter,
									map: { ...currentMap, size: { ...currentMap.size, width } },
								});
							}}
							style={{
								width: '60px',
								padding: '0.25rem 0.5rem',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'var(--background)',
								color: 'var(--text)',
							}}
						/>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<span>Height:</span>
						<input
							type='number'
							min={1}
							max={50}
							value={encounter.map?.size.height ?? 10}
							onChange={e => {
								const height = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
								const currentMap = encounter.map ?? { size: { width: 10, height: 10 }, drawings: [] };
								updateEncounter({
									...encounter,
									map: { ...currentMap, size: { ...currentMap.size, height } },
								});
							}}
							style={{
								width: '60px',
								padding: '0.25rem 0.5rem',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'var(--background)',
								color: 'var(--text)',
							}}
						/>
					</div>
				</div>
			</div>

			{/* Map Drawings Section */}
			{encounter.map && encounter.map.drawings.length > 0 && (
				<div style={{ marginBottom: '1rem' }}>
					<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Map Drawings</span>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
						{(() => {
							const drawingCounts = encounter.map.drawings.reduce(
								(acc, drawing) => {
									acc[drawing.type] = (acc[drawing.type] || 0) + 1;
									return acc;
								},
								{} as Record<string, number>,
							);

							const typeLabels: Record<string, string> = {
								line: 'Line Drawings',
							};

							return Object.entries(drawingCounts).map(([type, count]) => (
								<li
									key={type}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '0.5rem',
										borderBottom: '1px solid var(--text-muted)',
									}}
								>
									{confirmDeleteDrawingType === type ? (
										<>
											<span style={{ color: 'var(--accent)' }}>
												Delete all {count} {typeLabels[type] ?? type}?
											</span>
											<div style={{ display: 'flex', gap: '0.5rem' }}>
												<Button
													onClick={() => {
														const newDrawings = encounter.map!.drawings.filter(d => d.type !== type);
														updateEncounter({
															...encounter,
															map: { ...encounter.map!, drawings: newDrawings },
														});
														setConfirmDeleteDrawingType(null);
													}}
													title='Yes'
												/>
												<Button onClick={() => setConfirmDeleteDrawingType(null)} title='No' variant='inline' />
											</div>
										</>
									) : (
										<>
											<span>
												{typeLabels[type] ?? type} ({count})
											</span>
											<Button
												onClick={() => setConfirmDeleteDrawingType(type as Drawing['type'])}
												icon={FaTrash}
												variant='inline'
												tooltip={`Delete all ${typeLabels[type] ?? type}`}
											/>
										</>
									)}
								</li>
							));
						})()}
					</ul>
				</div>
			)}

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
