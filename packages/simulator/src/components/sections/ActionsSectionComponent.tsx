import {
	ActionsSection,
	ActionTabInputValues,
	ActionTabParameterCheckData,
	ActionTabParameterValueData,
	ActionType,
	CharacterSheet,
	DropdownInput,
	FixedInput,
	getRecordKeys,
	PassiveCoverType,
	ResourceInput,
	StatType,
	TextInput,
	WeaponModeOption,
} from '@shattered-wilds/commons';
import React, { useCallback } from 'react';
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

	const [selectedRangeValue, setSelectedRangeValue] = useState<number>('selectedRange', 0);
	const [selectedDefenseRealm, setSelectedDefenseRealm] = useStateArrayItem(
		'selectedDefenseRealm',
		StatType.realms,
		StatType.Body,
	);
	const [selectedPassiveCover, setSelectedPassiveCover] = useState('selectedPassiveCover', PassiveCoverType.None);
	const [heightIncrements, setHeightIncrements] = useState('heightIncrements', 0);

	const weaponModes = sheet.equipment.weaponModes();
	const [selectedWeaponMode, setSelectedWeaponMode] = useStateArrayItem(
		'selectedWeaponMode',
		weaponModes,
		weaponModes[0],
	);

	const armors = sheet.equipment.armorOptions();
	const [selectedArmor, setSelectedArmor] = useStateArrayItem('selectedArmor', armors, 'None');

	const shields = sheet.equipment.shieldOptions();
	const [selectedShield, setSelectedShield] = useStateArrayItem('selectedShield', shields, 'None');

	const inputValues = new ActionTabInputValues({
		selectedWeaponMode,
		selectedRangeValue,
		selectedDefenseRealm,
		selectedPassiveCover,
		heightIncrements,
		selectedArmor,
		selectedShield,
	});

	const updateSelectedWeapon = useCallback(
		(weapon: WeaponModeOption) => {
			setSelectedWeaponMode(weapon);
			setSelectedRangeValue(0);
			setSelectedPassiveCover(PassiveCoverType.None);
			setHeightIncrements(0);
		},
		[setSelectedWeaponMode, setSelectedRangeValue, setSelectedPassiveCover, setHeightIncrements],
	);

	const actionsSection = ActionsSection.create({
		characterId,
		characterSheet: sheet,
		showAll,
		inputValues,
		update: updatedValues => {
			updateSelectedWeapon(updatedValues.selectedWeaponMode);
			setSelectedRangeValue(updatedValues.selectedRangeValue);
			setSelectedDefenseRealm(updatedValues.selectedDefenseRealm);
			setSelectedPassiveCover(updatedValues.selectedPassiveCover);
			setHeightIncrements(updatedValues.heightIncrements);
			setSelectedArmor(updatedValues.selectedArmor);
			setSelectedShield(updatedValues.selectedShield);
		},
	});

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
		const { inputs } = actionsSection.tabs[type];

		const reactInputs = inputs.map(input => {
			if (input instanceof FixedInput) {
				return (
					<LabeledInput
						key={input.key}
						label={input.label}
						tooltip={input.tooltip}
						value={input.getAsString()}
						disabled
					/>
				);
			} else if (input instanceof ResourceInput) {
				return (
					<ResourceInputComponent
						key={`action-inputs-${input.resource}`}
						variant='normal'
						character={character}
						sheet={sheet}
						resource={input.resource}
					/>
				);
			} else if (input instanceof TextInput) {
				return (
					<LabeledInput
						key={input.key}
						label={input.label}
						tooltip={input.tooltip}
						value={input.getAsRaw()}
						onBlur={value => input.setFromString(value)}
					/>
				);
			} else if (input instanceof DropdownInput) {
				return (
					<LabeledDropdown
						key={input.key}
						label={input.label}
						tooltip={input.tooltip}
						options={input.options}
						value={input.getter()}
						onChange={input.setter}
						describe={input.describe}
					/>
				);
			} else {
				throw `Unknown input type: ${input.constructor.name}`;
			}
		});

		if (reactInputs.length === 0) {
			return null;
		}

		const headerDivStyle = { marginBottom: '12px', display: 'flex', gap: '8px' };
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
								<CostBoxComponent cost={action.cost} />

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
