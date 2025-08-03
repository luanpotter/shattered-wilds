import React from 'react';

import { useStore } from '../store';
import { BasicAttack, CharacterSheet, Point } from '../types';

import { Button } from './shared/Button';
import { FormRow, ReadOnlyInput } from './shared/FormComponents';

interface BasicAttacksModalProps {
	attacks: BasicAttack[];
	characterSheet?: CharacterSheet;
	onClose: () => void;
}

export const BasicAttacksModal: React.FC<BasicAttacksModalProps> = ({ attacks, characterSheet, onClose }) => {
	const editMode = useStore(state => state.editMode);
	const addWindow = useStore(state => state.addWindow);
	const characters = useStore(state => state.characters);

	const handleAttackClick = (attack: BasicAttack, position?: Point) => {
		if (!editMode && characterSheet) {
			// Find the character that owns this character sheet
			const character = characters.find(c => {
				const sheet = CharacterSheet.from(c.props);
				return sheet.name === characterSheet.name;
			});

			if (character) {
				// In play mode, open dice roll modal for this specific attack
				addWindow({
					id: window.crypto.randomUUID(),
					title: `Roll ${attack.name} Attack`,
					type: 'dice-roll',
					position: position ?? { x: 0, y: 0 },
					check: attack.check,
					characterId: character.id,
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
									onClick={e => handleAttackClick(attack, { x: e.clientX, y: e.clientY })}
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
