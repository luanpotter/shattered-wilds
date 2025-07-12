const LabeledInput = ({
	id,
	label,
	title,
	value,
	onChange,
	editMode,
	onClick,
	onKeyDown,
	tabIndex,
	role,
}: {
	id: string;
	label: string;
	title?: string | undefined;
	value: string;
	editMode: boolean;
	onChange?: ((value: string) => void) | undefined;
	onClick?: (() => void) | undefined;
	onKeyDown?: ((e: React.KeyboardEvent<HTMLInputElement>) => void) | undefined;
	tabIndex?: number | undefined;
	role?: string | undefined;
}) => {
	return (
		<div title={title}>
			<label htmlFor={id} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
				{label}
			</label>
			<input
				id={id}
				type='text'
				value={value}
				disabled={!editMode}
				style={{
					width: '100%',
					padding: '0.5rem',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					backgroundColor: editMode ? 'var(--background)' : 'var(--background-alt)',
					boxSizing: 'border-box',
				}}
				onChange={e => onChange?.(e.target.value)}
				onClick={onClick}
				onKeyDown={onKeyDown}
				tabIndex={tabIndex}
				role={role}
			/>
		</div>
	);
};

export default LabeledInput;
