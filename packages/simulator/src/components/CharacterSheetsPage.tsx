import React, { useState } from 'react';
import { FaPlus, FaEye, FaTrash, FaArrowLeft, FaClipboard } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';

import { FullPageCharacterSheet } from './FullPageCharacterSheet';

interface CharacterSheetsPageProps {
	onBackToSimulator: () => void;
	onNavigateToCharacterSheet: (characterId: string) => void;
	initialCharacterId: string | null;
}

export const CharacterSheetsPage: React.FC<CharacterSheetsPageProps> = ({
	onBackToSimulator,
	onNavigateToCharacterSheet,
	initialCharacterId,
}) => {
	const characters = useStore(state => state.characters);
	const removeCharacter = useStore(state => state.removeCharacter);
	const addCharacter = useStore(state => state.addCharacter);
	const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(initialCharacterId);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [importError, setImportError] = useState<string | null>(null);

	const handleViewCharacter = (character: Character) => {
		onNavigateToCharacterSheet(character.id);
		setSelectedCharacterId(character.id);
	};

	const handleBackToList = () => {
		// Navigate back to character list by pushing /characters
		window.history.pushState(null, '', '/characters');
		setSelectedCharacterId(null);
	};

	const handleCreateNewCharacter = () => {
		// TODO: Implement character creation
		// Placeholder for future implementation
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

			const newCharacter: Character = {
				id: window.crypto.randomUUID(),
				props: props as { name: string } & Record<string, string>,
				position: { q: 0, r: 0 }, // Default position for imported characters
				automaticMode: false,
			};

			addCharacter(newCharacter);
			setImportError(null);
		} catch {
			setImportError('Failed to import from clipboard. Make sure you have clipboard permissions.');
		}
	};

	const handleDeleteCharacter = (id: string) => {
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

	// If a character is selected, show the full-page character sheet
	if (selectedCharacterId) {
		return (
			<FullPageCharacterSheet
				characterId={selectedCharacterId}
				onBack={handleBackToList}
				onBackToSimulator={onBackToSimulator}
				onNavigateToCharacterSheet={onNavigateToCharacterSheet}
			/>
		);
	}

	return (
		<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Main Content - No header since we're in a full page context */}
			<main
				style={{
					flex: 1,
					padding: '2rem',
					overflow: 'auto',
					maxWidth: '1400px',
					margin: '0 auto',
					width: '100%',
					boxSizing: 'border-box',
				}}
			>
				{importError && (
					<div
						style={{
							padding: '1rem',
							marginBottom: '1rem',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--error)',
							borderRadius: '4px',
							color: 'var(--error)',
						}}
					>
						<p style={{ margin: '0 0 1rem 0' }}>{importError}</p>
						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<button onClick={() => setImportError(null)} style={{ padding: '0.5rem 1rem' }}>
								Dismiss
							</button>
						</div>
					</div>
				)}

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
								Are you sure you want to delete{' '}
								{characters.find(c => c.id === confirmDelete)?.props.name}?
							</p>
							<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
								<button onClick={handleCancelDelete}>Cancel</button>
								<button
									onClick={handleConfirmDelete}
									style={{
										backgroundColor: 'var(--error)',
										color: 'white',
									}}
								>
									Delete
								</button>
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<button onClick={onBackToSimulator}>
							<FaArrowLeft /> Back to Simulator
						</button>
						<h2 style={{ margin: 0 }}>Character Sheets</h2>
					</div>
					<div style={{ display: 'flex', gap: '1rem' }}>
						<button onClick={() => void handleImportFromClipboard()}>
							<FaClipboard /> Import Character
						</button>
						<button onClick={handleCreateNewCharacter}>
							<FaPlus /> Create New Character
						</button>
					</div>
				</div>

				{characters.length === 0 ? (
					<div style={{ textAlign: 'center', marginTop: '4rem' }}>
						<h2>No Characters Found</h2>
						<p>Create your first character or import one from clipboard to get started!</p>
						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
							<button
								onClick={() => void handleImportFromClipboard()}
								style={{ padding: '1rem 2rem', fontSize: '1.1em' }}
							>
								<FaClipboard /> Import Character
							</button>
							<button
								onClick={handleCreateNewCharacter}
								style={{ padding: '1rem 2rem', fontSize: '1.1em' }}
							>
								<FaPlus /> Create New Character
							</button>
						</div>
					</div>
				) : (
					<div>
						<div style={{ marginTop: '1rem' }}>
							{characters.map(character => (
								<div
									key={character.id}
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
										<strong>{character.props.name}</strong> / Level{' '}
										{character.props['level'] || '1'} {character.props['race'] || 'Unknown'}{' '}
										{character.props['class'] || 'Unknown'}
									</span>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<button
											onClick={() => handleViewCharacter(character)}
											style={{ padding: '0.5rem 1rem' }}
										>
											<FaEye /> View
										</button>
										<button
											onClick={() => handleDeleteCharacter(character.id)}
											style={{
												padding: '0.5rem',
												backgroundColor: 'var(--error)',
												color: 'white',
											}}
										>
											<FaTrash />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</main>
		</div>
	);
};
