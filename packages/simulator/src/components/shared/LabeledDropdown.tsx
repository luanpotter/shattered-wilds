const LabeledDropdown = <T,>({
	variant = 'normal',
	label,
	tooltip,
	value,
	options,
	describe = (option: T) => `${option}`,
	disabled = false,
	placeholder,
	onChange,
}: {
	variant?: 'inline' | 'normal';
	label?: string;
	tooltip?: string;
	value: T | null;
	options: T[];
	describe?: (option: T) => string;
	disabled?: boolean;
	placeholder?: string;
	onChange: (value: T) => void;
}) => {
	const findItem = (value: string): T | undefined => options.find(option => describe(option) === value);

	const inlineLabelStyle: React.CSSProperties = {
		display: 'block',
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

	const select = (
		<select
			value={value ? describe(value) : ''}
			disabled={disabled}
			style={{
				width: '100%',
				padding: '0.5rem',
				border: '1px solid var(--text)',
				borderRadius: '4px',
				backgroundColor: disabled ? 'var(--background)' : 'var(--background-alt)',
				boxSizing: 'border-box',
				color: 'var(--text)',
				fontSize: '0.9em',
				minWidth: '120px',
			}}
			onChange={e => {
				const value = e.target.value;
				if (value === '' && placeholder) {
					// Don't call onChange for placeholder selection
					return;
				}
				const item = findItem(value);
				if (item) {
					onChange(item);
				}
			}}
		>
			{placeholder && (
				<option value='' disabled={value !== null}>
					{placeholder}
				</option>
			)}
			{options.map(option => {
				const key = describe(option);
				return (
					<option key={key} value={key}>
						{key}
					</option>
				);
			})}
		</select>
	);
	if (!label) {
		return select;
	}

	return (
		<div title={tooltip ?? label}>
			<label style={variant === 'inline' ? inlineLabelStyle : normalLabelStyle}>
				{label}
				{select}
			</label>
		</div>
	);
};

export default LabeledDropdown;
