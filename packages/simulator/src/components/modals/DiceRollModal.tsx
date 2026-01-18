import {
	calculateResults,
	CharacterSheet,
	Check,
	CHECK_TYPES,
	CheckNature,
	CheckType,
	DiceRoll,
	DiceRollEncoder,
	RollResults,
	StatType,
} from '@shattered-wilds/d12';
import React, { useCallback, useMemo, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

import { useStore } from '../../store';
import { exportDataToClipboard } from '../../utils/clipboard';
import { diceRoller } from '../../utils/dice-roller';
import { Bar } from '../shared/Bar';
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

const showTargetDC = (checkType: CheckType) =>
	['Static-Active', 'Static-Resisted', 'Contested-Active'].includes(checkType);

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
}> = ({ value, isSelected, isValid, label }) => (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
		<div
			style={{
				position: 'relative',
				width: '60px',
				height: '60px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
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

	const buildDiceRoll = useCallback(
		(): DiceRoll => ({
			characterName: sheet.name,
			check: check.withType(checkType),
			targetDC: dc ?? undefined,
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
		}),
		[check, checkType, dc, extraSkill, sheet.name, tree, useExtra, useLuck],
	);

	// Memoized calculations that update when dependencies change (e.g., DC or check type)
	const results = useMemo(() => {
		if (!rollResults) {
			return null;
		}

		// Recalculate results with current settings using commons function
		const roll = buildDiceRoll();
		const calculatedResults = calculateResults(rollResults.dice, roll);
		return { ...rollResults, ...calculatedResults };
	}, [rollResults, buildDiceRoll]);

	const handleCheckTypeChange = (newType: CheckType) => setCheckType(newType);
	const handleDcInputChange = (value: string) => setDc(value ? parseInt(value) : null);

	const handleCopyToVTT = () => {
		const d12Command = DiceRollEncoder.encode(buildDiceRoll());
		exportDataToClipboard(d12Command);
		onClose();
	};

	const handleRollDice = async () => {
		const roll = buildDiceRoll();
		const rollResult = await diceRoller.roll(roll);
		setRollResults(rollResult);
	};

	const handleCloseWithCallback = () => {
		if (onDiceRollComplete && results) {
			onDiceRollComplete({
				total: results.total,
				shifts: results.critShifts,
			});
		}
		onClose();
	};

	// Render results view
	if (results) {
		const { selectedDice, autoFail, total, critModifiers, success, critShifts, hasPairOfOnes } = results;

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
					{results.dice.map((die, displayIdx) => {
						const isValidDie = die.type === 'base' || die.valid === true;
						const label =
							die.type === 'extra'
								? `${extraSkill.name} (${tree.valueOf(extraSkill).value})`
								: die.type === 'luck'
									? `LCK (${tree.valueOf(StatType.Fortune).value})`
									: undefined;
						// A die is selected if it's valid and its value is in selectedDice
						const isSelected = isValidDie && selectedDice.includes(die.value);
						return (
							<PentagonDie
								key={displayIdx}
								value={die.value}
								isSelected={isSelected}
								{...(die.valid !== undefined && { isValid: die.valid })}
								{...(label && { label })}
							/>
						);
					})}
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
				{!autoFail && (
					<div style={{ marginBottom: '16px' }}>
						<div style={{ marginBottom: '8px', textAlign: 'center' }}>
							{(() => {
								const selectedText = selectedDice.length > 0 ? selectedDice.join(' + ') : '0';
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
				<Bar />
				{check.statModifier.breakdown().map(({ name, value }) => (
					<div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
						<span>{name}</span>
						<span>{value}</span>
					</div>
				))}
				<Bar />
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
