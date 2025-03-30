import React, { useEffect, useState, useRef } from 'react';

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
	const [inputValue, setInputValue] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	// Convert options object to array for filtering
	const optionsArray = Object.values(options);

	// Filter options based on input
	const filteredOptions = inputValue
		? optionsArray.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()))
		: optionsArray;

	// Always ensure we have a valid selection
	useEffect(() => {
		setHighlightedIndex(0);
	}, [inputValue, isOpen]);

	// Get suggestion (first matching option)
	const suggestion = filteredOptions.length > 0 ? filteredOptions[highlightedIndex] : value;

	// Handle input changes with validation
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;

		// Check if the input is empty or matches at least one option
		const matchesAnyOption =
			newValue === '' ||
			optionsArray.some(option => option.toLowerCase().includes(newValue.toLowerCase()));

		if (matchesAnyOption) {
			setInputValue(newValue);
			setIsOpen(true);
			setHighlightedIndex(0);
		}
	};

	const handleOptionSelect = (option: T) => {
		onChange(option);
		setInputValue('');
		setIsOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Tab') {
			// Do NOT prevent default - allow natural tab navigation after handling selection

			if (filteredOptions.length > 0) {
				// Select current highlighted option
				handleOptionSelect(filteredOptions[highlightedIndex] as T);

				// The default tab behavior will naturally move to the next field
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredOptions.length > 0) {
				handleOptionSelect(filteredOptions[highlightedIndex] as T);
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setIsOpen(false);
			setInputValue('');
			inputRef.current?.blur();
		}
	};

	const handleBlur = () => {
		// When losing focus, just close the dropdown but keep the current selection
		window.setTimeout(() => {
			setIsOpen(false);

			// Only select an option if the user was in the middle of typing something
			if (inputValue) {
				if (filteredOptions.length > 0) {
					// Select the first matching option if there's input
					handleOptionSelect(filteredOptions[0] as T);
				} else {
					// If no options match, just clear the input field
					setInputValue('');
				}
			}
			// If inputValue is empty, do nothing and keep the current selection
		}, 200);
	};

	return (
		<div style={{ position: 'relative', flex: 1 }}>
			<div style={{ position: 'relative', width: '100%' }}>
				<input
					ref={inputRef}
					id={id}
					type='text'
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsOpen(true)}
					onBlur={handleBlur}
					disabled={disabled}
					style={{
						width: '100%',
						boxSizing: 'border-box',
						fontSize: '0.9em',
						padding: '2px 4px',
						margin: 0,
						height: '24px',
					}}
					placeholder={value}
				/>
				{inputValue && suggestion && (
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							paddingLeft: `${4 + inputValue.length * 0.59}em`,
							height: '24px',
							lineHeight: '24px',
							color: 'gray',
							pointerEvents: 'none',
							fontSize: '0.9em',
						}}
					>
						{suggestion.substring(inputValue.length)}
					</div>
				)}
			</div>
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
					{filteredOptions.map((option, index) => (
						<div
							key={option}
							onMouseDown={() => handleOptionSelect(option as T)}
							onMouseEnter={() => setHighlightedIndex(index)}
							style={{
								padding: '4px',
								cursor: 'pointer',
								backgroundColor: index === highlightedIndex ? 'var(--background-alt)' : undefined,
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
