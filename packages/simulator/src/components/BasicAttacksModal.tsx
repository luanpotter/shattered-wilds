import React from 'react';

import { BasicAttack } from '../types';

import { FormRow, ReadOnlyInput } from './shared/FormComponents';

interface BasicAttacksModalProps {
	attacks: BasicAttack[];
	onClose: () => void;
}

export const BasicAttacksModal: React.FC<BasicAttacksModalProps> = ({ attacks, onClose }) => {
	return (
		<div style={{ padding: '10px' }}>
			<h3 style={{ margin: '0 0 15px 0' }}>Basic Attacks</h3>

			<div
				style={{
					marginBottom: '15px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				{attacks.map(attack => {
					const bonus = attack.check.bonus > 0 ? `+${attack.check.bonus}` : attack.check.bonus;
					const name = `${attack.name} ${bonus}`;
					const desc = `${attack.check.attribute.name} ${bonus} = ${attack.check.modifier}`;
					return (
						<FormRow key={name} label={name} id={name.toLowerCase()}>
							<ReadOnlyInput id={name} value={attack.check.modifier} tooltip={desc} />
						</FormRow>
					);
				})}
			</div>

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
				<button
					onClick={onClose}
					style={{
						padding: '6px 12px',
						border: '1px solid var(--text)',
						backgroundColor: 'var(--background-alt)',
						color: 'var(--text)',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Close
				</button>
			</div>
		</div>
	);
};
