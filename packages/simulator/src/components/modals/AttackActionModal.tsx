import {
	Action,
	ACTIONS,
	CharacterSheet,
	Check,
	COVER_TYPES,
	Distance,
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
import { AttackActionInitialConfig } from '../../types/ui';
import { semanticClick } from '../../utils';
import { ATTACK_ACTIONS } from '../hex/GridActions';
import { Bar } from '../shared/Bar';
import { Button } from '../shared/Button';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import ModifierRow from '../shared/ModifierRow';

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
	const [usedDodge, setUsedDodge] = useState(false);
	const [usedShieldBlock, setUsedShieldBlock] = useState(false);
	const [selectedDefenseAction, setSelectedDefenseAction] = useState<Action>(Action.BasicDefense);

	// Configurable attack parameters (can be changed via gear icons)
	const [selectedAction, setSelectedAction] = useState<Action>(initialConfig.attackAction);
	const [selectedWeaponModeIndex, setSelectedWeaponModeIndex] = useState<number>(initialConfig.weaponModeIndex);
	const [selectedRange, setSelectedRange] = useState<Distance>(initialConfig.range);
	const [selectedCover, setSelectedCover] = useState<PassiveCoverType>(PassiveCoverType.None);
	const [selectedHeightIncrements, setSelectedHeightIncrements] = useState<number>(0);

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

	// Note: handleAttackRoll uses attackCheck which is defined after render helpers
	const handleAttackRoll = () => {
		// attackCheck is defined below with range modifiers applied
		const rangeModifier = Ranged.computeRangeIncrementModifier({
			weaponModeOption: attack.weaponModeOption,
			range: selectedRange,
		});
		const coverMod = Ranged.computeCoverModifier(selectedCover);
		const heightMod = Ranged.computeHeightIncrementsModifier(selectedHeightIncrements);

		const fullCheck = [rangeModifier, coverMod, heightMod]
			.filter((cm): cm is NonNullable<typeof cm> => cm !== null)
			.reduce((check, cm) => check.withAdditionalCM(cm), attack.check);

		if (attacker.automaticMode && !attackResult) {
			// Use automatic value for attack (initial)
			const autoResult = getAutomaticResult(fullCheck);
			setAttackResult(autoResult);
		} else {
			// Open dice roll modal for manual rolling (override)
			openDiceRollModal({
				characterId: attacker.id,
				check: fullCheck,
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
		justifyContent: 'flex-start',
		gap: 8,
	};

	const attackButtonText = `${
		attacker.automaticMode && attackResult
			? 'Override Attack'
			: attacker.automaticMode
				? 'Use Auto Attack'
				: `Roll ${selectedAction}`
	} ${defenseResult ? `(DC ${defenseResult.total})` : '(Roll Defense First)'}`;

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

	const rangeIncrementModifier = Ranged.computeRangeIncrementModifier({
		weaponModeOption: attack.weaponModeOption,
		range: selectedRange,
	});
	const coverModifier = Ranged.computeCoverModifier(selectedCover);
	const heightIncrementsModifier = Ranged.computeHeightIncrementsModifier(selectedHeightIncrements);

	// Amend the attack check with any additional modifiers
	const attackCheck = [rangeIncrementModifier, coverModifier, heightIncrementsModifier]
		.filter((cm): cm is NonNullable<typeof cm> => cm !== null)
		.reduce((check, cm) => check.withAdditionalCM(cm), attack.check);

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
					<Header text={`Defender: ${defender.props.name}`} Icon={FaShield} />

					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
						<Bar />
						{defenses.find(d => d.action === selectedDefenseAction)?.check && (
							<ModifierRow check={defenses.find(d => d.action === selectedDefenseAction)!.check} />
						)}
						<Bar />
						<Button
							icon={FaDice}
							title={
								defender.automaticMode && defenseResult && !usedDodge && !usedShieldBlock
									? `Override ${defenses.find(d => d.action === selectedDefenseAction)?.name}`
									: defender.automaticMode
										? `Use Auto ${defenses.find(d => d.action === selectedDefenseAction)?.name}`
										: `Roll ${defenses.find(d => d.action === selectedDefenseAction)?.name}`
							}
							onClick={() => handleDefenseRoll(selectedDefenseAction)}
							disabled={
								(selectedDefenseAction === Action.Dodge && usedDodge) ||
								(selectedDefenseAction === Action.ShieldBlock && usedShieldBlock) ||
								(attackResult !== null && selectedDefenseAction !== Action.BasicDefense)
							}
						/>
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

				<div style={{ width: '1px', backgroundColor: 'var(--text)' }} />

				{/* Attacker Half */}
				<div style={halfStyle}>
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
					<Bar />
					<ModifierRow check={attackCheck} />
					<Bar />

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
