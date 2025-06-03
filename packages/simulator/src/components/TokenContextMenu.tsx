import React from 'react';
import { FaUser, FaFistRaised, FaRuler } from 'react-icons/fa';

import { Character, CharacterSheet } from '../types';

interface TokenContextMenuProps {
	character: Character;
	position: { x: number; y: number };
	onClose: () => void;
	onOpenCharacterSheet: (character: Character) => void;
	onAttackAction?: (character: Character, attackIndex: number) => void;
	onMeasureAction?: (character: Character) => void;
}

export const TokenContextMenu: React.FC<TokenContextMenuProps> = ({
	character,
	position,
	onClose,
	onOpenCharacterSheet,
	onAttackAction,
	onMeasureAction,
}) => {
	const sheet = CharacterSheet.from(character.props);
	const basicAttacks = sheet.getBasicAttacks();

	const menuStyle: React.CSSProperties = {
		position: 'fixed',
		left: position.x,
		top: position.y,
		backgroundColor: 'var(--background)',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
		zIndex: 1000,
		minWidth: '200px',
	};

	const menuItemStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '8px 12px',
		cursor: 'pointer',
		userSelect: 'none',
	};

	const menuItemHoverStyle: React.CSSProperties = {
		backgroundColor: 'var(--background-alt)',
	};

	const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

	React.useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.token-context-menu')) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	};

	return (
		<div className='token-context-menu' style={menuStyle} role='menu'>
			{/* Character Sheet Option */}
			<div
				role='menuitem'
				tabIndex={0}
				style={{
					...menuItemStyle,
					...(hoveredItem === 'sheet' ? menuItemHoverStyle : {}),
				}}
				onMouseEnter={() => setHoveredItem('sheet')}
				onMouseLeave={() => setHoveredItem(null)}
				onClick={() => {
					onOpenCharacterSheet(character);
					onClose();
				}}
				onKeyDown={e =>
					handleKeyDown(e, () => {
						onOpenCharacterSheet(character);
						onClose();
					})
				}
			>
				<FaUser size={14} />
				<span>See Character Sheet</span>
			</div>

			{/* Measure Option */}
			{onMeasureAction && (
				<div
					role='menuitem'
					tabIndex={0}
					style={{
						...menuItemStyle,
						...(hoveredItem === 'measure' ? menuItemHoverStyle : {}),
					}}
					onMouseEnter={() => setHoveredItem('measure')}
					onMouseLeave={() => setHoveredItem(null)}
					onClick={() => {
						onMeasureAction(character);
						onClose();
					}}
					onKeyDown={e =>
						handleKeyDown(e, () => {
							onMeasureAction(character);
							onClose();
						})
					}
				>
					<FaRuler size={14} />
					<span>Measure</span>
				</div>
			)}

			{/* Attack Options */}
			{basicAttacks.length > 0 && onAttackAction && (
				<>
					{/* Separator */}
					<div
						style={{ height: '1px', backgroundColor: 'var(--text)', margin: '4px 0', opacity: 0.3 }}
					/>

					{basicAttacks.map((attack, index) => (
						<div
							key={`attack-${index}`}
							role='menuitem'
							tabIndex={0}
							style={{
								...menuItemStyle,
								...(hoveredItem === `attack-${index}` ? menuItemHoverStyle : {}),
							}}
							onMouseEnter={() => setHoveredItem(`attack-${index}`)}
							onMouseLeave={() => setHoveredItem(null)}
							onClick={() => {
								onAttackAction(character, index);
								onClose();
							}}
							onKeyDown={e =>
								handleKeyDown(e, () => {
									onAttackAction(character, index);
									onClose();
								})
							}
						>
							<FaFistRaised size={14} />
							<span>Attack: {attack.name}</span>
						</div>
					))}
				</>
			)}
		</div>
	);
};
