import { Bonus, Distance, Value } from '@shattered-wilds/d12';
import React from 'react';

import { RichText } from '../shared/RichText';

export const Dash = () => {
	return (
		<div style={{ flex: 1, display: 'flex', justifyContent: 'stretch', alignItems: 'center' }}>
			<hr
				style={{
					borderTop: '1px dotted black',
					flex: 1,
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

export const ValueBox = ({ value }: { value: Value | string }) => {
	if (value instanceof Bonus) {
		return <Box type='bonus'>{value.description}</Box>;
	}
	if (value instanceof Distance) {
		return <Box type='distance'>{value.description}</Box>;
	}
	return <Box type='other'>{`${value}`}</Box>;
};

export const Box: React.FC<{ type: 'bonus' | 'distance' | 'other'; children: React.ReactNode }> = ({
	type,
	children,
}) => {
	const backgroundColor = type === 'bonus' ? '#ffb300' : type === 'distance' ? '#21d241ff' : '#cccccc';
	return (
		<div
			style={{
				border: '1px dotted black',
				fontSize: type === 'distance' ? '0.8rem' : '1rem',
				width: type === 'distance' ? '64px' : '32px',
				height: '32px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'black',
			}}
		>
			<span style={{ backgroundColor }}>{children}</span>
		</div>
	);
};

export const InfoBox: React.FC<{
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({ children, style }) => {
	return (
		<div
			style={{
				border: '1px dotted black',
				fontSize: '0.75rem',
				height: '24px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'black',
				padding: '0 4px',
				...style,
			}}
		>
			{children}
		</div>
	);
};

export const PartialComponent = ({ label, value }: { label: string; value: Value | string }) => (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
		<ValueBox value={value} />
		<span style={{ fontSize: '0.6em' }}>{label}</span>
	</div>
);

export const PrintRichText = ({ children, style }: { children: string; style?: React.CSSProperties }) => {
	return (
		<div className='rich-text' style={{ textAlign: 'justify', fontSize: '0.75em', ...style }}>
			<RichText>{children}</RichText>
		</div>
	);
};

export const Blocks = ({ children }: { children: React.ReactNode }) => {
	return (
		<div
			className='print-container'
			style={{
				background: 'white',
				padding: '1rem',
				width: '210mm',
				margin: '0 auto',
				marginBottom: '1em',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.25em',
				color: 'black',
				height: '100%',
			}}
		>
			{children}
		</div>
	);
};
