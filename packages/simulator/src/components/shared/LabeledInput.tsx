const LabeledInput = ({
	label,
	tooltip,
	value,
	onChange,
	disabled = false,
	onClick,
}: {
	label: string;
	tooltip?: string | undefined;
	value: string;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
}) => {
	return (
		<div title={tooltip}>
			<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
				{label}
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
			</label>
		</div>
	);
};

export default LabeledInput;
