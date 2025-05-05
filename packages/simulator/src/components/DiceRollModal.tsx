import React from 'react';
import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

import { CharacterSheet, AttributeType } from '../types';

import DropdownSelect from './DropdownSelect';

type RollType = 'Static' | 'Contested (Active)' | 'Contested (Passive)';

// Define the skills directly from AttributeType
const SKILL_OPTIONS = {
	Muscles: AttributeType.Muscles.name,
	Stance: AttributeType.Stance.name,
	Lift: AttributeType.Lift.name,
	Finesse: AttributeType.Finesse.name,
	Evasiveness: AttributeType.Evasiveness.name,
	Agility: AttributeType.Agility.name,
	Toughness: AttributeType.Toughness.name,
	Stamina: AttributeType.Stamina.name,
	Resilience: AttributeType.Resilience.name,
	IQ: AttributeType.IQ.name,
	Knowledge: AttributeType.Knowledge.name,
	Memory: AttributeType.Memory.name,
	Perception: AttributeType.Perception.name,
	Awareness: AttributeType.Awareness.name,
	Intuition: AttributeType.Intuition.name,
	Speechcraft: AttributeType.Speechcraft.name,
	Charm: AttributeType.Charm.name,
	Appearance: AttributeType.Appearance.name,
	Faith: AttributeType.Faith.name,
	Attunement: AttributeType.Attunement.name,
	Devotion: AttributeType.Devotion.name,
	Discipline: AttributeType.Discipline.name,
	Tenacity: AttributeType.Tenacity.name,
	Resolve: AttributeType.Resolve.name,
	Gambling: AttributeType.Gambling.name,
	Fortune: AttributeType.Fortune.name,
	Serendipity: AttributeType.Serendipity.name,
} as const;

type SkillType = keyof typeof SKILL_OPTIONS;

const getAttributeType = (skill: SkillType): AttributeType => {
	return AttributeType[skill];
};

export interface DiceRollModalProps {
	modifier: number;
	onClose: () => void;
	attributeName: string;
	characterSheet?: CharacterSheet | undefined;
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
	critConsequences: number;
	success: boolean | undefined;
	selectedDice: number[];
}

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
	modifier,
	onClose,
	attributeName,
	characterSheet,
}) => {
	const [circumstantialModifier, setCircumstantialModifier] = useState(0);
	const [rollType, setRollType] = useState<RollType>('Static');
	const [dc, setDc] = useState<number | null>(null);
	const [useExtra, setUseExtra] = useState(false);
	const [useLuck, setUseLuck] = useState(false);
	const [extraSkill, setExtraSkill] = useState<SkillType>('Muscles');
	const [rollResults, setRollResults] = useState<RollResults | null>(null);

	const updateResults = (newRollType?: RollType, newDc?: number | null) => {
		if (!rollResults) return;

		const currentType = newRollType ?? rollType;
		const currentDc = newDc ?? dc;

		let success = false;
		let critConsequences = 0;

		if (!rollResults.autoFail && currentDc !== null) {
			// For Active rolls, ties are losses unless there's a crit modifier
			if (currentType === 'Contested (Active)') {
				success =
					rollResults.total > currentDc ||
					(rollResults.total === currentDc && rollResults.critModifiers > 0);
				if (success) {
					critConsequences = Math.floor((rollResults.total - currentDc) / 6);
				}
			} else {
				success = rollResults.total >= currentDc;
				if (success && currentType === 'Static') {
					critConsequences = Math.floor((rollResults.total - currentDc) / 6);
				}
			}
		}

		setRollResults({
			...rollResults,
			success,
			critConsequences,
		});
	};

	const handleRollTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newType = e.target.value as RollType;
		setRollType(newType);
		updateResults(newType);
	};

	const handleDcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDc = e.target.value ? parseInt(e.target.value) : null;
		setDc(newDc);
		updateResults(undefined, newDc);
	};

	const handleCopyToVTT = () => {
		const circumstantialPart = circumstantialModifier !== 0 ? ` + ${circumstantialModifier}` : '';
		const extraPart = useExtra ? ' extra' : '';
		const luckPart = useLuck ? ' luck' : '';
		const dcPart = dc !== null ? ` dc ${dc}` : '';
		void window.navigator.clipboard
			.writeText(`/r d12 + ${modifier}${circumstantialPart}${extraPart}${luckPart}${dcPart}`)
			.catch(() => {
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
			const extraSkillValue =
				characterSheet?.getAttributeTree().valueOf(getAttributeType(extraSkill)) ?? 0;
			extraValid = extraResult <= extraSkillValue;
		}

		// Roll luck die if enabled
		if (useLuck) {
			luckResult = rollD12();
			// Get actual Fortune value from character sheet
			const fortuneValue = characterSheet?.getAttributeTree().valueOf(AttributeType.Fortune) ?? 0;
			luckValid = luckResult <= fortuneValue;
		}

		// Check for auto fail (any pair of 1s)
		const allDice = [...dice];
		if (extraResult && extraValid) allDice.push(extraResult);
		if (luckResult && luckValid) allDice.push(luckResult);
		const autoFail = allDice.filter(n => n === 1).length >= 2;

		// Calculate crit modifiers
		let critModifiers = 0;
		if (allDice.includes(12)) critModifiers += 6;
		const pairs = allDice.reduce(
			(acc, n, i, arr) =>
				acc + (arr.indexOf(n) !== i && arr.filter(x => x === n).length >= 2 ? 1 : 0),
			0
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

		const baseTotal = selectedDice[0] + selectedDice[1] + modifier + circumstantialModifier;

		// Calculate final total
		const total = baseTotal + critModifiers;

		let success = false;
		let critConsequences = 0;

		if (!autoFail && dc !== null) {
			// For Active rolls, ties are losses unless there's a crit modifier
			if (rollType === 'Contested (Active)') {
				success = total > dc || (total === dc && critModifiers > 0);
				if (success) {
					critConsequences = Math.floor((total - dc) / 6);
				}
			} else {
				success = total >= dc;
				if (success && rollType === 'Static') {
					critConsequences = Math.floor((total - dc) / 6);
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
			critConsequences,
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
						{isValid ? (
							<FaCheck style={{ color: 'green' }} />
						) : (
							<FaTimes style={{ color: 'red' }} />
						)}
					</div>
				)}
			</div>
		);
	};

	if (rollResults) {
		return (
			<div style={{ padding: '16px' }}>
				<h3 style={{ margin: '0 0 16px 0' }}>Roll Results</h3>

				{/* Roll Type Selection and DC */}
				<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
					<div style={{ flex: 1 }}>
						<label htmlFor='roll-type' style={{ display: 'block', marginBottom: '4px' }}>
							Roll Type:
						</label>
						<select
							id='roll-type'
							value={rollType}
							onChange={handleRollTypeChange}
							style={{
								width: '100%',
								padding: '4px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'var(--background)',
								color: 'var(--text)',
							}}
						>
							<option value='Static'>Static Check</option>
							<option value='Contested (Active)'>Contested (Active)</option>
							<option value='Contested (Passive)'>Contested (Passive)</option>
						</select>
					</div>

					{(rollType === 'Static' || rollType === 'Contested (Active)') && (
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
				<div
					style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}
				>
					{rollResults.dice.map((value, index) => (
						<div key={index}>
							{renderDiceResult(value, undefined, rollResults.selectedDice.includes(value))}
						</div>
					))}
					{rollResults.extraResult !== undefined && (
						<div>
							{renderDiceResult(
								rollResults.extraResult,
								rollResults.extraValid,
								rollResults.extraValid && rollResults.selectedDice.includes(rollResults.extraResult)
							)}
							<div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
								Extra (
								{characterSheet?.getAttributeTree().valueOf(getAttributeType(extraSkill)) ?? 0})
							</div>
						</div>
					)}
					{rollResults.luckResult !== undefined && (
						<div>
							{renderDiceResult(
								rollResults.luckResult,
								rollResults.luckValid,
								rollResults.luckValid && rollResults.selectedDice.includes(rollResults.luckResult)
							)}
							<div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
								Luck ({characterSheet?.getAttributeTree().valueOf(AttributeType.Fortune) ?? 0})
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
						<div style={{ fontSize: '14px', color: 'var(--text)' }}>Rolled pair of 1s</div>
					</div>
				)}

				{/* Results */}
				{!rollResults.autoFail && (
					<div style={{ marginBottom: '16px' }}>
						<div style={{ marginBottom: '8px' }}>
							<span>
								[{rollResults.selectedDice.join(' + ')}
								{rollResults.critModifiers > 0 && ` + ${rollResults.critModifiers} (Crit)`}] + [
								{modifier} (Modifier)
								{circumstantialModifier !== 0 && ` + ${circumstantialModifier} (Circumstance)`}] ={' '}
								{rollResults.total}
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

						{rollResults.critConsequences > 0 && (
							<div style={{ color: 'green', fontWeight: 'bold' }}>
								Crit Consequences: {rollResults.critConsequences}
							</div>
						)}
					</div>
				)}

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
					<button
						onClick={() => setRollResults(null)}
						style={{
							padding: '8px 16px',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							color: 'var(--text)',
							cursor: 'pointer',
						}}
					>
						Roll Again
					</button>
					<button
						onClick={onClose}
						style={{
							padding: '8px 16px',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							color: 'var(--text)',
							cursor: 'pointer',
						}}
					>
						Close
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: '16px' }}>
			<h3 style={{ margin: '0 0 16px 0' }}>Roll {attributeName} Check</h3>

			{/* Roll Type Selection and DC */}
			<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<label htmlFor='roll-type' style={{ display: 'block', marginBottom: '4px' }}>
						Roll Type:
					</label>
					<select
						id='roll-type'
						value={rollType}
						onChange={handleRollTypeChange}
						style={{
							width: '100%',
							padding: '4px',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							backgroundColor: 'var(--background)',
							color: 'var(--text)',
						}}
					>
						<option value='Static'>Static Check</option>
						<option value='Contested (Active)'>Contested (Active)</option>
						<option value='Contested (Passive)'>Contested (Passive)</option>
					</select>
				</div>

				{(rollType === 'Static' || rollType === 'Contested (Active)') && (
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
					<span>Base Modifier: {modifier >= 0 ? `+${modifier}` : modifier}</span>
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
						<input
							type='checkbox'
							checked={useExtra}
							onChange={e => setUseExtra(e.target.checked)}
						/>
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
				<button
					onClick={handleCopyToVTT}
					style={{
						padding: '8px 16px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						color: 'var(--text)',
						cursor: 'pointer',
					}}
				>
					Copy to VTT
				</button>
				<button
					onClick={handleRollDice}
					style={{
						padding: '8px 16px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						color: 'var(--text)',
						cursor: 'pointer',
					}}
				>
					Roll Dice
				</button>
			</div>
		</div>
	);
};
