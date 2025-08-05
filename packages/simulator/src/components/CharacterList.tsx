import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaClipboard } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character } from '../types';
import { findNextEmptyHexPosition } from '../utils';
import { importCharacterDataFromClipboard } from '../utils/clipboard';

import { Button } from './shared/Button';

export const CharacterList: React.FC = () => {
	const characters = useStore(state => state.characters);

	const { openCharacterCreationModal, openCharacterSheetModal } = useModals();
	const removeCharacter = useStore(state => state.removeCharacter);
	const addCharacter = useStore(state => state.addCharacter);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [importError, setImportError] = useState<string | null>(null);

	const handleOpenNewCharacterModal = () => {
		const hexPosition = findNextEmptyHexPosition(characters);
		openCharacterCreationModal({ hexPosition });
	};

	const handleImportFromClipboard = async () => {
		const result = await importCharacterDataFromClipboard(characters);
		if (typeof result === 'string') {
			setImportError(result);
		} else {
			addCharacter(result);
			setImportError(null);
		}
	};

	const handleOpenCharacterSheet = (character: Character) => {
		openCharacterSheetModal({ characterId: character.id });
	};

	const handleRequestDelete = (id: string) => {
		setConfirmDelete(id);
	};

	const handleConfirmDelete = () => {
		if (confirmDelete) {
			removeCharacter(confirmDelete);
			setConfirmDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setConfirmDelete(null);
	};

	return (
		<div>
			{importError && (
				<div
					style={{
						padding: '6px',
						marginBottom: '8px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--error)',
						borderRadius: '4px',
						fontSize: '0.9em',
						color: 'var(--error)',
					}}
				>
					<p style={{ margin: '0 0 6px 0' }}>{importError}</p>
					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button onClick={() => setImportError(null)} title='Dismiss' variant='inline' />
					</div>
				</div>
			)}

			{confirmDelete && (
				<div
					style={{
						padding: '6px',
						marginBottom: '8px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						fontSize: '0.9em',
					}}
				>
					<p style={{ margin: '0 0 6px 0' }}>Delete {characters.find(c => c.id === confirmDelete)?.props.name}?</p>
					<div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
						<Button onClick={handleCancelDelete} title='Cancel' variant='inline' />
						<Button onClick={handleConfirmDelete} title='Delete' variant='inline' />
					</div>
				</div>
			)}
			<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
				<Button
					onClick={() => void handleImportFromClipboard()}
					icon={FaClipboard}
					title='Import Character'
					variant='inline'
				/>
				<Button onClick={handleOpenNewCharacterModal} icon={FaPlus} title='New Character' variant='inline' />
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9em' }}>
				{characters.map(character => (
					<div
						key={character.id}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '4px 6px',
							border: '1px solid var(--text)',
							borderRadius: '4px',
						}}
					>
						<span>{character.props.name}</span>
						<div style={{ display: 'flex', gap: '4px' }}>
							<Button onClick={() => handleOpenCharacterSheet(character)} icon={FaEdit} title='Edit' variant='inline' />
							<Button
								onClick={() => handleRequestDelete(character.id)}
								icon={FaTrash}
								title='Delete'
								variant='inline'
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
