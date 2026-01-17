import React, { useState } from 'react';
import { FaBan, FaCheck, FaTimes } from 'react-icons/fa';

import { Bar } from '../shared/Bar';

interface RemovableCardProps {
	title: string;
	tooltip: string;
	children: React.ReactNode;
	onRemove?: () => void;
	href?: string;
}

export const RemovableCard: React.FC<RemovableCardProps> = ({ title, tooltip, children, onRemove, href }) => {
	const [showConfirm, setShowConfirm] = useState(false);

	const handleRemoveClick = () => {
		setShowConfirm(true);
	};

	const handleConfirm = () => {
		setShowConfirm(false);
		onRemove?.();
	};

	const handleCancel = () => {
		setShowConfirm(false);
	};

	return (
		<div
			style={{
				backgroundColor: 'var(--background-alt)',
				border: '1px solid var(--text)',
				borderRadius: '4px',
				padding: '8px',
				position: 'relative',
				maxWidth: '450px',
				height: '100%',
				boxSizing: 'border-box',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
				<div style={{ flex: 1, display: 'flex', justifyContent: 'start' }}>
					<div style={{ fontWeight: 'bold' }} title={tooltip}>
						{href ? (
							<a href={href} target='_blank' rel='noreferrer'>
								{title}
							</a>
						) : (
							title
						)}
					</div>
				</div>
				{onRemove && !showConfirm && (
					<button
						onClick={handleRemoveClick}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '4px',
							opacity: 0.7,
							transition: 'opacity 0.2s',
						}}
						onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
						onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
						title='Remove'
					>
						<FaTimes size={14} />
					</button>
				)}
				{showConfirm && (
					<div style={{ display: 'flex', gap: '4px' }}>
						<button
							onClick={handleConfirm}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '4px',
								color: 'green',
								transition: 'opacity 0.2s',
							}}
							title='Confirm remove'
						>
							<FaCheck size={14} />
						</button>
						<button
							onClick={handleCancel}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '4px',
								color: 'red',
								transition: 'opacity 0.2s',
							}}
							title='Cancel'
						>
							<FaBan size={14} />
						</button>
					</div>
				)}
			</div>
			<Bar />
			<div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
		</div>
	);
};
