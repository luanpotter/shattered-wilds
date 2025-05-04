import React from 'react';

interface WindowProps {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	style?: React.CSSProperties;
}

export const Window: React.FC<WindowProps> = ({ title, onClose, children, style }) => {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	return (
		<div
			role='presentation'
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 1000,
				...style,
			}}
			onClick={onClose}
		>
			<button
				type='button'
				aria-labelledby='window-title'
				style={{
					backgroundColor: 'var(--background)',
					borderRadius: '8px',
					boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
					minWidth: '300px',
					maxWidth: '500px',
					display: 'flex',
					flexDirection: 'column',
					border: 'none',
					padding: 0,
					cursor: 'default',
				}}
				onClick={e => e.stopPropagation()}
				onKeyDown={handleKeyDown}
			>
				{/* Title Bar */}
				<header
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '8px 12px',
						backgroundColor: 'var(--background-alt)',
						borderTopLeftRadius: '8px',
						borderTopRightRadius: '8px',
						borderBottom: '1px solid var(--border)',
						cursor: 'move',
					}}
				>
					<h2 id='window-title' style={{ margin: 0, fontSize: '1.2em' }}>
						{title}
					</h2>
					<button
						type='button'
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							color: 'var(--text)',
							cursor: 'pointer',
							padding: '4px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
						aria-label='Close'
					>
						×
					</button>
				</header>

				{/* Content */}
				<div style={{ flex: 1 }}>{children}</div>
			</button>
		</div>
	);
};
