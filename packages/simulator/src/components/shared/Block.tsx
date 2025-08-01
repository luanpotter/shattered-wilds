const Block = ({ children }: { children: React.ReactNode }) => {
	return (
		<div
			style={{
				marginBottom: '12px',
				padding: '8px',
				backgroundColor: 'var(--background-alt)',
				borderRadius: '4px',
			}}
		>
			{children}
		</div>
	);
};

export default Block;
