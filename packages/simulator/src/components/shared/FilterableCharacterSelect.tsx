import React, { useRef, useState } from 'react';
import { FaCheck, FaChevronDown, FaPlus, FaTimes } from 'react-icons/fa';

import { Character } from '../../types/ui';

interface FilterableCharacterSelectProps {
	characters: Character[];
	selectedIds: string[];
	onToggle: (characterId: string) => void;
	placeholder?: string;
	multiSelect?: boolean;
}

export const FilterableCharacterSelect: React.FC<FilterableCharacterSelectProps> = ({
	characters,
	selectedIds,
	onToggle,
	placeholder = 'Search characters...',
	multiSelect = true,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const filteredCharacters = characters.filter(char => char.props.name.toLowerCase().includes(filter.toLowerCase()));

	const handleBlur = (e: React.FocusEvent) => {
		// Check if the new focus target is within our container
		if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
			setIsOpen(false);
		}
	};

	const handleSelect = (characterId: string) => {
		onToggle(characterId);
		setFilter('');
		if (!multiSelect) {
			setIsOpen(false);
		}
	};

	const selectedCharacters = characters.filter(c => selectedIds.includes(c.id));

	return (
		<div ref={containerRef} style={{ position: 'relative' }} onBlur={handleBlur}>
			<div
				role='combobox'
				aria-expanded={isOpen}
				aria-haspopup='listbox'
				aria-controls='character-listbox'
				tabIndex={-1}
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '0.25rem',
					padding: '0.25rem',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					backgroundColor: 'var(--background)',
					minHeight: '2.5rem',
					alignItems: 'center',
					cursor: 'text',
				}}
				onClick={() => {
					setIsOpen(true);
					inputRef.current?.focus();
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						setIsOpen(true);
						inputRef.current?.focus();
					}
				}}
			>
				{selectedCharacters.map(char => (
					<span
						key={char.id}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.25rem',
							padding: '0.25rem 0.5rem',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							fontSize: '0.85rem',
						}}
					>
						{char.props.name}
						<button
							onClick={e => {
								e.stopPropagation();
								onToggle(char.id);
							}}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '0',
								display: 'flex',
								alignItems: 'center',
								color: 'inherit',
							}}
						>
							<FaTimes size={10} />
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					type='text'
					value={filter}
					onChange={e => setFilter(e.target.value)}
					onFocus={() => setIsOpen(true)}
					onKeyDown={e => {
						if (e.key === 'Enter' && filteredCharacters.length > 0) {
							e.preventDefault();
							handleSelect(filteredCharacters[0].id);
						}
					}}
					placeholder={selectedCharacters.length === 0 ? placeholder : ''}
					style={{
						flex: 1,
						minWidth: '100px',
						border: 'none',
						outline: 'none',
						padding: '0.25rem',
						backgroundColor: 'transparent',
						fontSize: '0.9rem',
					}}
				/>
				<FaChevronDown
					size={12}
					style={{
						marginRight: '0.5rem',
						opacity: 0.5,
						transform: isOpen ? 'rotate(180deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</div>

			{isOpen && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						maxHeight: '200px',
						overflowY: 'auto',
						backgroundColor: 'var(--background)',
						border: '1px solid var(--text)',
						borderTop: 'none',
						borderRadius: '0 0 4px 4px',
						zIndex: 100,
					}}
				>
					{filteredCharacters.length === 0 ? (
						<div style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
							No characters found
						</div>
					) : (
						filteredCharacters.map(char => {
							const isSelected = selectedIds.includes(char.id);
							return (
								<button
									key={char.id}
									onClick={() => handleSelect(char.id)}
									style={{
										width: '100%',
										padding: '0.5rem 0.75rem',
										border: 'none',
										backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										textAlign: 'left',
									}}
									onMouseEnter={e => {
										if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--background-alt)';
									}}
									onMouseLeave={e => {
										if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									<span>{char.props.name}</span>
									{isSelected && <FaCheck size={12} />}
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
};

interface AddCharacterDropdownProps {
	characters: Character[];
	onAdd: (characterId: string) => void;
	placeholder?: string;
}

export const AddCharacterDropdown: React.FC<AddCharacterDropdownProps> = ({
	characters,
	onAdd,
	placeholder = 'Add character...',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const filteredCharacters = characters.filter(char => char.props.name.toLowerCase().includes(filter.toLowerCase()));

	const handleBlur = (e: React.FocusEvent) => {
		if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
			setIsOpen(false);
		}
	};

	const handleSelect = (characterId: string) => {
		onAdd(characterId);
		setFilter('');
		setIsOpen(false);
	};

	return (
		<div ref={containerRef} style={{ position: 'relative', minWidth: '200px' }} onBlur={handleBlur}>
			<div
				role='combobox'
				aria-expanded={isOpen}
				aria-haspopup='listbox'
				aria-controls='add-character-listbox'
				tabIndex={-1}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
					padding: '0.25rem 0.5rem',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					backgroundColor: 'var(--background)',
					cursor: 'text',
				}}
				onClick={() => {
					setIsOpen(true);
					inputRef.current?.focus();
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						setIsOpen(true);
						inputRef.current?.focus();
					}
				}}
			>
				<FaPlus size={12} style={{ opacity: 0.7 }} />
				<input
					ref={inputRef}
					type='text'
					value={filter}
					onChange={e => setFilter(e.target.value)}
					onFocus={() => setIsOpen(true)}
					onKeyDown={e => {
						if (e.key === 'Enter' && filteredCharacters.length > 0) {
							e.preventDefault();
							handleSelect(filteredCharacters[0].id);
						}
					}}
					placeholder={placeholder}
					style={{
						flex: 1,
						border: 'none',
						outline: 'none',
						padding: '0.25rem',
						backgroundColor: 'transparent',
						fontSize: '0.9rem',
					}}
				/>
				<FaChevronDown
					size={12}
					style={{
						opacity: 0.5,
						transform: isOpen ? 'rotate(180deg)' : 'none',
						transition: 'transform 0.2s',
					}}
				/>
			</div>

			{isOpen && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						maxHeight: '200px',
						overflowY: 'auto',
						backgroundColor: 'var(--background)',
						border: '1px solid var(--text)',
						borderTop: 'none',
						borderRadius: '0 0 4px 4px',
						zIndex: 100,
					}}
				>
					{filteredCharacters.length === 0 ? (
						<div style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No characters</div>
					) : (
						filteredCharacters.map(char => (
							<button
								key={char.id}
								onClick={() => handleSelect(char.id)}
								style={{
									width: '100%',
									padding: '0.5rem 0.75rem',
									border: 'none',
									backgroundColor: 'transparent',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									textAlign: 'left',
								}}
								onMouseEnter={e => {
									e.currentTarget.style.backgroundColor = 'var(--background-alt)';
								}}
								onMouseLeave={e => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								{char.props.name}
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
};
