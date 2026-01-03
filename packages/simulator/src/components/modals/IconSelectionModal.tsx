import React, { useState, useEffect, useRef } from 'react';
import { IconType } from 'react-icons';
import * as Fa6Icons from 'react-icons/fa6';

import { getIconSuggestions, recordIconUsage } from '../../utils/faIcons';
import { Button } from '../shared/Button';

interface IconSelectionModalProps {
	currentIcon: string | null;
	onSelect: (icon: string) => void;
	onClose: () => void;
}

// Dynamic icon loader from fa6
const getIconComponent = (iconName: string): IconType | null => {
	const icons = Fa6Icons as Record<string, IconType>;
	return icons[iconName] || null;
};

export const IconSelectionModal: React.FC<IconSelectionModalProps> = ({ currentIcon, onSelect, onClose }) => {
	const [searchQuery, setSearchQuery] = useState(
		currentIcon
			? currentIcon
					.replace(/^Fa/, '')
					.replace(/([A-Z])/g, ' $1')
					.trim()
			: '',
	);
	const [suggestions, setSuggestions] = useState(getIconSuggestions('', 5));
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	useEffect(() => {
		setSuggestions(getIconSuggestions(searchQuery, 5));
	}, [searchQuery]);

	const handleIconClick = (iconName: string) => {
		recordIconUsage(iconName);
		onSelect(iconName);
		onClose();
	};

	const handleConfirm = () => {
		if (suggestions.length > 0) {
			const iconName = suggestions[0].name;
			recordIconUsage(iconName);
			onSelect(iconName);
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleConfirm();
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minWidth: '320px' }}>
			{/* Search input */}
			<input
				ref={inputRef}
				type='text'
				value={searchQuery}
				onChange={e => setSearchQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder='Search icons...'
				autoComplete='off'
				style={{ width: '100%', boxSizing: 'border-box' }}
			/>

			{/* Icon suggestions */}
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '72px' }}>
				{suggestions.length > 0 ? (
					suggestions.map(suggestion => {
						const IconComponent = getIconComponent(suggestion.name);
						if (!IconComponent) return null;
						return (
							<button
								key={suggestion.name}
								onClick={() => handleIconClick(suggestion.name)}
								title={suggestion.displayName}
								aria-label={`Select ${suggestion.displayName}`}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flex: '1 1 56px',
									height: '56px',
									fontSize: '32px',
									borderRadius: '6px',
									border: '1px solid var(--text)',
									background: 'var(--background-alt)',
									cursor: 'pointer',
									padding: 0,
									color: 'var(--text)',
								}}
							>
								<IconComponent />
							</button>
						);
					})
				) : (
					<div style={{ color: 'var(--text)', opacity: 0.6 }}>No matches found.</div>
				)}
			</div>

			{/* Action buttons */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
				<Button variant='inline' onClick={onClose} title='Cancel' />
				<Button variant='inline' onClick={handleConfirm} title='Stamp' disabled={suggestions.length === 0} />
			</div>
		</div>
	);
};
