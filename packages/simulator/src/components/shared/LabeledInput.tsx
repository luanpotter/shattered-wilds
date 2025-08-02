const LabeledInput = ({
	label,
	tooltip,
	value,
	disabled = false,
	onChange,
	onClick,
	prefix,
	suffix,
}: {
	label: string;
	tooltip?: string | undefined;
	value: string;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
}) => {
	return (
		<div title={tooltip ?? label}>
			<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
				{label}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					{prefix}
					<input
						type='text'
						value={value}
						disabled={disabled}
						style={{
							width: '100%',
							padding: '0.5rem',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							backgroundColor: disabled ? 'var(--background)' : 'var(--background-alt)',
							boxSizing: 'border-box',
						}}
						onChange={e => onChange?.(e.target.value)}
						onClick={onClick}
						onKeyDown={
							onClick
								? e => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											onClick();
										}
									}
								: undefined
						}
					/>
					{suffix}
				</div>
			</label>
		</div>
	);
};

export default LabeledInput;
