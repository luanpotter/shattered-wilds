import React from 'react';
import { FaPlus } from 'react-icons/fa';

import { RemovableCard } from './RemovableCard';

interface CardSectionProps {
	title: string;
	cards: Array<{ key: string; title: string; tooltip: string; children: React.ReactNode; href?: string }>;
	onAdd: () => void;
	onRemove?: (key: string) => void;
}

export const CardSection: React.FC<CardSectionProps> = ({ title, cards, onAdd, onRemove }) => {
	return (
		<div style={{ marginBottom: '16px' }}>
			<h4 style={{ margin: '0 0 8px 0' }}>{title}</h4>
			<div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
				{cards.map((card, idx) => (
					<RemovableCard
						key={idx}
						title={card.title}
						tooltip={card.tooltip}
						{...(card.href ? { href: card.href } : {})}
						{...(onRemove ? { onRemove: () => onRemove(card.key) } : {})}
					>
						{card.children}
					</RemovableCard>
				))}
				<button
					onClick={onAdd}
					style={{
						backgroundColor: 'var(--background-alt)',
						border: '1px dashed var(--text)',
						borderRadius: '4px',
						padding: '8px',
						minWidth: '60px',
						minHeight: '60px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: 0.6,
						transition: 'opacity 0.2s',
					}}
					onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
					onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
					title={`Add ${title}`}
				>
					<FaPlus size={20} />
				</button>
			</div>
		</div>
	);
};
