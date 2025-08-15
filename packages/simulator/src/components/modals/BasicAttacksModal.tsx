import { CharacterSheet } from '@shattered-wilds/commons';
import React from 'react';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { BasicAttack } from '../../types/grid-actions';
import { Button } from '../shared/Button';
import { FormRow, ReadOnlyInput } from '../shared/FormComponents';

interface BasicAttacksModalProps {
	attacks: BasicAttack[];
	characterSheet?: CharacterSheet;
	onClose: () => void;
}

export const BasicAttacksModal: React.FC<BasicAttacksModalProps> = ({ attacks, characterSheet, onClose }) => {
	const editMode = useStore(state => state.editMode);
	const { openDiceRollModal } = useModals();
	const characters = useStore(state => state.characters);

	const handleAttackClick = (attack: BasicAttack) => {
		if (!editMode && characterSheet) {
			// Find the character that owns this character sheet
			const character = characters.find(c => {
				const sheet = CharacterSheet.from(c.props);
				return sheet.name === characterSheet.name;
			});

			if (character) {
				// In play mode, open dice roll modal for this specific attack
				openDiceRollModal({
					characterId: character.id,
					check: attack.check,
					title: `Roll ${attack.name} Attack`,
				});
			}
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
					const bonus = attack.check.modifierValue.description;
					const name = `${attack.name} ${bonus}`;
					const desc = `${attack.check.statModifier.description} ${bonus} = ${attack.check.modifierValue.description}`;
					const isClickable = !editMode;

					return (
						<div key={name} style={{ position: 'relative' }}>
							<FormRow label={name} id={name.toLowerCase()}>
								<ReadOnlyInput
									id={name}
									value={attack.check.modifierValue.description}
									tooltip={isClickable ? `Click to roll ${attack.name} attack` : desc}
									style={{
										cursor: isClickable ? 'pointer' : 'help',
									}}
								/>
							</FormRow>
							{isClickable && (
								<div
									onClick={() => handleAttackClick(attack)}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleAttackClick(attack);
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
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
