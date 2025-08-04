import React from 'react';

interface LabeledInputProps {
	variant?: 'normal' | 'inline';
	label: string;
	tooltip?: string | undefined;
	value: string;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
	variant = 'normal',
	label,
	tooltip,
	value,
	disabled = false,
	onChange,
	onClick,
	prefix,
	suffix,
}) => {
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
	const inlineInnerWrapperStyle: React.CSSProperties = { position: 'relative', flex: 1 };
	const normalWrapperStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
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
	return (
		<div title={tooltip ?? label} style={{ flex: 1 }}>
			<label style={variant === 'inline' ? inlineLabelStyle : normalLabelStyle}>
				{label}
				<div style={variant === 'inline' ? inlineInnerWrapperStyle : normalWrapperStyle} {...clickHandlers}>
					{prefix}
					<input
						disabled={disabled && !onClick}
						readOnly={disabled}
						type='text'
						value={value}
						onChange={e => onChange?.(e.target.value)}
						style={variant === 'inline' ? inlineStyle : normalStyle}
					/>
					{suffix}
				</div>
			</label>
		</div>
	);
};

export default LabeledInput;
