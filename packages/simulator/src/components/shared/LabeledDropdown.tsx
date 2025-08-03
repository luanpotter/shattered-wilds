const LabeledDropdown = <T,>({
	label,
	tooltip,
	value,
	options,
	describe,
	disabled = false,
	onChange,
}: {
	label: string;
	tooltip?: string;
	value: T | null;
	options: T[];
	describe: (option: T) => string;
	disabled?: boolean;
	onChange: (value: T) => void;
}) => {
	const findItem = (value: string): T | undefined => options.find(option => describe(option) === value);

	return (
		<div title={tooltip ?? label}>
			<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
				{label}
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
					}}
					onChange={e => {
						const value = e.target.value;
						const item = findItem(value);
						if (item) {
							onChange(item);
						}
					}}
				>
					{options.map(option => {
						const key = describe(option);
						return (
							<option key={key} value={key}>
								{key}
							</option>
						);
					})}
				</select>
			</label>
		</div>
	);
};

export default LabeledDropdown;
