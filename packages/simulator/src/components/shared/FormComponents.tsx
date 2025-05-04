import React from 'react';

import { formRowStyle, labelStyle, inputStyle } from './styles';

interface FormRowProps {
	label: string;
	id: string;
	children: React.ReactNode;
}

export const FormRow: React.FC<FormRowProps> = ({ label, id, children }) => {
	return (
		<div style={formRowStyle}>
			<label htmlFor={id} style={labelStyle}>
				{label}:
			</label>
			{children}
		</div>
	);
};

interface ReadOnlyInputProps {
	id: string;
	value: string | number;
	tooltip?: string;
	style?: React.CSSProperties;
}

export const ReadOnlyInput: React.FC<ReadOnlyInputProps> = ({ id, value, tooltip, style }) => {
	return (
		<div
			id={id}
			title={tooltip}
			style={{
				...inputStyle,
				display: 'flex',
				alignItems: 'center',
				backgroundColor: 'var(--background)',
				cursor: tooltip ? 'help' : 'default',
				border: '1px solid var(--border)',
				borderRadius: '4px',
				...style,
			}}
		>
			{value}
		</div>
	);
};
