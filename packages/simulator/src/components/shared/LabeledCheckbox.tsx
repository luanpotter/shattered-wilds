import React from 'react';

export const LabeledCheckbox: React.FC<{
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
	const labelStyle: React.CSSProperties = {
		whiteSpace: 'nowrap',
		flexShrink: 0,
		paddingRight: '4px',
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		marginLeft: '8px',
	};
	return (
		<label style={labelStyle}>
			<input type='checkbox' checked={checked} onChange={e => onChange(e.target.checked)} style={{ margin: 0 }} />
			{label}
		</label>
	);
};
