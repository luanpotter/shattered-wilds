import React, { useState, useEffect } from 'react';

interface LabeledInputProps {
	variant?: 'normal' | 'inline';
	label?: string | undefined;
	tooltip?: string | undefined;
	value: string;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onBlur?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
	buttons?: React.ReactNode;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
	variant = 'normal',
	label,
	tooltip,
	value,
	disabled = false,
	onChange,
	onBlur,
	onClick,
	buttons,
}) => {
	const useLocalState = Boolean(onBlur && !onChange);
	const [localValue, setLocalValue] = useState(value);

	// Sync local value when prop changes (e.g., switching characters)
	useEffect(() => {
		if (useLocalState) {
			setLocalValue(value);
		}
	}, [value, useLocalState]);

	const displayValue = useLocalState ? localValue : value;
	const handleChange = useLocalState ? setLocalValue : onChange;
	const handleBlur = useLocalState
		? () => onBlur?.(localValue)
		: (e: React.FocusEvent<HTMLInputElement>) => onBlur?.(e.target.value);
	const inlineLabelStyle: React.CSSProperties = {
		display: 'flex',
		fontSize: '0.9em',
		whiteSpace: 'nowrap',
		flexShrink: 0,
		paddingRight: '4px',
		alignItems: 'center',
		gap: '4px',
	};
	const normalLabelStyle: React.CSSProperties = {
		display: 'block',
		marginBottom: '0.5rem',
		fontWeight: 'bold',
	};
	const baseStyle: React.CSSProperties = {
		cursor: onClick ? 'pointer' : tooltip ? 'help' : 'default',
		backgroundColor: 'var(--background-alt)',
		width: '100%',
	};
	const normalStyle: React.CSSProperties = {
		...baseStyle,
		padding: '0.5rem',
	};
	const inlineStyle: React.CSSProperties = {
		...baseStyle,
		fontSize: '0.9em',
		padding: '2px 4px',
		margin: 0,
		height: '24px',
		display: 'flex',
		alignItems: 'center',
	};
	const normalWrapperStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
	const inlineInnerWrapperStyle: React.CSSProperties = { flex: 1, ...normalWrapperStyle };
	const clickHandlers = onClick
		? {
				onClick,
				onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onClick();
					}
				},
			}
		: {};
	const input = (
		<div style={variant === 'inline' ? inlineInnerWrapperStyle : normalWrapperStyle} {...clickHandlers}>
			<input
				disabled={disabled && !onClick}
				readOnly={disabled}
				type='text'
				value={displayValue}
				onChange={e => handleChange?.(e.target.value)}
				onBlur={handleBlur}
				style={variant === 'inline' ? inlineStyle : normalStyle}
			/>
			{buttons}
		</div>
	);
	if (!label) {
		return input;
	}

	return (
		<div title={tooltip ?? label} style={{ flex: 1 }}>
			<label style={variant === 'inline' ? inlineLabelStyle : normalLabelStyle}>
				{label}
				{input}
			</label>
		</div>
	);
};

export default LabeledInput;
