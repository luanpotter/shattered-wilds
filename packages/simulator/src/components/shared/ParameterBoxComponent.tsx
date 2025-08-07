import React from 'react';

export const ParameterBoxComponent: React.FC<{
	title: string;
	tooltip: string;
	children: React.ReactNode;
	onClick?: () => void;
}> = ({ title, tooltip, children, onClick }) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '8px',
				border: '1px solid var(--text)',
				borderRadius: '4px',
				backgroundColor: onClick ? 'var(--button-base)' : 'var(--background-alt)',
				width: '100px',
				textAlign: 'center',
				cursor: onClick ? 'pointer' : 'help',
			}}
			title={tooltip}
			onClick={onClick}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					onClick?.();
				}
			}}
		>
			<div style={{ fontSize: '0.8em', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '2px' }}>
				{title}
			</div>
			<div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{children}</div>
		</div>
	);
};
