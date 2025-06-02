import React, { useState } from 'react';
import { FaDice, FaFistRaised, FaUserShield } from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet } from '../types';
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

	if (!attacker || !defender) {
		return <div>Error: Characters not found</div>;
	}

	const attackerSheet = CharacterSheet.from(attacker.props);
	const defenderSheet = CharacterSheet.from(defender.props);
	const attack = attackerSheet.getBasicAttacks()[attackIndex];
	const defense = defenderSheet.getBasicDefense();

	if (!attack) {
		return <div>Error: Attack not found</div>;
	}

	const handleDefenseRoll = () => {
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
			},
		});
	};

	const handleAttackRoll = () => {
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
	};

	const calculateOutcome = () => {
		if (!defenseResult || !attackResult) return null;

		const hit =
			attackResult.total > defenseResult.total ||
			(attackResult.total === defenseResult.total && attackResult.shifts > 0);

		const damage = hit ? 1 + attackResult.shifts : 0;

		return { hit, damage };
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
		width: '900px',
		maxWidth: '95vw',
		backgroundColor: 'var(--background)',
		border: '1px solid var(--text)',
		borderRadius: '8px',
		boxSizing: 'border-box',
		maxHeight: '80vh',
		overflowY: 'auto',
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

					<button style={buttonStyle} onClick={handleDefenseRoll}>
						<FaDice /> Roll Defense
					</button>

					{defenseResult && (
						<div
							style={{
								marginTop: '16px',
								padding: '8px',
								backgroundColor: 'var(--background-alt)',
								borderRadius: '4px',
							}}
						>
							<strong>Defense Result: {defenseResult.total}</strong>
							{defenseResult.shifts > 0 && <div>Shifts: {defenseResult.shifts}</div>}
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
						<FaDice /> Roll Attack{' '}
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
							<strong>Attack Result: {attackResult.total}</strong>
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
							Damage: {outcome.damage} VP (1 base + {attackResult!.shifts} shifts)
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
