import React from 'react';

import { useStore } from '../store';
import { BasicAttack, CharacterSheet } from '../types';

import { FormRow, ReadOnlyInput } from './shared/FormComponents';

interface BasicAttacksModalProps {
	attacks: BasicAttack[];
	characterSheet?: CharacterSheet;
	onClose: () => void;
}

export const BasicAttacksModal: React.FC<BasicAttacksModalProps> = ({
	attacks,
	characterSheet,
	onClose,
}) => {
	const editMode = useStore(state => state.editMode);
	const addWindow = useStore(state => state.addWindow);

	const handleAttackClick = (attack: BasicAttack, e: React.MouseEvent) => {
		if (!editMode && characterSheet) {
			// In play mode, open dice roll modal for this specific attack
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll ${attack.name} Attack`,
				type: 'dice-roll',
				position: { x: e.clientX, y: e.clientY },
				modifier: attack.check.modifier,
				attributeName: `${attack.name} (${attack.check.attribute.name})`,
				characterSheet,
				initialRollType: 'Contested (Active)',
			});
		}
	};

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
					const isClickable = !editMode;

					return (
						<div key={name} style={{ position: 'relative' }}>
							<FormRow label={name} id={name.toLowerCase()}>
								<ReadOnlyInput
									id={name}
									value={attack.check.modifier}
									tooltip={isClickable ? `Click to roll ${attack.name} attack` : desc}
									style={{
										cursor: isClickable ? 'pointer' : 'help',
									}}
								/>
							</FormRow>
							{isClickable && (
								<div
									onClick={e => handleAttackClick(attack, e)}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleAttackClick(attack, e as any);
										}
									}}
									style={{
										position: 'absolute',
										inset: 0,
										cursor: 'pointer',
									}}
									tabIndex={0}
									role='button'
									aria-label={`Roll ${attack.name} attack`}
								/>
							)}
						</div>
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
