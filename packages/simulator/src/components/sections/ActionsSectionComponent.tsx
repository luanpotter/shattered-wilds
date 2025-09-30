import {
	ActionsSection,
	ActionTabInputName,
	ActionTabInputValues,
	ActionTabParameterCheckData,
	ActionTabParameterValueData,
	ActionType,
	Armor,
	CharacterSheet,
	DerivedStatType,
	Distance,
	getRecordKeys,
	PassiveCoverType,
	Resource,
	Shield,
	StatType,
	Weapon,
	WeaponMode,
} from '@shattered-wilds/commons';
import React, { useCallback, useEffect, useMemo } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useModals } from '../../hooks/useModals';
import { useUIStateFactory } from '../../hooks/useUIState';
import { useStore } from '../../store';
import { CostBoxComponent } from '../CostBoxComponent';
import { ParameterBoxComponent } from '../ParameterBoxComponent';
import { ResourceInputComponent } from '../ResourceInputComponent';
import Block from '../shared/Block';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';
import { Tabs } from '../shared/Tabs';

interface ActionsSectionProps {
	characterId: string;
}

interface ActionsSectionInnerProps {
	characterId: string;
	sheet: CharacterSheet;
}

interface WeaponModeOption {
	weapon: Weapon;
	mode: WeaponMode;
}

interface ValueParameterProps {
	data: ActionTabParameterValueData;
}

const ValueParameter: React.FC<ValueParameterProps> = ({ data }) => {
	return (
		<ParameterBoxComponent title={data.title} tooltip={data.tooltip}>
			{data.description}
		</ParameterBoxComponent>
	);
};

interface CheckParameterProps {
	characterId: string;
	data: ActionTabParameterCheckData;
}

const CheckParameter: React.FC<CheckParameterProps> = ({ characterId, data }) => {
	const { openDiceRollModal } = useModals();

	const { title, tooltip, checkData, textTitle, textSubtitle, errors } = data;

	const error = errors[0];
	if (error) {
		return (
			<ParameterBoxComponent title={error.title} tooltip={error.tooltip}>
				<div style={{ color: 'var(--error-color)' }}>{error.text}</div>
			</ParameterBoxComponent>
		);
	}

	return (
		<ParameterBoxComponent
			title={title}
			tooltip={tooltip}
			onClick={() => {
				openDiceRollModal({
					characterId,
					check: checkData.check,
					title: checkData.title,
					...(checkData.targetDc !== undefined && { initialTargetDC: checkData.targetDc }),
				});
			}}
		>
			{textTitle}
			<FaDice size={12} />
			{textSubtitle}
		</ParameterBoxComponent>
	);
};

const ActionsSectionInner: React.FC<ActionsSectionInnerProps> = ({ characterId, sheet }) => {
	const { useState, useStateArrayItem } = useUIStateFactory(`actions-${characterId}`);
	const [activeTab, setActiveTab] = useState('activeTab', ActionType.Movement);
	const [showAll, setShowAll] = useState('showAll', true);

	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const hasShield = sheet.equipment.items.some(item => item instanceof Shield);
	const weapons = sheet.equipment.items.filter(item => item instanceof Weapon) as Weapon[];
	const weaponModes = useMemo(
		() => [
			Weapon.unarmed(),
			...(hasShield ? [Weapon.shieldBash()] : []),
			...weapons.flatMap(weapon => weapon.modes.map(mode => ({ weapon, mode }))),
		],
		[hasShield, weapons],
	);

	const [selectedRange, setSelectedRange] = useState<Distance | null>('selectedRange', null);
	const [selectedDefenseRealm, setSelectedDefenseRealm] = useStateArrayItem(
		'selectedDefenseRealm',
		StatType.realms,
		StatType.Body,
	);
	const [selectedPassiveCover, setSelectedPassiveCover] = useState('selectedPassiveCover', PassiveCoverType.None);
	const [heightIncrements, setHeightIncrements] = useState('heightIncrements', '');
	const armors = useMemo(
		() => ['None', ...sheet.equipment.items.filter(item => item instanceof Armor)] as const,
		[sheet.equipment.items],
	);
	const shields = useMemo(
		() => ['None', ...sheet.equipment.items.filter(item => item instanceof Shield)] as const,
		[sheet.equipment.items],
	);

	const [selectedWeapon, setSelectedWeapon] = useStateArrayItem('selectedWeapon', weaponModes, null);
	const [selectedArmor, setSelectedArmor] = useStateArrayItem('selectedArmor', armors, 'None');
	const [selectedShield, setSelectedShield] = useStateArrayItem('selectedShield', shields, 'None');

	const inputValues = new ActionTabInputValues({
		selectedWeapon,
		selectedRange,
		selectedDefenseRealm,
		selectedPassiveCover,
		heightIncrements,
		selectedArmor,
		selectedShield,
	});

	const actionsSection = ActionsSection.create({
		characterId,
		characterSheet: sheet,
		showAll,
		inputValues,
	});

	const updateSelectedWeapon = useCallback(
		(weapon: WeaponModeOption) => {
			setSelectedWeapon(weapon);
			setSelectedRange(null);
			setSelectedPassiveCover(PassiveCoverType.None);
			setHeightIncrements('');
		},
		[setSelectedWeapon, setSelectedRange, setSelectedPassiveCover, setHeightIncrements],
	);

	useEffect(() => {
		if (weaponModes.length > 0 && !selectedWeapon) {
			updateSelectedWeapon(weaponModes[0]);
		}
	}, [weaponModes, selectedWeapon, updateSelectedWeapon]);
	useEffect(() => {
		if (armors.length > 0 && !selectedArmor) {
			setSelectedArmor(armors[0]);
		}
	}, [armors, selectedArmor, setSelectedArmor]);

	const getTypeIcon = (type: ActionType) => {
		switch (type) {
			case ActionType.Movement:
				return FaRunning;
			case ActionType.Attack:
				return FaFistRaised;
			case ActionType.Defense:
				return FaShield;
			case ActionType.Support:
				return FaHandHolding;
			case ActionType.Heroic:
				return FaStar;
			case ActionType.Meta:
				return FaDice;
		}
	};

	const renderTabButtons = () => {
		const tabItems = getRecordKeys(actionsSection.tabs).map(actionType => ({
			key: actionType,
			label: actionType,
			icon: getTypeIcon(actionType),
		}));
		return <Tabs tabs={tabItems} activeKey={activeTab} onChange={setActiveTab} iconSize={14} />;
	};

	const getHeaderInputsForTab = (type: ActionType): React.ReactNode | null => {
		const headerDivStyle = { marginBottom: '12px', display: 'flex', gap: '8px' };
		const resourceInput = (resource: Resource) => {
			return <ResourceInputComponent variant='normal' character={character} sheet={sheet} resource={resource} />;
		};

		const { inputs } = actionsSection.tabs[type];
		const reactInputs = inputs.map(input => {
			switch (input.name) {
				case ActionTabInputName.ActionPoints:
					return resourceInput(Resource.ActionPoint);
				case ActionTabInputName.VitalityPoints:
					return resourceInput(Resource.VitalityPoint);
				case ActionTabInputName.FocusPoints:
					return resourceInput(Resource.FocusPoint);
				case ActionTabInputName.SpiritPoints:
					return resourceInput(Resource.SpiritPoint);
				case ActionTabInputName.HeroismPoints:
					return resourceInput(Resource.HeroismPoint);
				case ActionTabInputName.Movement: {
					const movement = sheet.getStatTree().getDistance(DerivedStatType.Movement);

					return (
						<LabeledInput
							label='Movement'
							tooltip={movement.description}
							value={movement.value.description}
							disabled={true}
						/>
					);
				}
				case ActionTabInputName.WeaponMode:
					return (
						<LabeledDropdown
							label='Weapon'
							value={selectedWeapon}
							options={weaponModes}
							describe={weaponMode => `${weaponMode.weapon.name} - ${weaponMode.mode.description}`}
							onChange={updateSelectedWeapon}
						/>
					);
				case ActionTabInputName.RangeIncrement:
					return (
						<LabeledInput label='Range Increment' value={selectedWeapon!.mode.range.description} disabled={true} />
					);
				case ActionTabInputName.RangeCM: {
					const rangeIncrementModifier = inputValues.rangeIncrementModifier();
					return (
						<LabeledInput
							label='Range CM'
							disabled={true}
							tooltip={rangeIncrementModifier!.description}
							value={rangeIncrementModifier!.value.description}
						/>
					);
				}
				case ActionTabInputName.Target:
					return (
						<LabeledInput
							label='Target (Hexes)'
							value={selectedRange?.value.toString() ?? ''}
							onChange={value => {
								setSelectedRange(value && parseInt(value) > 0 ? Distance.of(parseInt(value)) : null);
							}}
						/>
					);
				case ActionTabInputName.PassiveCover:
					return (
						<LabeledDropdown
							label='Passive Cover'
							value={selectedPassiveCover}
							options={Object.values(PassiveCoverType) as PassiveCoverType[]}
							onChange={cover => setSelectedPassiveCover(cover)}
						/>
					);
				case ActionTabInputName.HeightIncrements: {
					const heightIncrementsModifier = inputValues.heightIncrementsModifier();
					return (
						<LabeledInput
							label='Height Increments'
							value={heightIncrements}
							tooltip={
								heightIncrementsModifier
									? heightIncrementsModifier.description
									: 'Provide the number of height increments between the attacker and the target.'
							}
							onChange={value => setHeightIncrements(value)}
						/>
					);
				}
				case ActionTabInputName.HeightCM: {
					const heightIncrementsModifier = inputValues.heightIncrementsModifier();
					return (
						<LabeledInput
							label='Height CM'
							disabled={true}
							tooltip={heightIncrementsModifier!.description}
							value={heightIncrementsModifier!.value.description}
						/>
					);
				}
				case ActionTabInputName.DefenseRealm:
					return (
						<LabeledDropdown
							label='Realm'
							value={selectedDefenseRealm}
							options={StatType.realms}
							describe={realm => realm.name}
							onChange={realm => setSelectedDefenseRealm(realm)}
						/>
					);
				case ActionTabInputName.Armor:
					return (
						<LabeledDropdown<Armor | 'None'>
							label='Armor'
							tooltip='Armor is applied to the any **Body Defense** check.'
							value={selectedArmor}
							options={armors}
							describe={armor => (armor === 'None' ? 'No Armor' : armor.displayText)}
							onChange={setSelectedArmor}
						/>
					);
				case ActionTabInputName.Shield:
					return (
						<LabeledDropdown
							label='Shield'
							value={selectedShield}
							options={shields}
							describe={shield => (shield === 'None' ? 'No Shield' : shield.displayText)}
							onChange={setSelectedShield}
							disabled={!hasShield}
						/>
					);
			}
		});

		if (reactInputs.length === 0) {
			return null;
		}

		return <div style={headerDivStyle}>{reactInputs}</div>;
	};

	const renderActionsByType = (type: ActionType) => {
		const Header = getHeaderInputsForTab(type);
		const actions = actionsSection.tabs[type].actions;
		return (
			<div key={type}>
				{Header}
				{Header && (
					<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
				)}

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{actions.length === 0 && (
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<RichText>_No actions available. Select `Show All` to see all actions._</RichText>
						</div>
					)}
					{actions.map(action => {
						return (
							<div key={action.key} style={{ display: 'flex', gap: '2px' }}>
								<CostBoxComponent
									characterId={action.cost.characterId}
									sheet={action.cost.characterSheet}
									name={action.cost.name}
									actionCosts={action.cost.actionCosts}
								/>

								<div
									style={{
										flex: 1,
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: 'var(--background-alt)',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
										<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
											<span style={{ fontWeight: 'bold' }}>{action.title}</span>
											{action.traits.map(trait => (
												<span key={trait} className='trait'>
													{trait}
												</span>
											))}
										</div>
									</div>
									<div style={{ fontSize: '0.9em' }}>
										<RichText>{action.description}</RichText>
									</div>
								</div>

								{action.parameters.map(actionParameter => {
									const { key, data } = actionParameter;
									if (data instanceof ActionTabParameterValueData) {
										return <ValueParameter key={key} data={data} />;
									} else if (data instanceof ActionTabParameterCheckData) {
										return <CheckParameter key={key} characterId={characterId} data={data} />;
									}
									return null;
								})}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Actions</h3>
				<LabeledCheckbox label='Show All' checked={showAll} onChange={setShowAll} />
			</div>

			{renderTabButtons()}
			{renderActionsByType(activeTab)}
		</Block>
	);
};

export const ActionsSectionComponent: React.FC<ActionsSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);

	return <ActionsSectionInner characterId={characterId} sheet={sheet} />;
};
