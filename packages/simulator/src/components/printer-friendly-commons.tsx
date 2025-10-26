import React from 'react';

export const Dash = () => {
	return (
		<div style={{ flex: 1 }}>
			<hr
				style={{
					borderTop: '1px dotted black',
					borderBottom: 'none',
					borderLeft: 'none',
					borderRight: 'none',
					marginLeft: '4px',
				}}
			/>
		</div>
	);
};

export const Bold = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
	<strong style={{ color: 'black', ...style }}>{children}</strong>
);

export const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div
			style={{
				border: '1px dotted black',
				width: '32px',
				height: '32px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<span>{children}</span>
		</div>
	);
};
