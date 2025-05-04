import React, { useState } from 'react';

interface DiceRollModalProps {
	modifier: number;
	onClose: () => void;
	attributeName: string;
}

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
	modifier,
	onClose,
	attributeName,
}) => {
	const [circumstantialModifier, setCircumstantialModifier] = useState(0);

	const handleCopyToVTT = () => {
		const circumstantialPart = circumstantialModifier !== 0 ? ` + ${circumstantialModifier}` : '';
		void window.navigator.clipboard
			.writeText(`/r d12 + ${modifier}${circumstantialPart}`)
			.catch(() => {
				// Ignore clipboard errors
			});
	};

	const handleRollDice = () => {
		window.alert('Work in Progress: Dice rolling coming soon!');
		onClose();
	};

	return (
		<div style={{ padding: '16px' }}>
			<h3 style={{ margin: '0 0 16px 0' }}>Roll {attributeName} Check</h3>

			<div style={{ marginBottom: '16px' }}>
				<div style={{ marginBottom: '8px' }}>
					<span>Base Modifier: {modifier >= 0 ? `+${modifier}` : modifier}</span>
				</div>

				{circumstantialModifier !== 0 && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<label htmlFor='circumstantial'>Circumstantial Modifier:</label>
						<input
							id='circumstantial'
							type='number'
							value={circumstantialModifier}
							onChange={e => setCircumstantialModifier(parseInt(e.target.value) || 0)}
							style={{
								width: '60px',
								padding: '4px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'var(--background)',
								color: 'var(--text)',
							}}
						/>
					</div>
				)}
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
				<button
					onClick={handleCopyToVTT}
					style={{
						padding: '8px 16px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						color: 'var(--text)',
						cursor: 'pointer',
					}}
				>
					Copy to VTT
				</button>
				<button
					onClick={handleRollDice}
					style={{
						padding: '8px 16px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						color: 'var(--text)',
						cursor: 'pointer',
					}}
				>
					Roll Dice
				</button>
			</div>
		</div>
	);
};
