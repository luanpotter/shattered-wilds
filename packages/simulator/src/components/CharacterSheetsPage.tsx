import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEye, FaTrash, FaArrowLeft, FaClipboard, FaChevronDown } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';
import { findNextWindowPosition, findNextEmptyHexPosition } from '../utils';

import { FullPageCharacterSheet } from './FullPageCharacterSheet';
import { Button } from './shared/Button';

interface CharacterSheetsPageProps {
	onNavigateToCharacterSheet: (characterId: string) => void;
	onNavigateToOnboarding: () => void;
	initialCharacterId: string | null;
}

export const CharacterSheetsPage: React.FC<CharacterSheetsPageProps> = ({
	onNavigateToCharacterSheet,
	onNavigateToOnboarding,
	initialCharacterId,
}) => {
	const characters = useStore(state => state.characters);
	const windows = useStore(state => state.windows);
	const removeCharacter = useStore(state => state.removeCharacter);
	const addCharacter = useStore(state => state.addCharacter);
	const addWindow = useStore(state => state.addWindow);
	const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(initialCharacterId);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [importError, setImportError] = useState<string | null>(null);
	const [showCreateDropdown, setShowCreateDropdown] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowCreateDropdown(false);
			}
		};

		if (showCreateDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showCreateDropdown]);

	const handleViewCharacter = (character: Character) => {
		onNavigateToCharacterSheet(character.id);
		setSelectedCharacterId(character.id);
	};

	const handleBackToList = () => {
		// Navigate back to character list using hash routing
		window.location.hash = '#/characters';
		setSelectedCharacterId(null);
	};

	const handleEmptyCharacterCreation = () => {
		const hexPosition = findNextEmptyHexPosition(characters);
		addWindow({
			id: window.crypto.randomUUID(),
			title: `Create Character (${hexPosition.q}, ${hexPosition.r})`,
			type: 'character-creation',
			position: findNextWindowPosition(windows),
			hexPosition: hexPosition,
		});
		setShowCreateDropdown(false);
	};

	const handleOnboardingCharacterCreation = () => {
		onNavigateToOnboarding();
		setShowCreateDropdown(false);
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
		return <FullPageCharacterSheet characterId={selectedCharacterId} onBack={handleBackToList} />;
	}

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Main Content - No header since we're in a full page context */}
			<main
				style={{
					flex: 1,
					padding: '2rem',
					paddingBottom: '3rem',
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
							<Button onClick={() => setImportError(null)} title='Dismiss' />
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
								Are you sure you want to delete {characters.find(c => c.id === confirmDelete)?.props.name}?
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<Button onClick={() => (window.location.hash = '#/')} icon={FaArrowLeft} title='Back to Simulator' />
						<h2 style={{ margin: 0 }}>Character Sheets</h2>
					</div>
					<div style={{ display: 'flex', gap: '1rem' }}>
						<Button onClick={() => void handleImportFromClipboard()} icon={FaClipboard} title='Import Character' />
						<div ref={dropdownRef} style={{ position: 'relative' }}>
							<button
								onClick={() => setShowCreateDropdown(!showCreateDropdown)}
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
							>
								<FaPlus /> Create New Character <FaChevronDown />
							</button>
							{showCreateDropdown && (
								<div
									style={{
										position: 'absolute',
										top: '100%',
										right: 0,
										backgroundColor: 'var(--background)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										minWidth: '200px',
										zIndex: 1000,
										marginTop: '2px',
									}}
								>
									<button
										onClick={handleEmptyCharacterCreation}
										style={{
											width: '100%',
											textAlign: 'left',
											padding: '0.75rem 1rem',
											border: 'none',
											backgroundColor: 'transparent',
											borderBottom: '1px solid var(--text)',
										}}
									>
										<FaPlus /> Empty
									</button>
									<button
										onClick={handleOnboardingCharacterCreation}
										style={{
											width: '100%',
											textAlign: 'left',
											padding: '0.75rem 1rem',
											border: 'none',
											backgroundColor: 'transparent',
										}}
									>
										<FaPlus /> Onboarding
									</button>
								</div>
							)}
						</div>
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
							<div style={{ position: 'relative' }}>
								<button
									onClick={() => setShowCreateDropdown(!showCreateDropdown)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '1rem 2rem',
										fontSize: '1.1em',
									}}
								>
									<FaPlus /> Create New Character <FaChevronDown />
								</button>
								{showCreateDropdown && (
									<div
										style={{
											position: 'absolute',
											top: '100%',
											left: '50%',
											transform: 'translateX(-50%)',
											backgroundColor: 'var(--background)',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											minWidth: '200px',
											zIndex: 1000,
											marginTop: '2px',
										}}
									>
										<button
											onClick={handleEmptyCharacterCreation}
											style={{
												width: '100%',
												textAlign: 'left',
												padding: '0.75rem 1rem',
												border: 'none',
												backgroundColor: 'transparent',
												borderBottom: '1px solid var(--text)',
											}}
										>
											<FaPlus /> Empty
										</button>
										<button
											onClick={handleOnboardingCharacterCreation}
											style={{
												width: '100%',
												textAlign: 'left',
												padding: '0.75rem 1rem',
												border: 'none',
												backgroundColor: 'transparent',
											}}
										>
											<FaPlus /> Onboarding
										</button>
									</div>
								)}
							</div>
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
										<strong>{character.props.name}</strong> / Level {character.props['level'] || '1'}{' '}
										{character.props['race'] || 'Unknown'} {character.props['class'] || 'Unknown'}
									</span>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Button onClick={() => handleViewCharacter(character)} icon={FaEye} title='View' />
										<Button onClick={() => handleDeleteCharacter(character.id)} icon={FaTrash} title='Delete' />
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
