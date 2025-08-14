import React, { useEffect, useState } from 'react';

interface LabeledTextAreaProps {
	label?: string | undefined;
	tooltip?: string | undefined;
	value: string;
	rows?: number;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onBlur?: ((value: string) => void) | undefined;
}

const LabeledTextArea: React.FC<LabeledTextAreaProps> = ({
	label,
	tooltip,
	value,
	rows = 2,
	disabled = false,
	onChange,
	onBlur,
}) => {
	// Match LabeledInput behavior: local state when only onBlur is provided
	const useLocalState = Boolean(onBlur && !onChange);
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		if (useLocalState) {
			setLocalValue(value);
		}
	}, [value, useLocalState]);

	const displayValue = useLocalState ? localValue : value;
	const handleChange = useLocalState ? setLocalValue : onChange;
	const handleBlur = useLocalState
		? () => onBlur?.(localValue)
		: (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e.target.value);

	const normalLabelStyle: React.CSSProperties = {
		display: 'block',
		marginBottom: '0.5rem',
		fontWeight: 'bold',
	};

	const textAreaStyle: React.CSSProperties = {
		width: '100%',
		background: 'var(--background-alt)',
		color: 'var(--text)',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		padding: '8px',
		boxSizing: 'border-box',
		resize: 'vertical',
	};

	const textarea = (
		<textarea
			rows={rows}
			disabled={disabled}
			value={displayValue}
			onChange={e => handleChange?.(e.target.value)}
			onBlur={handleBlur}
			style={textAreaStyle}
		/>
	);

	if (!label) {
		return textarea;
	}

	return (
		<div title={tooltip ?? label} style={{ flex: 1 }}>
			<label style={normalLabelStyle}>
				{label}
				{textarea}
			</label>
		</div>
	);
};

export default LabeledTextArea;
