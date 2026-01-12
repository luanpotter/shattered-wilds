import { Action, CharacterSheet, Check, CheckMode, CheckNature, Resource, Trait } from '@shattered-wilds/d12';
import React, { useEffect, useState } from 'react';
import { FaDice, FaFistRaised, FaUserShield } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { getBasicAttacksFor, getBasicDefensesForRealm } from '../../types/grid-actions';
import { AttackActionInitialConfig } from '../../types/ui';
import { Button } from '../shared/Button';

interface AttackActionModalProps {
	attackerId: string;
	defenderId: string;
	initialConfig: AttackActionInitialConfig;
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
	initialConfig,
	onClose,
}) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const { openDiceRollModal } = useModals();

	const attacker = characters.find(c => c.id === attackerId);
	const defender = characters.find(c => c.id === defenderId);

	const [defenseResult, setDefenseResult] = useState<RollResult | null>(null);
	const [attackResult, setAttackResult] = useState<RollResult | null>(null);
	const [usedDodge, setUsedDodge] = useState(false);
	const [usedShieldBlock, setUsedShieldBlock] = useState(false);

	// Auto-calculate values for automatic mode characters
	const getAutomaticResult = (check: Check): RollResult => {
		const totalModifier = check.modifierValue.value;

		// TODO: use centralized dice rolling
		const total = 13.5 + totalModifier;
		return {
			total,
			shifts: 0, // Base automatic roll has no crit shifts
			success: true,
		};
	};

	const { attackAction, weaponModeIndex } = initialConfig;

	// Automatically set results for automatic mode characters on mount
	useEffect(() => {
		if (attacker && defender) {
			const attackerSheet = CharacterSheet.from(attacker.props);
			const defenderSheet = CharacterSheet.from(defender.props);
			const attack = getBasicAttacksFor(attackerSheet)[weaponModeIndex];
			const defense = getBasicDefensesForRealm(defenderSheet, Trait.BodyDefense).find(
				defense => defense.action === Action.BasicDefense,
			)!;

			if (attack && defender.automaticMode) {
				const autoResult = getAutomaticResult(defense.check);
				setDefenseResult(autoResult);
			}
			if (attack && attacker.automaticMode) {
				const autoResult = getAutomaticResult(attack.check);
				setAttackResult(autoResult);
			}
		}
	}, [attacker, defender, weaponModeIndex]);

	if (!attacker || !defender) {
		return <div>Error: Characters not found</div>;
	}

	const attackerSheet = CharacterSheet.from(attacker.props);
	const defenderSheet = CharacterSheet.from(defender.props);
	const attack = getBasicAttacksFor(attackerSheet)[weaponModeIndex];

	const defenses = getBasicDefensesForRealm(defenderSheet, Trait.BodyDefense);

	if (!attack) {
		return <div>Error: Attack not found</div>;
	}

	const handleDefenseRoll = (action: Action) => {
		const defense = defenses.find(def => def.action === action);
		if (!defense) {
			throw new Error(`Defense action ${action} not found for defender`);
		}
		if (defender.automaticMode && !defenseResult) {
			// Use automatic value for defense (initial)
			const autoResult = getAutomaticResult(defense.check);
			setDefenseResult(autoResult);
			setUsedDodge(false);
		} else {
			// Open dice roll modal for manual rolling (override)
			openDiceRollModal({
				characterId: defender.id,
				check: defense.check,

				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setDefenseResult(result);
					setUsedDodge(false);
					setUsedShieldBlock(false);
				},
			});
		}
	};

	const handleAttackRoll = () => {
		if (attacker.automaticMode && !attackResult) {
			// Use automatic value for attack (initial)
			const autoResult = getAutomaticResult(attack.check);
			setAttackResult(autoResult);
		} else {
			// Open dice roll modal for manual rolling (override)
			openDiceRollModal({
				characterId: attacker.id,
				check: new Check({
					mode: CheckMode.Contested,
					nature: CheckNature.Active,
					descriptor: `Attack - ${attacker.props.name}`,
					statModifier: attack.check.statModifier,
				}),
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setAttackResult(result);
				},
			});
		}
	};

	// TODO: use centralized dice rolling
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
		boxSizing: 'border-box',
	};

	const halfStyle: React.CSSProperties = {
		flex: 1,
		padding: '16px',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		margin: '8px',
	};

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

					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{defenses.map(defense => (
							<Button
								key={defense.action}
								icon={FaDice}
								title={
									defender.automaticMode && defenseResult && !usedDodge && !usedShieldBlock
										? `Override ${defense.name}`
										: defender.automaticMode
											? `Use Auto ${defense.name}`
											: `Roll ${defense.name}`
								}
								onClick={() => handleDefenseRoll(defense.action)}
								disabled={
									(defense.action === Action.Dodge && usedDodge) ||
									(defense.action === Action.ShieldBlock && usedShieldBlock) ||
									(attackResult !== null && defense.action !== Action.BasicDefense)
								}
							/>
						))}
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

					<p>Action: {attackAction} (WIP)</p>
					<p>Attack: {attack.name}</p>
					<p>Modifier: {attack.check.modifierValue.description}</p>

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
