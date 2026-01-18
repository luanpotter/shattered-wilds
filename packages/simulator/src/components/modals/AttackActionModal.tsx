import {
	Action,
	ACTIONS,
	Bonus,
	calculateShifts,
	CharacterSheet,
	Check,
	CircumstanceModifier,
	COVER_TYPES,
	Distance,
	ModifierSource,
	PassiveCoverType,
	Ranged,
	Resource,
	Trait,
	WeaponModeOption,
} from '@shattered-wilds/d12';
import React, { useEffect, useState } from 'react';
import { FaDice, FaFistRaised } from 'react-icons/fa';
import { FaGear, FaShield } from 'react-icons/fa6';

import { useModals } from '../../hooks/useModals';
import { useTempModals } from '../../hooks/useTempModals';
import { useStore } from '../../store';
import { getBasicAttacksFor, getBasicDefensesForRealm } from '../../types/grid-actions';
import { AttackActionInitialConfig, Character } from '../../types/ui';
import { semanticClick } from '../../utils';
import { rollCheck } from '../../utils/dice-roller';
import { ATTACK_ACTIONS } from '../hex/GridActions';
import { Bar } from '../shared/Bar';
import { Button } from '../shared/Button';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import ModifierRow from '../shared/ModifierRow';
import NumberStepper from '../shared/NumberStepper';

// Helper to get AP cost for an action
const getApCost = (action: Action): number => {
	const actionDef = ACTIONS[action];
	return actionDef.costs.find(cost => cost.resource === Resource.ActionPoint)?.amount || 0;
};

interface WeaponModeSelectionContentProps {
	weaponModes: WeaponModeOption[];
	currentIndex: number;
	onConfirm: (index: number) => void;
}

const WeaponModeSelectionContent: React.FC<WeaponModeSelectionContentProps> = ({
	weaponModes,
	currentIndex,
	onConfirm,
}) => {
	const [selected, setSelected] = useState<WeaponModeOption>(weaponModes[currentIndex]);
	const { removeTempModal, tempModals } = useTempModals();

	const handleConfirm = () => {
		const index = weaponModes.indexOf(selected);
		onConfirm(index >= 0 ? index : currentIndex);
		const currentModal = tempModals[tempModals.length - 1];
		if (currentModal) {
			removeTempModal(currentModal.id);
		}
	};

	const handleCancel = () => {
		const currentModal = tempModals[tempModals.length - 1];
		if (currentModal) {
			removeTempModal(currentModal.id);
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
			<LabeledDropdown
				label='Weapon'
				value={selected}
				options={weaponModes}
				describe={wm => `${wm.item.name} - ${wm.mode.description}`}
				onChange={setSelected}
			/>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button variant='inline' onClick={handleCancel} title='Cancel' />
				<Button variant='inline' onClick={handleConfirm} title='Confirm' />
			</div>
		</div>
	);
};

interface RangedParametersSelectionContentProps {
	currentRange: number;
	currentCover: PassiveCoverType;
	currentHeightIncrements: number;
	onConfirm: (range: number, cover: PassiveCoverType, heightIncrements: number) => void;
}

const RangedParametersSelectionContent: React.FC<RangedParametersSelectionContentProps> = ({
	currentRange,
	currentCover,
	currentHeightIncrements,
	onConfirm,
}) => {
	const [range, setRange] = useState<number>(currentRange);
	const [cover, setCover] = useState<PassiveCoverType>(currentCover);
	const [heightIncrements, setHeightIncrements] = useState<number>(currentHeightIncrements);
	const { removeTempModal, tempModals } = useTempModals();

	const handleConfirm = () => {
		onConfirm(range, cover, heightIncrements);
		const currentModal = tempModals[tempModals.length - 1];
		if (currentModal) {
			removeTempModal(currentModal.id);
		}
	};

	const handleCancel = () => {
		const currentModal = tempModals[tempModals.length - 1];
		if (currentModal) {
			removeTempModal(currentModal.id);
		}
	};

	const coverOptions = Object.values(PassiveCoverType);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
			<LabeledInput
				label='Range (hexes)'
				value={String(range)}
				onChange={value => setRange(Math.max(1, parseInt(value) || 1))}
			/>
			<LabeledDropdown
				label='Cover'
				value={cover}
				options={coverOptions}
				describe={coverType => `${coverType} (CM: ${COVER_TYPES[coverType].bonus.value})`}
				onChange={setCover}
			/>
			<LabeledInput
				label='Height Increments'
				value={String(heightIncrements)}
				onChange={value => setHeightIncrements(parseInt(value) || 0)}
			/>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button variant='inline' onClick={handleCancel} title='Cancel' />
				<Button variant='inline' onClick={handleConfirm} title='Confirm' />
			</div>
		</div>
	);
};

// ============================================
// Main Component
// ============================================

interface AttackActionModalProps {
	modalId: string;
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
	modalId,
	attackerId,
	defenderId,
	initialConfig,
	onClose,
}) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const { openDiceRollModal, displayModal } = useModals();

	const attacker = characters.find(c => c.id === attackerId);
	const defender = characters.find(c => c.id === defenderId);

	const [defenseResult, setDefenseResult] = useState<RollResult | null>(null);
	const [attackResult, setAttackResult] = useState<RollResult | null>(null);
	const [selectedDefenseAction, setSelectedDefenseAction] = useState<Action>(Action.BasicDefense);

	// Configurable attack parameters (can be changed via gear icons)
	const [selectedAction, setSelectedAction] = useState<Action>(initialConfig.attackAction);
	const [selectedWeaponModeIndex, setSelectedWeaponModeIndex] = useState<number>(initialConfig.weaponModeIndex);
	const [selectedRange, setSelectedRange] = useState<Distance>(initialConfig.range);
	const [selectedCover, setSelectedCover] = useState<PassiveCoverType>(PassiveCoverType.None);
	const [selectedHeightIncrements, setSelectedHeightIncrements] = useState<number>(0);

	// Manual circumstance modifiers
	const [manualAttackCM, setManualAttackCM] = useState<number>(0);
	const [manualDefenseCM, setManualDefenseCM] = useState<number>(0);

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

	// Automatically set results for automatic mode characters on mount
	useEffect(() => {
		if (attacker && defender) {
			const attackerSheet = CharacterSheet.from(attacker.props);
			const defenderSheet = CharacterSheet.from(defender.props);
			const attack = getBasicAttacksFor(attackerSheet)[selectedWeaponModeIndex];
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
	}, [attacker, defender, selectedWeaponModeIndex]);

	if (!attacker || !defender) {
		return <div>Error: Characters not found</div>;
	}

	const attackerSheet = CharacterSheet.from(attacker.props);
	const defenderSheet = CharacterSheet.from(defender.props);
	const attack = getBasicAttacksFor(attackerSheet)[selectedWeaponModeIndex];
	const allWeaponModes = attackerSheet.equipment.weaponOptions();

	const defenses = getBasicDefensesForRealm(defenderSheet, Trait.BodyDefense);

	if (!attack) {
		return <div>Error: Attack not found</div>;
	}

	// Helper to create a manual CM
	const createManualCM = (value: number): CircumstanceModifier | null => {
		if (value === 0) {
			return null;
		}
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: 'Final Adjustment',
			value: Bonus.of(value),
		});
	};

	// Build the attack check with all modifiers
	const rangeIncrementModifier = Ranged.computeRangeIncrementModifier({
		weaponModeOption: attack.weaponModeOption,
		range: selectedRange,
	});
	const coverModifier = Ranged.computeCoverModifier(selectedCover);
	const heightIncrementsModifier = Ranged.computeHeightIncrementsModifier(selectedHeightIncrements);

	const attackCheck = [rangeIncrementModifier, coverModifier, heightIncrementsModifier, createManualCM(manualAttackCM)]
		.filter((cm): cm is NonNullable<typeof cm> => cm !== null)
		.reduce((check, cm) => check.withAdditionalCM(cm), attack.check);

	// Build the defense check with manual CM
	const selectedDefense = defenses.find(d => d.action === selectedDefenseAction)!;
	const defenseCheck = [createManualCM(manualDefenseCM)]
		.filter((cm): cm is NonNullable<typeof cm> => cm !== null)
		.reduce((check, cm) => check.withAdditionalCM(cm), selectedDefense.check);

	const handleRoll = ({
		character,
		check,
		otherResult,
		setResult,
	}: {
		character: Character;
		check: Check;
		otherResult: RollResult | null;
		setResult: React.Dispatch<React.SetStateAction<RollResult | null>>;
	}) => {
		if (character.automaticMode) {
			setResult(getAutomaticResult(check));
		} else {
			// Open dice roll modal for manual rolling (override)
			openDiceRollModal({
				characterId: character.id,
				check,
				...(otherResult && { initialTargetDC: otherResult.total }),
				onDiceRollComplete: (result: { total: number; shifts: number }) => {
					setResult(result);
				},
			});
		}
	};

	const handleDefenseRoll = () => {
		handleRoll({
			character: defender,
			check: defenseCheck,
			otherResult: attackResult,
			setResult: setDefenseResult,
		});
	};

	const handleAttackRoll = () => {
		handleRoll({
			character: attacker,
			check: attackCheck,
			otherResult: defenseResult,
			setResult: setAttackResult,
		});
	};

	const handleRollBoth = async () => {
		const defResult = await rollCheck(defenseCheck, { characterName: defender.props.name });
		setDefenseResult(defResult);

		const atkResult = await rollCheck(attackCheck, { characterName: attacker.props.name });
		setAttackResult(atkResult);
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

	// ============================================
	// Handlers for changing attack configuration
	// ============================================

	const handleChangeWeaponMode = async () => {
		const result = await displayModal<number>({
			ownerModalId: modalId,
			title: 'Select Weapon Mode',
			widthPixels: 400,
			content: (
				<WeaponModeSelectionContent
					weaponModes={allWeaponModes}
					currentIndex={selectedWeaponModeIndex}
					onConfirm={index => {
						setSelectedWeaponModeIndex(index);
					}}
				/>
			),
		});
		if (result !== undefined) {
			setSelectedWeaponModeIndex(result);
		}
	};

	const handleChangeRange = async () => {
		await displayModal<void>({
			ownerModalId: modalId,
			title: 'Ranged Parameters',
			widthPixels: 350,
			content: (
				<RangedParametersSelectionContent
					currentRange={selectedRange.value}
					currentCover={selectedCover}
					currentHeightIncrements={selectedHeightIncrements}
					onConfirm={(range, cover, heightIncrements) => {
						setSelectedRange(Distance.of(range));
						setSelectedCover(cover);
						setSelectedHeightIncrements(heightIncrements);
					}}
				/>
			),
		});
	};

	const outcome = calculateOutcome();

	const modalStyle: React.CSSProperties = {
		padding: '20px',
		maxWidth: '90vw',
		boxSizing: 'border-box',
	};

	const halfStyle: React.CSSProperties = {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'stretch',
		justifyContent: 'space-between',
		gap: '16px',
	};

	const subHalfStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
		alignItems: 'stretch',
	};

	const attackButtonText = `${
		attacker.automaticMode && attackResult
			? 'Override Attack'
			: attacker.automaticMode
				? 'Use Auto Attack'
				: `Roll ${selectedAction}`
	}${defenseResult ? ` (DC ${defenseResult.total})` : ''}`;

	const Header = ({ text, Icon }: { text: string; Icon: React.ComponentType }) => {
		return (
			<>
				<h4
					style={{
						margin: '0',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<Icon /> {text}
				</h4>
				<Bar />
			</>
		);
	};

	const Element: React.FC<{ items: ({ title: string; value: string } | null)[]; onClick: () => void }> = ({
		items,
		onClick,
	}) => {
		return (
			<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
				<div
					style={{
						border: '1px solid var(--text)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '2px',
						cursor: 'pointer',
					}}
					{...semanticClick('button', onClick)}
				>
					<FaGear style={{ fontSize: '0.75em' }} />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
					{items
						.filter(item => item !== null)
						.map(({ title, value }) => (
							<div key={title}>
								<strong>{title}:</strong> {value}
							</div>
						))}
				</div>
			</div>
		);
	};

	return (
		<div style={modalStyle}>
			<div style={{ display: 'flex', gap: '16px' }}>
				{/* Defender Half */}
				<div style={halfStyle}>
					<div style={subHalfStyle}>
						<Header text={`Defender: ${defender.props.name}`} Icon={FaShield} />

						<LabeledDropdown
							label='Action'
							variant='inline'
							value={selectedDefenseAction}
							options={defenses.map(d => d.action)}
							describe={action => {
								const defense = defenses.find(d => d.action === action);
								const ap = getApCost(action);
								return `${defense?.name ?? action} [${ap} AP]`;
							}}
							onChange={setSelectedDefenseAction}
						/>
						<NumberStepper label='CM' value={manualDefenseCM} onChange={setManualDefenseCM} />
					</div>
					<div style={subHalfStyle}>
						<Bar />
						{defenseCheck && <ModifierRow check={defenseCheck} />}
						<Bar />
						<Button
							icon={FaDice}
							title={`${
								defender.automaticMode && defenseResult
									? `Override ${selectedDefense?.name}`
									: defender.automaticMode
										? `Use Auto ${selectedDefense?.name}`
										: `Roll ${selectedDefense?.name}`
							}${attackResult ? ` (DC ${attackResult.total})` : ''}`}
							onClick={handleDefenseRoll}
						/>

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
									{selectedDefense?.name} Result:{' '}
									{defender.automaticMode ? `Auto: ${defenseResult.total}` : defenseResult.total}
								</strong>
								{defenseResult.shifts > 0 && <div>Shifts: {defenseResult.shifts}</div>}
							</div>
						)}
					</div>
				</div>

				<div style={{ width: '1px', backgroundColor: 'var(--text)' }} />

				{/* Attacker Half */}
				<div style={halfStyle}>
					<div style={subHalfStyle}>
						<Header text={`Attacker: ${attacker.props.name}`} Icon={FaFistRaised} />

						<LabeledDropdown
							label='Action'
							variant='inline'
							value={selectedAction}
							options={ATTACK_ACTIONS}
							describe={action => `${action} [${getApCost(action)} AP]`}
							onChange={setSelectedAction}
						/>
						<Element
							items={[
								{ title: 'Weapon', value: attack.weaponModeOption.item.name },
								{ title: 'Mode', value: attack.weaponModeOption.mode.description },
							]}
							onClick={handleChangeWeaponMode}
						/>
						<Element
							items={[
								{
									title: 'Range',
									value: `${selectedRange.description}${rangeIncrementModifier ? ` [CM: ${rangeIncrementModifier.value.description}]` : ''}`,
								},
								{
									title: 'Cover',
									value: `${selectedCover}${coverModifier ? ` [CM: ${coverModifier.value.description}]` : ''}`,
								},
								{
									title: 'Height Δ',
									value: `${selectedHeightIncrements}${heightIncrementsModifier ? ` [CM: ${heightIncrementsModifier.value.description}]` : ''}`,
								},
							]}
							onClick={handleChangeRange}
						/>
						<NumberStepper label='CM' value={manualAttackCM} onChange={setManualAttackCM} />
					</div>

					<div style={subHalfStyle}>
						<Bar />
						<ModifierRow check={attackCheck} />
						<Bar />
						<Button icon={FaDice} title={attackButtonText} onClick={handleAttackRoll} />

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
				{!defenseResult && !attackResult && <Button onClick={handleRollBoth} title='Roll Both' />}
				{outcome && <Button onClick={handleExecute} title='Execute' />}
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
