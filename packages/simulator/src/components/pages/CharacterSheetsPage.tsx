import { getRecordValues } from '@shattered-wilds/commons';
import { CharacterSheet } from '@shattered-wilds/d12';
import React, { useEffect, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import { FaChevronDown, FaClipboard, FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import { FaCirclePlay } from 'react-icons/fa6';

import { useModals } from '../../hooks/useModals';
import { PREDEFINED_CHARACTERS } from '../../pregen/predefined-characters';
import { useStore } from '../../store';
import { Character, createNewCharacter } from '../../types/ui';
import { importCharacterDataFromClipboard } from '../../utils/clipboard';
import { Navigator, Route } from '../../utils/routes';
import { Button } from '../shared/Button';

import { FullPageCharacterSheet } from './FullPageCharacterSheet';

interface CharacterSheetsPageProps {
	onNavigateToCharacterSheet: (characterId: string) => void;
	onNavigateToOnboarding: () => void;
	initialCharacterId: string | undefined;
}

export const CharacterSheetsPage: React.FC<CharacterSheetsPageProps> = ({
	onNavigateToCharacterSheet,
	onNavigateToOnboarding,
	initialCharacterId,
}) => {
	const characters = useStore(state => state.characters);

	const removeCharacter = useStore(state => state.removeCharacter);
	const addCharacter = useStore(state => state.addCharacter);
	const { openCharacterCreationModal, openConfirmationModal } = useModals();
	const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(initialCharacterId);

	// Update selectedCharacterId when initialCharacterId changes (for URL navigation)
	useEffect(() => {
		setSelectedCharacterId(initialCharacterId);
	}, [initialCharacterId]);
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
		Navigator.to(Route.Characters);
		setSelectedCharacterId(undefined);
	};

	const handleEmptyCharacterCreation = () => {
		openCharacterCreationModal({});
		setShowCreateDropdown(false);
	};

	const handleOnboardingCharacterCreation = () => {
		onNavigateToOnboarding();
		setShowCreateDropdown(false);
	};

	const handleImportFromClipboard = async () => {
		const result = await importCharacterDataFromClipboard();
		if (typeof result === 'string') {
			setImportError(result);
		} else {
			addCharacter(result);
			setImportError(null);
		}
	};

	const handlePredefinedCharacterImport = async () => {
		const currentCharacters = [...characters];
		const predefinedCharacters = getRecordValues(PREDEFINED_CHARACTERS).map(shareString => {
			const props = CharacterSheet.parsePropsFromShareString(shareString);
			return createNewCharacter({ props });
		});
		const findExisting = (character: Character): Character | undefined => {
			return currentCharacters.find(existing => existing.props.name === character.props.name);
		};
		const hasConflicts = predefinedCharacters.some(findExisting);
		let overrideExisting: boolean;
		if (hasConflicts) {
			overrideExisting = await openConfirmationModal({
				title: 'Import Predefined Characters',
				message: [
					'Some predefined characters have the same name as your existing characters.',
					'Do you want to proceed? Existing characters will not be duplicated.',
				].join('\n'),
				confirmText: 'Override',
				cancelText: 'Skip Duplicates',
			});
		} else {
			overrideExisting = false;
		}
		predefinedCharacters.map(character => {
			const existing = findExisting(character);
			if (existing) {
				if (overrideExisting) {
					removeCharacter(existing.id);
					addCharacter(character);
				} else {
					return;
				}
			} else {
				addCharacter(character);
			}
		});
	};

	const handleDeleteCharacter = (character: Character) => {
		setConfirmDelete(character.id);
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

	const DropdownButton = ({ onClick, icon: Icon, title }: { onClick: () => void; icon: IconType; title: string }) => {
		return (
			<button
				onClick={onClick}
				style={{
					width: '100%',
					textAlign: 'left',
					padding: '0.75rem 1rem',
					border: 'none',
					backgroundColor: 'transparent',
					borderBottom: '1px solid var(--text)',
				}}
			>
				<Icon /> {title}
			</button>
		);
	};

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
					<h2 style={{ margin: 0 }}>Character Sheets</h2>
					<div style={{ display: 'flex', gap: '1rem' }}>
						<div ref={dropdownRef} style={{ position: 'relative' }}>
							<button
								onClick={() => setShowCreateDropdown(!showCreateDropdown)}
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
							>
								<FaPlus /> Add Character <FaChevronDown />
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
										minWidth: '320px',
										zIndex: 1000,
										marginTop: '2px',
									}}
								>
									<DropdownButton
										onClick={handlePredefinedCharacterImport}
										icon={FaCirclePlay}
										title='Add Predefined Characters'
									/>
									<DropdownButton onClick={handleImportFromClipboard} icon={FaClipboard} title='Import Character' />
									<DropdownButton onClick={handleEmptyCharacterCreation} icon={FaPlus} title='Empty' />
									<DropdownButton onClick={handleOnboardingCharacterCreation} icon={FaPlus} title='Onboarding' />
								</div>
							)}
						</div>
					</div>
				</div>

				{characters.length === 0 ? (
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
							<h2>No Characters Found</h2>
							<p>Create your first character or import one from clipboard to get started!</p>
							<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
								<Button
									onClick={handlePredefinedCharacterImport}
									icon={FaCirclePlay}
									title='Add Predefined Characters'
								/>
								<Button onClick={handleImportFromClipboard} icon={FaClipboard} title='Import Character' />
								<Button onClick={handleEmptyCharacterCreation} icon={FaPlus} title='Empty' />
								<Button onClick={handleOnboardingCharacterCreation} icon={FaPlus} title='Onboarding' />
							</div>
						</div>
					</div>
				) : (
					<div>
						<div style={{ marginTop: '1rem' }}>
							{characters.map(character => {
								const sheet = CharacterSheet.from(character.props);
								return (
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
											<strong>{sheet.name}</strong> / Level {sheet.level} {sheet.race.toString()}{' '}
											{sheet.characterClass.toString()}
										</span>
										<div style={{ display: 'flex', gap: '0.5rem' }}>
											<Button onClick={() => handleViewCharacter(character)} icon={FaEye} title='View' />
											<Button onClick={() => handleDeleteCharacter(character)} icon={FaTrash} title='Delete' />
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
