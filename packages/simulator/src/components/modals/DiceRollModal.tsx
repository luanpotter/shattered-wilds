import {
	Check,
	CheckNature,
	CheckType,
	CHECK_TYPES,
	StatTree,
	CharacterSheet,
	StatType,
	DiceRollEncoder,
} from '@shattered-wilds/commons';
import React, { useMemo, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

import { useStore } from '../../store';
import { exportDataToClipboard } from '../../utils/clipboard';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';

export interface DiceRollModalProps {
	characterId: string;
	check: Check;
	onClose: () => void;
	onDiceRollComplete?: ((result: { total: number; shifts: number }) => void) | undefined;
	initialTargetDC?: number;
}

interface DieResult {
	value: number;
	valid?: boolean;
	type: 'base' | 'extra' | 'luck';
}

interface RollResults {
	dice: DieResult[];
	selectedIndices: number[];
	autoFail: boolean;
	total: number;
	critModifiers: number;
	critShifts: number;
	success: boolean | undefined;
}

const rollD12 = () => Math.floor(Math.random() * 12) + 1;

const calculateShifts = (excess: number): number => {
	// Shifting window: +6, then +12, then +18, ...
	if (excess < 6) return 0;
	let shifts = 0;
	let next = 6;
	let add = 6;
	while (excess >= next) {
		shifts++;
		add += 6;
		next += add; // 6, 18, 36, ...
	}
	return shifts;
};

const showTargetDC = (checkType: CheckType) =>
	['Static-Active', 'Static-Resisted', 'Contested-Active'].includes(checkType);

const isActiveCheck = (checkType: CheckType) => checkType.endsWith(`-${CheckNature.Active}`);
const canAutoFail = (checkType: CheckType) => checkType.endsWith(`-${CheckNature.Active}`);

// Core rolling logic
const performRoll = (tree: StatTree, useExtra: boolean, useLuck: boolean, extraSkill: StatType): DieResult[] => {
	const dice: DieResult[] = [
		{ value: rollD12(), type: 'base' },
		{ value: rollD12(), type: 'base' },
	];

	if (useExtra) {
		const extraValue = tree.valueOf(extraSkill).value;
		const extraRoll = rollD12();
		dice.push({
			value: extraRoll,
			valid: extraRoll <= extraValue,
			type: 'extra',
		});
	}

	if (useLuck) {
		const fortuneValue = tree.valueOf(StatType.Fortune).value;
		const luckRoll = rollD12();
		dice.push({
			value: luckRoll,
			valid: luckRoll <= fortuneValue,
			type: 'luck',
		});
	}

	return dice;
};

// Calculate results from dice and settings
const calculateResults = (
	dice: DieResult[],
	selectedIndices: number[],
	checkType: CheckType,
	dc: number | null,
	modifierValue: number,
): Omit<RollResults, 'dice' | 'selectedIndices'> => {
	// For crits and auto-fail we must use ALL dice, even invalid ones
	const allValues = dice.map(die => die.value);
	const validDice = dice.filter(die => die.type === 'base' || die.valid);

	// Auto-fail check
	const hasPairOfOnes = allValues.filter(v => v === 1).length >= 2;
	const autoFail = hasPairOfOnes && canAutoFail(checkType);

	// Calculate crit modifiers
	let critModifiers = 0;
	if (allValues.includes(12)) critModifiers += 6;
	const pairs = allValues.reduce(
		(acc, val, i, arr) => acc + (arr.indexOf(val) !== i && arr.filter(x => x === val).length >= 2 ? 1 : 0),
		0,
	);
	if (pairs > 0) critModifiers += 6;

	// Get selected dice values
	const selectedValues = selectedIndices.map(i => validDice[i]?.value ?? 0);
	const baseTotal = selectedValues.reduce((sum, val) => sum + val, 0) + modifierValue;
	const total = baseTotal + critModifiers;

	// Calculate success and shifts
	let success: boolean | undefined;
	let critShifts = 0;

	if (!autoFail && dc !== null) {
		if (isActiveCheck(checkType)) {
			success = total > dc || (total === dc && critModifiers > 0);
		} else {
			success = total >= dc;
		}

		if (success) {
			critShifts = calculateShifts(total - dc);
		}
	}

	return { autoFail, total, critModifiers, critShifts, success };
};

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
	characterId,
	check,
	onClose,
	onDiceRollComplete,
	initialTargetDC,
}) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId));

	if (!character) {
		return <div>Character {characterId} not found</div>;
	}

	// Check should now be automatically rehydrated by the store
	if (!check.modifierValue) {
		onClose();
		return <div>Corrupted dice roll modal state</div>;
	}

	const sheet = CharacterSheet.from(character.props);

	return (
		<DiceRollModalContent
			sheet={sheet}
			check={check}
			onClose={onClose}
			onDiceRollComplete={onDiceRollComplete}
			{...(initialTargetDC !== undefined && { initialTargetDC })}
		/>
	);
};

// Pentagon die component using CSS polygon border
const PentagonDie: React.FC<{
	value: number;
	isSelected: boolean;
	isValid?: boolean;
	label?: string;
	onClick: () => void;
}> = ({ value, isSelected, isValid, label, onClick }) => (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
		<div
			onClick={onClick}
			onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
			role='button'
			tabIndex={0}
			style={{
				position: 'relative',
				width: '60px',
				height: '60px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				cursor: 'pointer',
			}}
		>
			{/* Pentagon background and border using SVG */}
			<svg
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					top: 0,
					left: 0,
				}}
				viewBox='0 0 60 60'
			>
				<polygon
					points='30,2 58,22 47,56 13,56 2,22'
					fill={isSelected ? 'var(--success)' : 'var(--background-alt)'}
					stroke='var(--text)'
					strokeWidth='2'
				/>
			</svg>

			{/* Content layer */}
			<div
				style={{
					position: 'relative',
					zIndex: 1,
					fontSize: '24px',
					fontWeight: 'bold',
					color: 'var(--text)',
				}}
			>
				{value}
			</div>

			{isValid !== undefined && (
				<div
					style={{
						position: 'absolute',
						bottom: '8px',
						right: '8px',
						fontSize: '12px',
						zIndex: 2,
					}}
				>
					{isValid ? <FaCheck style={{ color: 'green' }} /> : <FaTimes style={{ color: 'red' }} />}
				</div>
			)}
		</div>
		{label && <div style={{ fontSize: '12px', textAlign: 'center' }}>{label}</div>}
	</div>
);

const DiceRollModalContent: React.FC<{
	sheet: CharacterSheet;
	check: Check;
	onClose: () => void;
	onDiceRollComplete: ((result: { total: number; shifts: number }) => void) | undefined;
	initialTargetDC?: number;
}> = ({ sheet, check, onClose, onDiceRollComplete, initialTargetDC }) => {
	const tree = sheet.getStatTree();

	const [checkType, setCheckType] = useState<CheckType>(check.type);
	const [dc, setDc] = useState<number | null>(initialTargetDC ?? null);
	const [useExtra, setUseExtra] = useState(false);
	const [useLuck, setUseLuck] = useState(false);
	const [extraSkill, setExtraSkill] = useState<StatType>(StatType.STR);
	const [rollResults, setRollResults] = useState<RollResults | null>(null);

	// Memoized calculations that update when dependencies change
	const results = useMemo(() => {
		if (!rollResults) return null;
		const calculatedResults = calculateResults(
			rollResults.dice,
			rollResults.selectedIndices,
			checkType,
			dc,
			check.modifierValue.value,
		);
		return { ...rollResults, ...calculatedResults };
	}, [rollResults, checkType, dc, check.modifierValue.value]);

	const validDice = useMemo(
		() => rollResults?.dice.filter(die => die.type === 'base' || die.valid) || [],
		[rollResults?.dice],
	);

	const handleCheckTypeChange = (newType: CheckType) => setCheckType(newType);
	const handleDcInputChange = (value: string) => setDc(value ? parseInt(value) : null);

	const handleCopyToVTT = () => {
		const d12Command = DiceRollEncoder.encode({
			characterName: sheet.name,
			check,
			extra: useExtra
				? {
						name: extraSkill.name,
						value: tree.valueOf(extraSkill).value,
					}
				: undefined,
			luck: useLuck
				? {
						value: tree.valueOf(StatType.Fortune).value,
					}
				: undefined,
			targetDC: dc ?? undefined,
		});
		exportDataToClipboard(d12Command);
		onClose();
	};

	const handleRollDice = () => {
		const dice = performRoll(tree, useExtra, useLuck, extraSkill);
		const validDice = dice.filter(die => die.type === 'base' || die.valid);

		// Auto-select best two dice
		const sorted = validDice
			.map((die, index) => ({ die, index }))
			.sort((a, b) => {
				// Prioritize 12s for crits, then highest values
				if (a.die.value === 12 && b.die.value !== 12) return -1;
				if (b.die.value === 12 && a.die.value !== 12) return 1;
				return b.die.value - a.die.value;
			});

		const selectedIndices = sorted.slice(0, 2).map(({ index }) => index);

		setRollResults({
			dice,
			selectedIndices,
			autoFail: false, // Will be calculated in useMemo
			total: 0, // Will be calculated in useMemo
			critModifiers: 0, // Will be calculated in useMemo
			critShifts: 0, // Will be calculated in useMemo
			success: undefined, // Will be calculated in useMemo
		});
	};

	const handleDiceClick = (dieIndex: number) => {
		if (!rollResults) return;

		const { selectedIndices } = rollResults;
		const isSelected = selectedIndices.includes(dieIndex);

		let newIndices: number[];
		if (isSelected) {
			// Deselect and ensure we still have 2 dice selected
			newIndices = selectedIndices.filter(i => i !== dieIndex);
			if (newIndices.length === 1) {
				// Find another available die
				const available = validDice.findIndex((_, i) => !newIndices.includes(i));
				if (available !== -1) newIndices.push(available);
			}
		} else if (selectedIndices.length < 2) {
			// Add to selection
			newIndices = [...selectedIndices, dieIndex];
		} else {
			// Replace the lower-value die
			const currentValues = selectedIndices.map(i => validDice[i]?.value || 0);
			const replaceIndex = currentValues[0] < currentValues[1] ? 0 : 1;
			newIndices = [...selectedIndices];
			newIndices[replaceIndex] = dieIndex;
		}

		setRollResults({ ...rollResults, selectedIndices: newIndices });
	};

	const handleCloseWithCallback = () => {
		if (results && onDiceRollComplete) {
			onDiceRollComplete({
				total: results.total,
				shifts: results.critShifts,
			});
		}
		onClose();
	};

	// Render results view
	if (results) {
		const { selectedIndices, autoFail, total, critModifiers, success, critShifts } = results;
		const selectedValues = selectedIndices.map(i => validDice[i]?.value || 0);
		const allValidValues = validDice.map(die => die.value);
		const hasPairOfOnes = allValidValues.filter(v => v === 1).length >= 2;

		return (
			<div style={{ padding: '16px' }}>
				{/* Settings */}
				<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
					<div style={{ flex: 1 }}>
						<LabeledDropdown
							label='Check Type'
							value={checkType}
							options={CHECK_TYPES}
							describe={type => type}
							onChange={handleCheckTypeChange}
						/>
					</div>
					{showTargetDC(checkType) && (
						<div style={{ flex: 1 }}>
							<LabeledInput label='DC' value={dc?.toString() || ''} onChange={handleDcInputChange} />
						</div>
					)}
				</div>

				{/* Dice Display */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
					{(() => {
						if (!rollResults) return null;
						let currentValidIdx = 0;
						return rollResults.dice.map((die, displayIdx) => {
							const isValidDie = die.type === 'base' || die.valid;
							const validIdx = isValidDie ? currentValidIdx++ : -1;
							const label =
								die.type === 'extra'
									? `${extraSkill.name} (${tree.valueOf(extraSkill).value})`
									: die.type === 'luck'
										? `LCK (${tree.valueOf(StatType.Fortune).value})`
										: undefined;
							const isSelected = validIdx >= 0 && selectedIndices.includes(validIdx);
							const handleClick = () => {
								if (validIdx >= 0) handleDiceClick(validIdx);
							};
							return (
								<PentagonDie
									key={displayIdx}
									value={die.value}
									isSelected={isSelected}
									{...(die.valid !== undefined && { isValid: die.valid })}
									{...(label && { label })}
									onClick={handleClick}
								/>
							);
						});
					})()}
				</div>

				{/* Status Messages */}
				{autoFail && (
					<div
						style={{ textAlign: 'center', marginBottom: '16px', color: 'red', fontSize: '24px', fontWeight: 'bold' }}
					>
						Auto Fail
						<div style={{ fontSize: '14px', color: 'var(--text)' }}>Rolled pair of 1s</div>
					</div>
				)}

				{!autoFail && hasPairOfOnes && checkType === 'Contested-Resisted' && (
					<div
						style={{ textAlign: 'center', marginBottom: '16px', color: 'orange', fontSize: '16px', fontWeight: 'bold' }}
					>
						Pair of 1s Rolled
						<div style={{ fontSize: '14px', color: 'var(--text)' }}>No auto-fail on Contested Resisted rolls</div>
					</div>
				)}

				{/* Results */}
				{!autoFail && (
					<div style={{ marginBottom: '16px' }}>
						<div style={{ marginBottom: '8px', textAlign: 'center' }}>
							{(() => {
								const selectedText = selectedValues.length > 0 ? selectedValues.join(' + ') : '0';
								const critText = critModifiers > 0 ? ` + ${critModifiers} (Crit)` : '';
								const modifierText = check.modifierValue?.description ?? `${check.modifierValue?.value ?? 0}`;
								return `[${selectedText}]${critText} + [${modifierText}] = ${total}`;
							})()}
						</div>

						{success !== undefined && dc !== null && (
							<div
								style={{
									fontSize: '20px',
									fontWeight: 'bold',
									color: success ? 'green' : 'red',
									marginBottom: '8px',
									textAlign: 'center',
								}}
							>
								{success ? 'Success!' : 'Failure'} ({total} vs DC {dc})
							</div>
						)}

						{critShifts > 0 && (
							<div style={{ color: 'var(--success)', fontWeight: 'bold', textAlign: 'center' }}>
								Shifts: {critShifts}
							</div>
						)}
					</div>
				)}

				{/* Actions */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
					<Button onClick={() => setRollResults(null)} title='Roll Again' />
					<Button onClick={() => exportDataToClipboard(total.toString())} title='Copy Result' />
					<Button onClick={handleCloseWithCallback} title='Close' />
				</div>
			</div>
		);
	}

	// Render setup form
	return (
		<div style={{ padding: '16px' }}>
			{/* Settings */}
			<div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<LabeledDropdown
						label='Check Type'
						value={checkType}
						options={CHECK_TYPES}
						describe={type => type}
						onChange={handleCheckTypeChange}
					/>
				</div>
				{showTargetDC(checkType) && (
					<div style={{ flex: 1 }}>
						<LabeledInput label='DC' value={dc?.toString() || ''} onChange={handleDcInputChange} />
					</div>
				)}
			</div>

			{/* Base Modifier Info */}
			<Block>
				<div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{check.descriptor}</div>
				<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '8px 0', opacity: 0.3 }} />
				{check.statModifier.breakdown().map(({ name, value }) => (
					<div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
						<span>{name}</span>
						<span>{value}</span>
					</div>
				))}
				<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '8px 0', opacity: 0.3 }} />
				<div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
					<span>Total Modifier</span>
					<span>{check.modifierValue.value}</span>
				</div>
			</Block>

			{/* Extra and Luck Options */}
			<div style={{ marginBottom: '16px' }}>
				<LabeledCheckbox label='Use Extra' checked={useExtra} onChange={setUseExtra} />
				{useExtra && (
					<div style={{ marginTop: '4px', marginLeft: '24px' }}>
						<LabeledDropdown
							options={StatType.attributes.filter(
								attr => attr !== check.statModifier.statType && attr !== StatType.LCK,
							)}
							describe={stat => stat.name}
							value={extraSkill}
							onChange={setExtraSkill}
							label='Skill'
						/>
					</div>
				)}

				<div style={{ marginTop: '8px' }}>
					{checkType.endsWith(`-${CheckNature.Active}`) ? (
						<LabeledCheckbox label='Use Luck' checked={useLuck} onChange={setUseLuck} />
					) : null}
				</div>
			</div>

			{/* Actions */}
			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
				<Button onClick={handleCopyToVTT} title='Copy to VTT' />
				<Button onClick={handleRollDice} title='Roll Dice' />
				<Button onClick={handleCloseWithCallback} title='Close' />
			</div>
		</div>
	);
};
