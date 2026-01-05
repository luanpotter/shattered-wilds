import { getRecordValues } from '@shattered-wilds/commons';
import React, { useEffect, useState } from 'react';
import { FaDownload, FaEye, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { FaCirclePlay } from 'react-icons/fa6';

import { PREDEFINED_ENCOUNTERS } from '../../pregen/predefined-encounters';
import { useStore } from '../../store';
import { createNewEncounter, Encounter } from '../../types/ui';
import {
	copyEncounterToClipboard,
	importEncounterFromClipboard,
	parseEncounterFromShareString,
} from '../../utils/encounterShare';
import { Navigator } from '../../utils/routes';
import { Button } from '../shared/Button';
import { FilterableCharacterSelect } from '../shared/FilterableCharacterSelect';

import { EncounterView } from './EncounterView';

interface EncountersPageProps {
	initialEncounterId: string | null;
}

export const EncountersPage: React.FC<EncountersPageProps> = ({ initialEncounterId }) => {
	const encounters = useStore(state => state.encounters);
	const characters = useStore(state => state.characters);
	const addEncounter = useStore(state => state.addEncounter);
	const removeEncounter = useStore(state => state.removeEncounter);

	const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(initialEncounterId);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newEncounterName, setNewEncounterName] = useState('');
	const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
	const [mapWidth, setMapWidth] = useState(10);
	const [mapHeight, setMapHeight] = useState(10);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setSelectedEncounterId(initialEncounterId);
	}, [initialEncounterId]);

	const handleViewEncounter = (encounter: Encounter) => {
		Navigator.toEncounter(encounter.id);
		setSelectedEncounterId(encounter.id);
	};

	const handleBackToList = () => {
		Navigator.toEncounters();
		setSelectedEncounterId(null);
	};

	const handleDeleteEncounter = (encounter: Encounter) => {
		setConfirmDelete(encounter.id);
	};

	const handleConfirmDelete = () => {
		if (confirmDelete) {
			removeEncounter(confirmDelete);
			setConfirmDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setConfirmDelete(null);
	};

	const handleCreateEncounter = () => {
		const name = newEncounterName.trim();
		if (!name) {
			setError('Encounter name is required');
			return;
		}

		const encounter = createNewEncounter({
			name,
			characterIds: selectedCharacterIds,
			mapSize: { width: mapWidth, height: mapHeight },
		});

		addEncounter(encounter);
		setNewEncounterName('');
		setSelectedCharacterIds([]);
		setMapWidth(10);
		setMapHeight(10);
		setError(null);
		setShowCreateForm(false);
		handleViewEncounter(encounter);
	};

	const toggleCharacterSelection = (characterId: string) => {
		setSelectedCharacterIds(prev =>
			prev.includes(characterId) ? prev.filter(id => id !== characterId) : [...prev, characterId],
		);
	};

	const handleExportEncounter = (encounter: Encounter) => {
		copyEncounterToClipboard(encounter);
	};

	const handleImport = async () => {
		const result = await importEncounterFromClipboard();
		if (typeof result === 'string') {
			setError(result);
			return;
		}
		addEncounter(result);
		handleViewEncounter(result);
	};

	const handleAddPredefined = () => {
		getRecordValues(PREDEFINED_ENCOUNTERS).map(shareString => {
			const encounter = parseEncounterFromShareString(shareString);
			addEncounter(encounter);
		});
	};

	if (selectedEncounterId) {
		return <EncounterView encounterId={selectedEncounterId} onBack={handleBackToList} />;
	}

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<main
				style={{
					flex: 1,
					padding: '1rem',
					overflow: 'auto',
					maxWidth: '1250px',
					margin: '0 auto',
					width: '100%',
					boxSizing: 'border-box',
				}}
			>
				{confirmDelete && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							zIndex: 1000,
						}}
					>
						<div
							style={{
								backgroundColor: 'var(--background)',
								padding: '2rem',
								borderRadius: '8px',
								border: '1px solid var(--text)',
								minWidth: '300px',
							}}
						>
							<h3 style={{ margin: '0 0 1rem 0' }}>Confirm Deletion</h3>
							<p style={{ margin: '0 0 1.5rem 0' }}>
								Are you sure you want to delete {encounters.find(e => e.id === confirmDelete)?.name}?
							</p>
							<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
								<Button onClick={handleCancelDelete} title='Cancel' />
								<Button onClick={handleConfirmDelete} title='Delete' />
							</div>
						</div>
					</div>
				)}

				<div
					style={{
						marginBottom: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<h2 style={{ margin: 0 }}>Encounters</h2>
					<div style={{ display: 'flex', gap: '1rem' }}>
						<Button onClick={handleImport} icon={FaUpload} title='Import' />
						<Button onClick={handleAddPredefined} icon={FaCirclePlay} title='Add Predefined' />
						<Button onClick={() => setShowCreateForm(true)} icon={FaPlus} title='New' />
					</div>
				</div>

				{showCreateForm && (
					<div
						style={{
							padding: '1rem',
							marginBottom: '1rem',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							borderRadius: '4px',
						}}
					>
						<h3 style={{ margin: '0 0 1rem 0' }}>Create New Encounter</h3>
						{error && (
							<div
								style={{
									padding: '0.5rem 1rem',
									marginBottom: '1rem',
									backgroundColor: 'var(--background-alt)',
									border: '1px solid var(--error)',
									borderRadius: '4px',
									color: 'var(--error)',
								}}
							>
								{error}
							</div>
						)}
						<div style={{ marginBottom: '1rem' }}>
							<label htmlFor='encounter-name' style={{ display: 'block', marginBottom: '0.5rem' }}>
								Name
							</label>
							<input
								id='encounter-name'
								type='text'
								value={newEncounterName}
								onChange={e => setNewEncounterName(e.target.value)}
								placeholder='Enter encounter name'
								style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
							/>
						</div>
						<div style={{ marginBottom: '1rem' }}>
							<span style={{ display: 'block', marginBottom: '0.5rem' }}>Starting Characters (optional)</span>
							<FilterableCharacterSelect
								characters={characters}
								selectedIds={selectedCharacterIds}
								onToggle={toggleCharacterSelection}
								placeholder='Search characters to add...'
							/>
						</div>
						<div
							style={{ marginBottom: '1rem', alignItems: 'center', display: 'flex', flexDirection: 'row', gap: '8px' }}
						>
							<strong>Map Size</strong>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<span>Width:</span>
								<input
									type='number'
									min={1}
									max={50}
									value={mapWidth}
									onChange={e => setMapWidth(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
									style={{ width: '60px', padding: '0.25rem 0.5rem' }}
								/>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<span>Height:</span>
								<input
									type='number'
									min={1}
									max={50}
									value={mapHeight}
									onChange={e => setMapHeight(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
									style={{ width: '60px', padding: '0.25rem 0.5rem' }}
								/>
							</div>
						</div>
						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
							<Button
								onClick={() => {
									setShowCreateForm(false);
									setNewEncounterName('');
									setSelectedCharacterIds([]);
									setMapWidth(10);
									setMapHeight(10);
									setError(null);
								}}
								title='Cancel'
							/>
							<Button onClick={handleCreateEncounter} title='Create' />
						</div>
					</div>
				)}

				{encounters.length === 0 && !showCreateForm ? (
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								width: '50%',
							}}
						>
							<h2>No Encounters Found</h2>
							<p>Create your first encounter to get started!</p>
							<Button onClick={() => setShowCreateForm(true)} icon={FaPlus} title='New Encounter' />
						</div>
					</div>
				) : (
					<div>
						<div style={{ marginTop: '1rem' }}>
							{encounters.map(encounter => {
								const charCount = Object.keys(encounter.characterPositions).length;
								return (
									<div
										key={encounter.id}
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											padding: '1rem',
											marginBottom: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background-alt)',
										}}
									>
										<span style={{ fontSize: '1.1rem' }}>
											<strong>{encounter.name}</strong> ({charCount} character
											{charCount !== 1 ? 's' : ''})
										</span>
										<div style={{ display: 'flex', gap: '0.5rem' }}>
											<Button onClick={() => handleViewEncounter(encounter)} icon={FaEye} title='View' />
											<Button onClick={() => handleExportEncounter(encounter)} icon={FaDownload} title='Export' />
											<Button onClick={() => handleDeleteEncounter(encounter)} icon={FaTrash} title='Delete' />
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</main>
		</div>
	);
};
