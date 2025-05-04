import React from 'react';

import { BasicAttacks } from '../types';

import { FormRow, ReadOnlyInput } from './shared/FormComponents';

interface BasicAttacksModalProps {
	attacks: BasicAttacks;
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
				<FormRow label='Light Melee' id='light-melee'>
					<ReadOnlyInput
						id='light-melee'
						value={
							attacks.lightMelee.value > 0
								? `+${attacks.lightMelee.value}`
								: attacks.lightMelee.value
						}
						tooltip={attacks.lightMelee.description}
					/>
				</FormRow>

				<FormRow label='Heavy Melee' id='heavy-melee'>
					<ReadOnlyInput
						id='heavy-melee'
						value={
							attacks.heavyMelee.value > 0
								? `+${attacks.heavyMelee.value}`
								: attacks.heavyMelee.value
						}
						tooltip={attacks.heavyMelee.description}
					/>
				</FormRow>

				<FormRow label='Ranged' id='ranged'>
					<ReadOnlyInput
						id='ranged'
						value={attacks.ranged.value > 0 ? `+${attacks.ranged.value}` : attacks.ranged.value}
						tooltip={attacks.ranged.description}
					/>
				</FormRow>

				<FormRow label='Thrown' id='thrown'>
					<ReadOnlyInput
						id='thrown'
						value={attacks.thrown.value > 0 ? `+${attacks.thrown.value}` : attacks.thrown.value}
						tooltip={attacks.thrown.description}
					/>
				</FormRow>
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
