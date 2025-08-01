import { Check, CheckType, CHECK_TYPES } from '@shattered-wilds/commons';
import React from 'react';
import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, StatType } from '../types';

import DropdownSelect from './DropdownSelect';
import { Button } from './shared/Button';

// Define the skills directly from AttributeType
const SKILL_OPTIONS = {
	Muscles: StatType.Muscles.name,
	Stance: StatType.Stance.name,
	Lift: StatType.Lift.name,
	Finesse: StatType.Finesse.name,
	Evasiveness: StatType.Evasiveness.name,
	Agility: StatType.Agility.name,
	Toughness: StatType.Toughness.name,
	Stamina: StatType.Stamina.name,
	Resilience: StatType.Resilience.name,
	IQ: StatType.IQ.name,
	Knowledge: StatType.Knowledge.name,
	Memory: StatType.Memory.name,
	Perception: StatType.Perception.name,
	Awareness: StatType.Awareness.name,
	Intuition: StatType.Intuition.name,
	Speechcraft: StatType.Speechcraft.name,
	Presence: StatType.Presence.name,
	Empathy: StatType.Empathy.name,
	Revelation: StatType.Revelation.name,
	Attunement: StatType.Attunement.name,
	Devotion: StatType.Devotion.name,
	Discipline: StatType.Discipline.name,
	Tenacity: StatType.Tenacity.name,
	Resolve: StatType.Resolve.name,
	Karma: StatType.Karma.name,
	Fortune: StatType.Fortune.name,
	Serendipity: StatType.Serendipity.name,
} as const;

type SkillType = keyof typeof SKILL_OPTIONS;

const getAttributeType = (skill: SkillType): StatType => {
	return StatType[skill];
};

export interface DiceRollModalProps {
	characterId: string;
	check: Check;
	onClose: () => void;
	onDiceRollComplete?: ((result: { total: number; shifts: number }) => void) | undefined;
}

interface RollResults {
	dice: number[];
	extraResult: number | undefined;
	luckResult: number | undefined;
	extraValid: boolean | undefined;
	luckValid: boolean | undefined;
	autoFail: boolean;
	total: number;
	critModifiers: number;
	critShifts: number;
	success: boolean | undefined;
	selectedDice: number[];
}

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

export const DiceRollModal: React.FC<DiceRollModalProps> = ({ characterId, check, onClose, onDiceRollComplete }) => {
	const characters = useStore(state => state.characters);

	// If characterId is provided, reconstruct the character sheet
	const character = characters.find(c => c.id === characterId)!;
	const characterSheet = CharacterSheet.from(character.props);
	const tree = characterSheet.getStatTree();

	const [circumstantialModifier, setCircumstantialModifier] = useState(0);
	const [checkType, setCheckType] = useState<CheckType>(check.type);
	const [dc, setDc] = useState<number | null>(null);
	const [useExtra, setUseExtra] = useState(false);
	const [useLuck, setUseLuck] = useState(false);
	const [extraSkill, setExtraSkill] = useState<SkillType>('Muscles');
	const [rollResults, setRollResults] = useState<RollResults | null>(null);

	const updateResults = (newCheckType?: CheckType, newDc?: number | null) => {
		if (!rollResults) return;

		const currentType = newCheckType ?? checkType;
		const currentDc = newDc ?? dc;

		// Recalculate auto-fail status based on roll type
		const allDice = [
			...rollResults.dice,
			...(rollResults.extraResult && rollResults.extraValid ? [rollResults.extraResult] : []),
			...(rollResults.luckResult && rollResults.luckValid ? [rollResults.luckResult] : []),
		];
		const hasPairOfOnes = allDice.filter(n => n === 1).length >= 2;
		const isContestedActive = currentType === 'Contested-Active';
		const isStatic = currentType === 'Static-Active' || currentType === 'Static-Resisted';
		const autoFail = hasPairOfOnes && isContestedActive;

		let success = false;
		let critShifts = 0;

		if (!autoFail && currentDc !== null) {
			// For Active rolls, ties are losses unless there's a crit modifier
			if (isContestedActive) {
				success = rollResults.total > currentDc || (rollResults.total === currentDc && rollResults.critModifiers > 0);
				if (success) {
					critShifts = calculateShifts(rollResults.total - currentDc);
				}
			} else {
				success = rollResults.total >= currentDc;
				if (success && isStatic) {
					critShifts = calculateShifts(rollResults.total - currentDc);
				}
			}
		}

		setRollResults({
			...rollResults,
			autoFail,
			success,
			critShifts,
		});
	};

	const handleCheckTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newType = e.target.value as CheckType;
		setCheckType(newType);
		updateResults(newType);
	};

	const handleDcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDc = e.target.value ? parseInt(e.target.value) : null;
		setDc(newDc);
		updateResults(undefined, newDc);
	};

	const handleCopyToVTT = () => {
		const extraPart = useExtra ? ' extra' : '';
		const luckPart = useLuck ? ' luck' : '';
		const dcPart = dc !== null ? ` dc ${dc}` : '';
		const modifier = check.modifierValue;
		void window.navigator.clipboard.writeText(`/r d12 + ${modifier}${extraPart}${luckPart}${dcPart}`).catch(() => {
			// Ignore clipboard errors
		});
	};

	const rollD12 = () => {
		return Math.floor(Math.random() * 12) + 1;
	};

	const handleRollDice = () => {
		// Roll base dice
		const dice = [rollD12(), rollD12()];
		let extraResult: number | undefined;
		let luckResult: number | undefined;
		let extraValid: boolean | undefined;
		let luckValid: boolean | undefined;

		// Roll extra die if enabled
		if (useExtra) {
			extraResult = rollD12();
			// Get actual skill value from character sheet
			const extraSkillValue = tree?.valueOf(getAttributeType(extraSkill)) ?? 0;
			extraValid = extraResult <= extraSkillValue;
		}

		// Roll luck die if enabled
		if (useLuck) {
			luckResult = rollD12();
			// Get actual Fortune value from character sheet
			const fortuneValue = tree?.valueOf(StatType.Fortune) ?? 0;
			luckValid = luckResult <= fortuneValue;
		}

		// Check for auto fail (any pair of 1s) - but contested resisted rolls cannot auto fail
		const allDice = [...dice];
		if (extraResult && extraValid) allDice.push(extraResult);
		if (luckResult && luckValid) allDice.push(luckResult);
		const hasPairOfOnes = allDice.filter(n => n === 1).length >= 2;
		const isContestedResisted = checkType === 'Contested-Resisted';
		const autoFail = hasPairOfOnes && !isContestedResisted;

		// Calculate crit modifiers
		let critModifiers = 0;
		if (allDice.includes(12)) critModifiers += 6;
		const pairs = allDice.reduce(
			(acc, n, i, arr) => acc + (arr.indexOf(n) !== i && arr.filter(x => x === n).length >= 2 ? 1 : 0),
			0,
		);
		if (pairs > 0) critModifiers += 6;

		// Pick best two dice (considering crit potential)
		const sorted = [...allDice].sort((a, b) => b - a);
		let selectedDice: number[];

		// If we have a 12, prioritize it for crit
		if (sorted.includes(12)) {
			const twelve = sorted.findIndex(n => n === 12);
			const otherDice = sorted.filter((_, i) => i !== twelve);
			selectedDice = [12, otherDice[0]];
		} else {
			selectedDice = [sorted[0], sorted[1]];
		}

		const baseTotal = selectedDice[0] + selectedDice[1] + check.modifierValue;

		// Calculate final total
		const total = baseTotal + critModifiers;

		let success = false;
		let critShifts = 0;

		const isContestedActive = checkType === 'Contested-Active';
		const isStatic = checkType === 'Static-Active' || checkType === 'Static-Resisted';

		if (!autoFail && dc !== null) {
			// For Active rolls, ties are losses unless there's a crit modifier
			if (isContestedActive) {
				success = total > dc || (total === dc && critModifiers > 0);
				if (success) {
					critShifts = calculateShifts(total - dc);
				}
			} else {
				success = total >= dc;
				if (success && isStatic) {
					critShifts = calculateShifts(total - dc);
				}
			}
		}

		const results: RollResults = {
			dice,
			extraResult,
			luckResult,
			extraValid,
			luckValid,
			autoFail,
			total,
			critModifiers,
			critShifts,
			success,
			selectedDice,
		};

		setRollResults(results);
	};

	const handleDiceClick = (value: number) => {
		if (!rollResults) return;

		const allDice = [
			...rollResults.dice,
			...(rollResults.extraResult && rollResults.extraValid ? [rollResults.extraResult] : []),
			...(rollResults.luckResult && rollResults.luckValid ? [rollResults.luckResult] : []),
		];

		// If the clicked die is already selected, deselect it
		if (rollResults.selectedDice.includes(value)) {
			const newSelected = rollResults.selectedDice.filter(d => d !== value);
			// If we're down to one die, we need to pick another one
			if (newSelected.length === 1) {
				const available = allDice.filter(d => !newSelected.includes(d));
				newSelected.push(available[0]);
			}
			setRollResults({ ...rollResults, selectedDice: newSelected });
			return;
		}

		// If we already have two dice selected, replace the lower one
		if (rollResults.selectedDice.length === 2) {
			const newSelected = [...rollResults.selectedDice];
			const lowerIndex = newSelected[0] < newSelected[1] ? 0 : 1;
			newSelected[lowerIndex] = value;
			setRollResults({ ...rollResults, selectedDice: newSelected });
			return;
		}

		// Otherwise, add the die to selection
		setRollResults({
			...rollResults,
			selectedDice: [...rollResults.selectedDice, value],
		});
	};

	const renderDiceResult = (value: number, isValid?: boolean, isSelected?: boolean) => {
		return (
			<div
				onClick={() => handleDiceClick(value)}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleDiceClick(value);
					}
				}}
				role='button'
				tabIndex={0}
				style={{
					position: 'relative',
					width: '60px',
					height: '60px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: isSelected ? 'var(--success)' : 'var(--background-alt)',
					border: '2px solid var(--text)',
					borderRadius: '8px',
					fontSize: '24px',
					fontWeight: 'bold',
					cursor: 'pointer',
					clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
					WebkitClipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: '-2px',
						border: '2px solid var(--text)',
						borderRadius: '8px',
						clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
						WebkitClipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
						pointerEvents: 'none',
					}}
				/>
				{value}
				{isValid !== undefined && (
					<div
						style={{
							position: 'absolute',
							bottom: '2px',
							right: '2px',
							fontSize: '12px',
						}}
					>
						{isValid ? <FaCheck style={{ color: 'green' }} /> : <FaTimes style={{ color: 'red' }} />}
					</div>
				)}
			</div>
		);
	};

	const handleCloseWithCallback = () => {
		// If we have roll results and a callback, pass the results back
		if (rollResults && onDiceRollComplete) {
			onDiceRollComplete({
				total: rollResults.total,
				shifts: rollResults.critShifts,
			});
		}
		onClose();
	};

	if (rollResults) {
		return (
			<div style={{ padding: '16px' }}>
				<h3 style={{ margin: '0 0 16px 0' }}>Roll Results</h3>

				<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
					<div style={{ flex: 1 }}>
						<label style={{ display: 'block', marginBottom: '4px' }}>
							Check Type:
							<select
								value={checkType}
								onChange={handleCheckTypeChange}
								style={{
									width: '100%',
									padding: '4px',
									border: '1px solid var(--text)',
									borderRadius: '4px',
									backgroundColor: 'var(--background)',
									color: 'var(--text)',
								}}
							>
								{CHECK_TYPES.map(type => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</label>
					</div>

					{(checkType === 'Static-Active' || checkType === 'Contested-Active') && (
						<div style={{ flex: 1 }}>
							<label htmlFor='dc' style={{ display: 'block', marginBottom: '4px' }}>
								DC:
							</label>
							<input
								id='dc'
								type='number'
								value={dc || ''}
								onChange={handleDcChange}
								style={{
									width: '100%',
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

				{/* Dice Results */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
					{rollResults.dice.map((value, index) => (
						<div key={index}>{renderDiceResult(value, undefined, rollResults.selectedDice.includes(value))}</div>
					))}
					{rollResults.extraResult !== undefined && (
						<div>
							{renderDiceResult(
								rollResults.extraResult,
								rollResults.extraValid,
								rollResults.extraValid && rollResults.selectedDice.includes(rollResults.extraResult),
							)}
							<div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
								Extra ({tree?.valueOf(getAttributeType(extraSkill)) ?? 0})
							</div>
						</div>
					)}
					{rollResults.luckResult !== undefined && (
						<div>
							{renderDiceResult(
								rollResults.luckResult,
								rollResults.luckValid,
								rollResults.luckValid && rollResults.selectedDice.includes(rollResults.luckResult),
							)}
							<div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
								Luck ({tree?.valueOf(StatType.Fortune) ?? 0})
							</div>
						</div>
					)}
				</div>

				{/* Auto Fail */}
				{rollResults.autoFail && (
					<div
						style={{
							textAlign: 'center',
							marginBottom: '16px',
							color: 'red',
							fontSize: '24px',
							fontWeight: 'bold',
						}}
					>
						Auto Fail
						<div style={{ fontSize: '14px', color: 'var(--text)' }}>
							Rolled pair of 1s (Contested Resisted rolls cannot auto-fail)
						</div>
					</div>
				)}

				{/* Pair of 1s on Contested Resisted (no auto-fail) */}
				{!rollResults.autoFail &&
					checkType === 'Contested-Resisted' &&
					(() => {
						const allDice = [
							...rollResults.dice,
							...(rollResults.extraResult && rollResults.extraValid ? [rollResults.extraResult] : []),
							...(rollResults.luckResult && rollResults.luckValid ? [rollResults.luckResult] : []),
						];
						const hasPairOfOnes = allDice.filter(n => n === 1).length >= 2;
						return hasPairOfOnes;
					})() && (
						<div
							style={{
								textAlign: 'center',
								marginBottom: '16px',
								color: 'orange',
								fontSize: '16px',
								fontWeight: 'bold',
							}}
						>
							Pair of 1s Rolled
							<div style={{ fontSize: '14px', color: 'var(--text)' }}>No auto-fail on Contested Resisted rolls</div>
						</div>
					)}

				{/* Results */}
				{!rollResults.autoFail && (
					<div style={{ marginBottom: '16px' }}>
						<div style={{ marginBottom: '8px' }}>
							<span>
								[{rollResults.selectedDice.join(' + ')}
								{rollResults.critModifiers > 0 && ` + ${rollResults.critModifiers} (Crit)`}] + [{check.modifierValue}{' '}
								(Modifier)] = {rollResults.total}
							</span>
						</div>

						{rollResults.success !== undefined && dc !== null && (
							<div
								style={{
									fontSize: '20px',
									fontWeight: 'bold',
									color: rollResults.success ? 'green' : 'red',
									marginBottom: '8px',
								}}
							>
								{rollResults.success ? 'Success!' : 'Failure'}
								{dc !== null && (
									<span style={{ fontSize: '16px', color: 'var(--text)' }}>
										{' '}
										({rollResults.total} vs DC {dc})
									</span>
								)}
							</div>
						)}

						{rollResults.critShifts > 0 && (
							<div style={{ color: 'var(--success)', fontWeight: 'bold' }}>Shifts: {rollResults.critShifts}</div>
						)}
					</div>
				)}

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
					<Button onClick={() => setRollResults(null)} title='Roll Again' />
					<Button
						onClick={() => {
							void window.navigator.clipboard.writeText(rollResults.total.toString()).catch(() => {
								// Ignore clipboard errors
							});
						}}
						title='Copy Result'
					/>
					<Button onClick={handleCloseWithCallback} title='Close' />
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: '16px' }}>
			<h3 style={{ margin: '0 0 16px 0' }}>Roll Check</h3>

			<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<label style={{ display: 'block', marginBottom: '4px' }}>
						Check Type:
						<select
							value={checkType}
							onChange={handleCheckTypeChange}
							style={{
								width: '100%',
								padding: '4px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'var(--background)',
								color: 'var(--text)',
							}}
						>
							{CHECK_TYPES.map(type => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</label>
				</div>

				{(checkType === 'Static-Active' || checkType === 'Contested-Active') && (
					<div style={{ flex: 1 }}>
						<label htmlFor='dc' style={{ display: 'block', marginBottom: '4px' }}>
							DC:
						</label>
						<input
							id='dc'
							type='number'
							value={dc || ''}
							onChange={handleDcChange}
							style={{
								width: '100%',
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

			{/* Modifiers */}
			<div style={{ marginBottom: '16px' }}>
				<div style={{ marginBottom: '8px' }}>
					<span>Base Modifier: {check.statModifier.description}</span>
				</div>

				<div style={{ marginBottom: '8px' }}>
					<label htmlFor='circumstantial' style={{ display: 'block', marginBottom: '4px' }}>
						Circumstantial Modifier:
					</label>
					<input
						id='circumstantial'
						type='number'
						value={circumstantialModifier}
						onChange={e => setCircumstantialModifier(parseInt(e.target.value) || 0)}
						style={{
							width: '100%',
							padding: '4px',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							backgroundColor: 'var(--background)',
							color: 'var(--text)',
						}}
					/>
				</div>
			</div>

			{/* Extra and Luck Options */}
			<div style={{ marginBottom: '16px' }}>
				<div style={{ marginBottom: '8px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<input type='checkbox' checked={useExtra} onChange={e => setUseExtra(e.target.checked)} />
						Use Extra
					</label>
					{useExtra && (
						<div style={{ marginTop: '4px', marginLeft: '24px' }}>
							<DropdownSelect
								id='extra-skill'
								options={SKILL_OPTIONS}
								value={extraSkill}
								onChange={(value: string) => setExtraSkill(value as SkillType)}
								label='Skill'
							/>
						</div>
					)}
				</div>

				<div>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<input type='checkbox' checked={useLuck} onChange={e => setUseLuck(e.target.checked)} />
						Use Luck
					</label>
				</div>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
				<Button onClick={handleCopyToVTT} title='Copy to VTT' />
				<Button onClick={handleRollDice} title='Roll Dice' />
			</div>
		</div>
	);
};
