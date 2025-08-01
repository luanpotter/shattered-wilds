const LabeledInput = ({
	label,
	tooltip,
	value,
	onChange,
	disabled = false,
	onClick,
	onKeyDown,
	tabIndex,
	role,
}: {
	label: string;
	tooltip?: string | undefined;
	value: string;
	disabled?: boolean;
	onChange?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
	onKeyDown?: ((e: React.KeyboardEvent<HTMLInputElement>) => void) | undefined;
	tabIndex?: number | undefined;
	role?: string | undefined;
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
					onKeyDown={onKeyDown}
					tabIndex={tabIndex}
					role={role}
				/>
			</label>
		</div>
	);
};

export default LabeledInput;
