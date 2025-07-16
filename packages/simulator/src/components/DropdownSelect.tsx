import React, { useState, useRef, useEffect } from 'react';

interface DropdownSelectProps<T extends string> {
	options: Record<string, T>;
	value: T;
	onChange: (value: T) => void;
	id: string;
	disabled?: boolean;
	label?: string;
}

function DropdownSelect<T extends string>({
	options,
	value,
	onChange,
	id,
	disabled = false,
	label,
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
			newValue === '' || optionsArray.some(option => option.toLowerCase().includes(newValue.toLowerCase()));

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

	const dropdownComponent = (
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
					aria-label={label}
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

	// If there's a label, wrap the component
	if (label) {
		return (
			<div style={{ display: 'flex', flexDirection: 'column' }}>
				<label htmlFor={id} style={{ display: 'block', marginBottom: '5px' }}>
					{label}
				</label>
				{dropdownComponent}
			</div>
		);
	}

	return dropdownComponent;
}

export default DropdownSelect;
