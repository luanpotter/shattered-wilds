import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaClipboard } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';
import { findNextWindowPosition, findNextEmptyHexPosition } from '../utils';

export const CharacterList: React.FC = () => {
	const characters = useStore(state => state.characters);
	const windows = useStore(state => state.windows);
	const addWindow = useStore(state => state.addWindow);
	const removeCharacter = useStore(state => state.removeCharacter);
	const addCharacter = useStore(state => state.addCharacter);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [importError, setImportError] = useState<string | null>(null);

	const handleOpenNewCharacterModal = () => {
		const hexPosition = findNextEmptyHexPosition(characters);

		addWindow({
			id: window.crypto.randomUUID(),
			title: `Create Character (${hexPosition.q}, ${hexPosition.r})`,
			type: 'character-creation',
			position: findNextWindowPosition(windows),
			hexPosition: hexPosition,
		});
	};

	const handleImportFromClipboard = async () => {
		try {
			const clipboardText = await window.navigator.clipboard.readText();
			if (!clipboardText.trim()) {
				setImportError('Clipboard is empty');
				return;
			}

			const props: Record<string, string> = {};
			const lines = clipboardText.split('\n');

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine) continue;

				const colonIndex = trimmedLine.indexOf(':');
				if (colonIndex === -1) continue;

				const key = trimmedLine.substring(0, colonIndex).trim();
				const value = trimmedLine.substring(colonIndex + 1).trim();

				props[key] = value;
			}

			const position = findNextEmptyHexPosition(characters);
			const newCharacter: Character = {
				id: window.crypto.randomUUID(),
				props: props as { name: string } & Record<string, string>,
				position: position,
				automaticMode: false,
			};

			addCharacter(newCharacter);
			setImportError(null);
		} catch {
			setImportError('Failed to import from clipboard. Make sure you have clipboard permissions.');
		}
	};

	const handleOpenCharacterSheet = (character: Character) => {
		addWindow({
			id: window.crypto.randomUUID(),
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId: character.id,
			position: findNextWindowPosition(windows),
		});
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
						<button onClick={() => setImportError(null)} style={{ padding: '2px 6px', fontSize: '0.9em' }}>
							Dismiss
						</button>
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
						<button onClick={handleCancelDelete} style={{ padding: '2px 6px', fontSize: '0.9em' }}>
							Cancel
						</button>
						<button
							onClick={handleConfirmDelete}
							style={{
								padding: '2px 6px',
								fontSize: '0.9em',
								backgroundColor: 'var(--error)',
								color: 'white',
							}}
						>
							Delete
						</button>
					</div>
				</div>
			)}
			<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
				<button onClick={() => void handleImportFromClipboard()} style={{ padding: '4px 8px', fontSize: '0.9em' }}>
					<FaClipboard /> Import Character
				</button>
				<button onClick={handleOpenNewCharacterModal} style={{ padding: '4px 8px', fontSize: '0.9em' }}>
					<FaPlus /> New Character
				</button>
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
							<button
								onClick={() => handleOpenCharacterSheet(character)}
								style={{ padding: '2px 6px', fontSize: '0.9em' }}
							>
								<FaEdit /> Edit
							</button>
							<button
								onClick={() => handleRequestDelete(character.id)}
								style={{
									padding: '2px 6px',
									fontSize: '0.9em',
								}}
							>
								<FaTrash /> Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
