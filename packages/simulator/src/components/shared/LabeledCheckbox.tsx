import React from 'react';

interface Props {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}

export const LabeledCheckbox: React.FC<Props> = ({ label, checked, disabled = false, onChange }) => {
	const labelStyle: React.CSSProperties = {
		whiteSpace: 'nowrap',
		flexShrink: 0,
		paddingRight: '4px',
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		marginLeft: '8px',
		opacity: disabled ? 0.6 : 1,
		cursor: disabled ? 'not-allowed' : 'pointer',
	};
	return (
		<label style={labelStyle}>
			<input
				type='checkbox'
				checked={checked}
				disabled={disabled}
				onChange={e => onChange(e.target.checked)}
				style={{ margin: 0 }}
			/>
			{label}
		</label>
	);
};
