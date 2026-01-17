import React from 'react';

interface NumberStepperProps {
	label?: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ label, value, onChange, min = -99, max = 99, step = 1 }) => {
	const handleDecrement = () => {
		onChange(Math.max(min, value - step));
	};

	const handleIncrement = () => {
		onChange(Math.min(max, value + step));
	};

	const buttonStyle: React.CSSProperties = {
		width: '20px',
		height: '20px',
		padding: 0,
		border: '1px solid var(--text)',
		backgroundColor: 'var(--background-alt)',
		color: 'var(--text)',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.9em',
		fontWeight: 'bold',
		lineHeight: 1,
	};

	const valueStyle: React.CSSProperties = {
		minWidth: '32px',
		textAlign: 'center',
		fontWeight: 'bold',
		fontSize: '0.9em',
	};

	const formatted = value >= 0 ? `+${value}` : `${value}`;

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
			{label && <span style={{ fontSize: '0.85em', marginRight: '4px' }}>{label}</span>}
			<button type='button' style={buttonStyle} onClick={handleDecrement} disabled={value <= min}>
				−
			</button>
			<span style={valueStyle}>{formatted}</span>
			<button type='button' style={buttonStyle} onClick={handleIncrement} disabled={value >= max}>
				+
			</button>
		</div>
	);
};

export default NumberStepper;
