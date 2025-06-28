import React, { useState, useEffect } from 'react';
import { FaDice, FaFistRaised, FaUserShield } from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, AttributeType } from '../types';
import { findNextWindowPosition } from '../utils';

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
			const defense = defenderSheet.getBasicDefense();

			if (attack && defender.automaticMode) {
				const autoResult = getAutomaticResult(defense.value);
				setDefenseResult(autoResult);
			}
			if (attack && attacker.automaticMode) {
				const autoResult = getAutomaticResult(attack.check.modifier);
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
	const defense = defenderSheet.getBasicDefense();

	// Calculate dodge value (Evasiveness + 3)
	const evasivenessValue = defenderSheet.getAttributeTree().valueOf(AttributeType.Evasiveness);
	const dodgeValue = evasivenessValue + 3;

	if (!attack) {
		return <div>Error: Attack not found</div>;
	}

	const handleDefenseRoll = () => {
		if (defender.automaticMode && !defenseResult) {
			// Use automatic value for defense (initial)
			const autoResult = getAutomaticResult(defense.value);
			setDefenseResult(autoResult);
			setUsedDodge(false);
		} else {
			// Open dice roll modal for manual rolling (override)
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll Defense - ${defender.props.name}`,
				type: 'dice-roll',
				position: findNextWindowPosition(useStore.getState().windows),
				modifier: defense.value,
				attributeName: 'Basic Defense',
				characterSheet: defenderSheet,
				initialRollType: 'Contested (Passive)',
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setDefenseResult(result);
					setUsedDodge(false);
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
			modifier: dodgeValue,
			attributeName: 'Dodge (Evasiveness + 3)',
			characterSheet: defenderSheet,
			initialRollType: 'Contested (Passive)',
			onDiceRollComplete: (result: { total: number; shifts: number }) => {
				setDefenseResult(result);
				setUsedDodge(true);
			},
		});
	};

	const handleAttackRoll = () => {
		if (attacker.automaticMode && !attackResult) {
			// Use automatic value for attack (initial)
			const autoResult = getAutomaticResult(attack.check.modifier);
			setAttackResult(autoResult);
		} else {
			// Open dice roll modal for manual rolling (override)
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll Attack - ${attacker.props.name}`,
				type: 'dice-roll',
				position: findNextWindowPosition(useStore.getState().windows),
				modifier: attack.check.modifier,
				attributeName: `${attack.name} (${attack.check.attribute.name})`,
				characterSheet: attackerSheet,
				initialRollType: 'Contested (Active)',
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setAttackResult(result);
				},
			});
		}
	};

	const calculateOutcome = () => {
		if (!defenseResult || !attackResult) return null;

		const hit =
			attackResult.total > defenseResult.total ||
			(attackResult.total === defenseResult.total && attackResult.shifts > 0);

		// Calculate shifts based on how much attack exceeded defense
		const shifts = hit ? Math.floor((attackResult.total - defenseResult.total) / 6) : 0;
		const damage = hit ? 1 + shifts : 0;

		return { hit, damage, shifts };
	};

	const handleExecute = () => {
		const outcome = calculateOutcome();
		if (!outcome) return;

		if (outcome.hit && outcome.damage > 0) {
			const currentVitality = parseInt(
				defender.props['currentVitality'] ?? defenderSheet.derivedStats.maxVitality.value.toString()
			);
			const newVitality = Math.max(0, currentVitality - outcome.damage);

			updateCharacterProp(defender, 'currentVitality', newVitality.toString());
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

	const buttonStyle: React.CSSProperties = {
		padding: '8px 16px',
		backgroundColor: 'var(--background-alt)',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		color: 'var(--text)',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		margin: '8px 0',
	};

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

					<p>Defense Value: {defense.value}</p>
					<p>
						Dodge Value: {dodgeValue} (Evasiveness {evasivenessValue} + 3)
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<button style={buttonStyle} onClick={handleDefenseRoll}>
							<FaDice />{' '}
							{defender.automaticMode && defenseResult && !usedDodge
								? 'Override Defense'
								: defender.automaticMode
									? 'Use Auto Defense'
									: 'Roll Defense'}
						</button>

						<button style={buttonStyle} onClick={handleDodgeRoll}>
							<FaDice /> Roll Dodge (1 AP)
						</button>
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
								{usedDodge ? 'Dodge' : 'Defense'} Result:{' '}
								{defender.automaticMode && !usedDodge
									? `Auto: ${defenseResult.total}`
									: defenseResult.total}
							</strong>
							{defenseResult.shifts > 0 && <div>Shifts: {defenseResult.shifts}</div>}
							{usedDodge && (
								<div style={{ fontSize: '0.8em', opacity: 0.8 }}>Used Dodge reaction</div>
							)}
						</div>
					)}
				</div>

				{/* Attacker Half */}
				<div style={halfStyle}>
					<h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
						<FaFistRaised /> Attacker: {attacker.props.name}
					</h4>

					<p>Attack: {attack.name}</p>
					<p>Modifier: {attack.check.modifier}</p>

					<button
						style={{
							...buttonStyle,
							opacity: defenseResult ? 1 : 0.5,
							cursor: defenseResult ? 'pointer' : 'not-allowed',
						}}
						onClick={handleAttackRoll}
						disabled={!defenseResult}
					>
						<FaDice />{' '}
						{attacker.automaticMode && attackResult
							? 'Override Attack'
							: attacker.automaticMode
								? 'Use Auto Attack'
								: 'Roll Attack'}{' '}
						{defenseResult ? `(DC ${defenseResult.total})` : '(Roll Defense First)'}
					</button>

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
								Attack Result:{' '}
								{attacker.automaticMode ? `Auto: ${attackResult.total}` : attackResult.total}
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
				{outcome && (
					<button
						style={{
							...buttonStyle,
							backgroundColor: outcome.hit ? 'green' : 'var(--background-alt)',
							color: outcome.hit ? 'white' : 'var(--text)',
						}}
						onClick={handleExecute}
					>
						Execute
					</button>
				)}
				<button style={buttonStyle} onClick={onClose}>
					Close
				</button>
			</div>
		</div>
	);
};
