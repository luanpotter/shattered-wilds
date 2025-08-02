import { Check, CheckMode, CheckNature, Resource } from '@shattered-wilds/commons';
import React, { useState, useEffect } from 'react';
import { FaDice, FaFistRaised, FaUserShield } from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, Shield, DefenseType } from '../types';
import { findNextWindowPosition } from '../utils';

import { Button } from './shared/Button';

interface AttackActionModalProps {
	attackerId: string;
	defenderId: string;
	attackIndex: number;
	onClose: () => void;
}

interface RollResult {
	total: number;
	shifts: number;
	success?: boolean;
}

export const AttackActionModal: React.FC<AttackActionModalProps> = ({
	attackerId,
	defenderId,
	attackIndex,
	onClose,
}) => {
	const characters = useStore(state => state.characters);
	const addWindow = useStore(state => state.addWindow);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const attacker = characters.find(c => c.id === attackerId);
	const defender = characters.find(c => c.id === defenderId);

	const [defenseResult, setDefenseResult] = useState<RollResult | null>(null);
	const [attackResult, setAttackResult] = useState<RollResult | null>(null);
	const [usedDodge, setUsedDodge] = useState(false);
	const [usedShieldBlock, setUsedShieldBlock] = useState(false);

	// Auto-calculate values for automatic mode characters
	const getAutomaticResult = (modifier: number): RollResult => {
		const total = 13.5 + modifier;
		return {
			total,
			shifts: 0, // Base automatic roll has no crit shifts
			success: true,
		};
	};

	// Automatically set results for automatic mode characters on mount
	useEffect(() => {
		if (attacker && defender) {
			const attackerSheet = CharacterSheet.from(attacker.props);
			const defenderSheet = CharacterSheet.from(defender.props);
			const attack = attackerSheet.getBasicAttacks()[attackIndex];
			const defense = defenderSheet.getBasicDefense(DefenseType.BasicBody);

			if (attack && defender.automaticMode) {
				const autoResult = getAutomaticResult(defense.value);
				setDefenseResult(autoResult);
			}
			if (attack && attacker.automaticMode) {
				const autoResult = getAutomaticResult(attack.check.modifierValue);
				setAttackResult(autoResult);
			}
		}
	}, [attacker, defender, attackIndex]);

	if (!attacker || !defender) {
		return <div>Error: Characters not found</div>;
	}

	const attackerSheet = CharacterSheet.from(attacker.props);
	const defenderSheet = CharacterSheet.from(defender.props);
	const attack = attackerSheet.getBasicAttacks()[attackIndex];

	const basicDefense = defenderSheet.getBasicDefense(DefenseType.BasicBody);
	const dodgeDefense = defenderSheet.getBasicDefense(DefenseType.Dodge);
	const shieldDefense = defenderSheet.getBasicDefense(DefenseType.ShieldBlock);

	// Check if defender has a shield and calculate shield block value
	const hasShield = defenderSheet.equipment.items.some(item => item instanceof Shield);

	if (!attack) {
		return <div>Error: Attack not found</div>;
	}

	const handleDefenseRoll = () => {
		if (defender.automaticMode && !defenseResult) {
			// Use automatic value for defense (initial)
			const autoResult = getAutomaticResult(basicDefense.value);
			setDefenseResult(autoResult);
			setUsedDodge(false);
		} else {
			// Open dice roll modal for manual rolling (override)
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll Defense - ${defender.props.name}`,
				type: 'dice-roll',
				position: findNextWindowPosition(useStore.getState().windows),
				check: new Check({
					mode: CheckMode.Contested,
					nature: CheckNature.Resisted,
					statModifier: basicDefense,
				}),
				characterId: defender.id,
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setDefenseResult(result);
					setUsedDodge(false);
					setUsedShieldBlock(false);
				},
			});
		}
	};

	const handleDodgeRoll = () => {
		// Open dice roll modal for dodge (always manual, even for automatic mode)
		addWindow({
			id: window.crypto.randomUUID(),
			title: `Roll Dodge - ${defender.props.name}`,
			type: 'dice-roll',
			position: findNextWindowPosition(useStore.getState().windows),
			check: new Check({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statModifier: dodgeDefense,
			}),
			characterId: defender.id,
			onDiceRollComplete: (result: { total: number; shifts: number }) => {
				setDefenseResult(result);
				setUsedDodge(true);
				setUsedShieldBlock(false);
			},
		});
	};

	const handleShieldBlockRoll = () => {
		// Open dice roll modal for shield block (always manual, even for automatic mode)
		addWindow({
			id: window.crypto.randomUUID(),
			title: `Roll Shield Block - ${defender.props.name}`,
			type: 'dice-roll',
			position: findNextWindowPosition(useStore.getState().windows),
			check: new Check({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statModifier: shieldDefense,
			}),
			characterId: defender.id,
			onDiceRollComplete: (result: { total: number; shifts: number }) => {
				setDefenseResult(result);
				setUsedShieldBlock(true);
				setUsedDodge(false);
			},
		});
	};

	const handleAttackRoll = () => {
		if (attacker.automaticMode && !attackResult) {
			// Use automatic value for attack (initial)
			const autoResult = getAutomaticResult(attack.check.modifierValue);
			setAttackResult(autoResult);
		} else {
			// Open dice roll modal for manual rolling (override)
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll Attack - ${attacker.props.name}`,
				type: 'dice-roll',
				position: findNextWindowPosition(useStore.getState().windows),
				check: new Check({
					mode: CheckMode.Contested,
					nature: CheckNature.Active,
					statModifier: attack.check.statModifier,
				}),
				characterId: attacker.id,
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setAttackResult(result);
				},
			});
		}
	};

	const calculateShifts = (excess: number): number => {
		if (excess < 6) return 0;

		let shifts = 0;
		let threshold = 6;
		let gap = 6;

		while (excess >= threshold) {
			shifts++;
			threshold += gap;
			gap += 6;
		}

		return shifts;
	};

	const calculateOutcome = () => {
		if (!defenseResult || !attackResult) return null;

		const hit =
			attackResult.total > defenseResult.total ||
			(attackResult.total === defenseResult.total && attackResult.shifts > 0);

		// Calculate shifts based on how much attack exceeded defense
		const excess = hit ? attackResult.total - defenseResult.total : 0;
		const shifts = hit ? calculateShifts(excess) : 0;
		const damage = hit ? 1 + shifts : 0;

		return { hit, damage, shifts };
	};

	const handleExecute = () => {
		const outcome = calculateOutcome();
		if (!outcome) return;

		if (outcome.hit && outcome.damage > 0) {
			const { current } = defenderSheet.getResource(Resource.VitalityPoint);
			const newVitality = Math.max(0, current - outcome.damage);

			updateCharacterProp(defender, Resource.VitalityPoint, newVitality.toString());
		}

		onClose();
	};

	const outcome = calculateOutcome();

	const modalStyle: React.CSSProperties = {
		padding: '20px',
		maxWidth: '90vw',
		backgroundColor: 'var(--background)',
		border: '1px solid var(--text)',
		borderRadius: '8px',
		boxSizing: 'border-box',
	};

	const halfStyle: React.CSSProperties = {
		flex: 1,
		padding: '16px',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		margin: '8px',
	};

	const defenseButtonText =
		defender.automaticMode && defenseResult && !usedDodge && !usedShieldBlock
			? 'Override Defense'
			: defender.automaticMode
				? 'Use Auto Defense'
				: 'Roll Defense';

	const attackButtonText = `${
		attacker.automaticMode && attackResult
			? 'Override Attack'
			: attacker.automaticMode
				? 'Use Auto Attack'
				: 'Roll Attack'
	} ${defenseResult ? `(DC ${defenseResult.total})` : '(Roll Defense First)'}`;

	return (
		<div style={modalStyle}>
			<h3 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
				<FaFistRaised /> Attack Action
			</h3>

			<div style={{ display: 'flex', gap: '16px' }}>
				{/* Defender Half */}
				<div style={halfStyle}>
					<h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
						<FaUserShield /> Defender: {defender.props.name}
					</h4>

					<p>Basic Defense: {basicDefense.value}</p>
					<p>Dodge Defense: {dodgeDefense.value}</p>
					{hasShield ? <p>Shield Defense: {shieldDefense.value}</p> : ''}

					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<Button icon={FaDice} title={defenseButtonText} onClick={handleDefenseRoll} />
						<Button icon={FaDice} title='Roll Dodge (1 AP)' onClick={handleDodgeRoll} />
						{hasShield && (
							<Button
								icon={FaDice}
								title={`Roll Shield Block (1 AP) +${shieldDefense.value}`}
								onClick={handleShieldBlockRoll}
							/>
						)}
					</div>

					{defenseResult && (
						<div
							style={{
								marginTop: '16px',
								padding: '8px',
								backgroundColor: 'var(--background-alt)',
								borderRadius: '4px',
							}}
						>
							<strong>
								{usedDodge ? 'Dodge' : usedShieldBlock ? 'Shield Block' : 'Defense'} Result:{' '}
								{defender.automaticMode && !usedDodge && !usedShieldBlock
									? `Auto: ${defenseResult.total}`
									: defenseResult.total}
							</strong>
							{defenseResult.shifts > 0 && <div>Shifts: {defenseResult.shifts}</div>}
							{usedDodge && <div style={{ fontSize: '0.8em', opacity: 0.8 }}>Used Dodge reaction</div>}
							{usedShieldBlock && <div style={{ fontSize: '0.8em', opacity: 0.8 }}>Used Shield Block reaction</div>}
						</div>
					)}
				</div>

				{/* Attacker Half */}
				<div style={halfStyle}>
					<h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
						<FaFistRaised /> Attacker: {attacker.props.name}
					</h4>

					<p>Attack: {attack.name}</p>
					<p>Modifier: {attack.check.modifierValue}</p>

					<Button icon={FaDice} title={attackButtonText} onClick={handleAttackRoll} disabled={!defenseResult} />

					{attackResult && (
						<div
							style={{
								marginTop: '16px',
								padding: '8px',
								backgroundColor: 'var(--background-alt)',
								borderRadius: '4px',
							}}
						>
							<strong>
								Attack Result: {attacker.automaticMode ? `Auto: ${attackResult.total}` : attackResult.total}
							</strong>
							{attackResult.shifts > 0 && <div>Shifts: {attackResult.shifts}</div>}
						</div>
					)}
				</div>
			</div>

			{/* Outcome Display */}
			{outcome && (
				<div
					style={{
						marginTop: '20px',
						padding: '16px',
						backgroundColor: outcome.hit ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
						border: `1px solid ${outcome.hit ? 'green' : 'red'}`,
						borderRadius: '4px',
						textAlign: 'center',
					}}
				>
					<h4 style={{ margin: '0 0 8px 0' }}>{outcome.hit ? '🎯 HIT!' : '🛡️ MISS!'}</h4>
					{outcome.hit && (
						<p style={{ margin: '0' }}>
							Damage: {outcome.damage} VP (1 base + {outcome.shifts} shifts)
						</p>
					)}
				</div>
			)}

			{/* Action Buttons */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
				{outcome && <Button onClick={handleExecute} title='Execute' />}
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
