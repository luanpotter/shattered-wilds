import React, { useEffect, useState } from 'react';

import { useStore } from '../store';
import { Character, Race, CharacterClass } from '../types';

interface CharacterSheetProps {
	character: Character;
}

// Dropdown component that allows typing and selecting
interface DropdownSelectProps<T extends string> {
	options: Record<string, T>;
	value: T;
	onChange: (value: T) => void;
	id: string;
	disabled?: boolean;
}

function DropdownSelect<T extends string>({
	options,
	value,
	onChange,
	id,
	disabled = false,
}: DropdownSelectProps<T>) {
	const [filter, setFilter] = useState('');
	const [isOpen, setIsOpen] = useState(false);

	// Convert options object to array for filtering
	const optionsArray = Object.values(options);

	// Filter options based on input
	const filteredOptions = filter
		? optionsArray.filter(option => option.toLowerCase().includes(filter.toLowerCase()))
		: optionsArray;

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilter(e.target.value);
		setIsOpen(true);
	};

	const handleOptionSelect = (option: T) => {
		onChange(option);
		setFilter('');
		setIsOpen(false);
	};

	return (
		<div style={{ position: 'relative', flex: 1 }}>
			<input
				id={id}
				type='text'
				value={filter || value}
				onChange={handleInputChange}
				onFocus={() => setIsOpen(true)}
				onBlur={() => window.setTimeout(() => setIsOpen(false), 200)}
				disabled={disabled}
				style={{
					width: '100%',
					boxSizing: 'border-box',
					fontSize: '0.9em',
					padding: '2px 4px',
					margin: 0,
					height: '24px',
				}}
			/>
			{isOpen && !disabled && (
				<div
					style={{
						position: 'absolute',
						top: '24px',
						left: 0,
						width: '100%',
						maxHeight: '150px',
						overflowY: 'auto',
						backgroundColor: 'var(--background)',
						border: '1px solid var(--text)',
						zIndex: 10000, // Very high to ensure it's on top of everything
						boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
					}}
				>
					{filteredOptions.map(option => (
						<div
							key={option}
							onMouseDown={() => handleOptionSelect(option as T)}
							style={{
								padding: '4px',
								cursor: 'pointer',
								backgroundColor: option === value ? 'var(--background-alt)' : undefined,
							}}
						>
							{option}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
	const updateCharacter = useStore(state => state.updateCharacter);
	const windows = useStore(state => state.windows);
	const updateWindow = useStore(state => state.updateWindow);

	// Update window title when character name changes
	useEffect(() => {
		// Find the window for this character
		const characterWindow = windows.find(
			w => w.type === 'character-sheet' && w.characterId === character.id
		);

		if (characterWindow) {
			// Only update if the title doesn't match the current character name
			const expectedTitle = `${character.sheet.name}'s Sheet`;
			if (characterWindow.title !== expectedTitle) {
				updateWindow({
					...characterWindow,
					title: expectedTitle,
				});
			}
		}
	}, [character.sheet.name, character.id, windows, updateWindow]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacter({
			...character,
			sheet: {
				...character.sheet,
				name: e.target.value,
			},
		});
	};

	const handleRaceChange = (race: Race) => {
		updateCharacter({
			...character,
			sheet: {
				...character.sheet,
				race,
			},
		});
	};

	const handleClassChange = (characterClass: CharacterClass) => {
		updateCharacter({
			...character,
			sheet: {
				...character.sheet,
				class: characterClass,
			},
		});
	};

	// Common styles for form rows - reduced margins for compactness
	const formRowStyle = {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '4px', // Reduced from 12px
		gap: '4px', // Reduced from 8px
		width: '100%',
	};

	const labelStyle = {
		fontSize: '0.9em',
		whiteSpace: 'nowrap' as const,
		flexShrink: 0,
		paddingRight: '4px',
	};

	const inputStyle = {
		flex: 1,
		boxSizing: 'border-box' as const,
		fontSize: '0.9em',
		padding: '2px 4px', // More compact padding
		margin: 0, // Remove any default margins
		height: '24px', // Fixed height for compactness
		width: '100%', // Ensure full width
	};

	// Style for grouped form elements
	const halfRowStyle = {
		display: 'flex',
		flex: 1,
		alignItems: 'center',
		gap: '4px', // Maintain consistent gap
	};

	return (
		<div style={{ margin: 0, padding: 0, width: '100%' }}>
			<div style={formRowStyle}>
				<label htmlFor='character-name' style={labelStyle}>
					Name:
				</label>
				<input
					id='character-name'
					type='text'
					value={character.sheet.name}
					onChange={handleNameChange}
					style={inputStyle}
				/>
			</div>

			{/* Race and Class on the same line */}
			<div style={formRowStyle}>
				<div style={halfRowStyle}>
					<label htmlFor='character-race' style={labelStyle}>
						Race:
					</label>
					<DropdownSelect
						id='character-race'
						options={Race}
						value={character.sheet.race}
						onChange={handleRaceChange}
					/>
				</div>

				<div style={halfRowStyle}>
					<label htmlFor='character-class' style={labelStyle}>
						Class:
					</label>
					<DropdownSelect
						id='character-class'
						options={CharacterClass}
						value={character.sheet.class}
						onChange={handleClassChange}
					/>
				</div>
			</div>
		</div>
	);
};
