import { FeatDefinition, FeatParameter, FeatSlot, FeatInfo, FeatType } from '@shattered-wilds/d12';
import React, { useState } from 'react';

import { useStore } from '../../store';
import { Button } from '../shared/Button';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';

const OTHER_OPTION = 'Other...';

interface FeatParameterSetupModalProps {
	characterId: string;
	slot: FeatSlot | undefined;
	baseFeat: FeatDefinition<string | void>;
	onClose: () => void;
}

export const FeatParameterSetupModal: React.FC<FeatParameterSetupModalProps> = ({
	characterId,
	slot,
	baseFeat,
	onClose,
}) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const characters = useStore(state => state.characters);
	const [parameter, setParameter] = useState<string | null>(null);
	const [customParameter, setCustomParameter] = useState<string | null>(null);
	const [parameterError, setParameterError] = useState<string | null>(null);

	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return <div>Character not found: {characterId}</div>;
	}

	const handleParameterChange = (value: string) => {
		setParameter(value);
		setParameterError(null);
		if (value !== null) {
			setCustomParameter(null);
		}
	};

	const handleConfirm = () => {
		// Validate all required parameters are filled
		const param = baseFeat.parameter as FeatParameter<string> | undefined;
		let finalParameter: string | null | undefined = parameter;
		if (param && !param.exact && parameter === OTHER_OPTION) {
			if (!customParameter?.trim()) {
				setParameterError('Custom value is required');
				return;
			}
			finalParameter = customParameter.trim();
		}
		if (!param || !finalParameter) {
			setParameterError(`Missing required parameters for ${baseFeat.name}`);
			return;
		}
		setParameterError(null);
		const info = FeatInfo.hydrateFeatDefinition(baseFeat, { [param.id]: finalParameter as string }, slot);
		// If this is a user-parametrized core feat, use core prop key
		if (baseFeat.type === FeatType.Core && baseFeat.parameter && !slot) {
			const coreProp = FeatInfo.toCoreProp(info);
			if (coreProp) {
				updateCharacterProp(character, coreProp[0], coreProp[1]);
				onClose();
				return;
			}
		}
		// Otherwise, use slot-based prop
		const slotProp = info.toProp();
		if (slotProp) {
			updateCharacterProp(character, slotProp[0], slotProp[1]);
		}
		onClose();
	};

	const handleCancel = () => {
		setParameter(null);
		setParameterError(null);
		onClose();
	};

	const renderFeatParameterPicker = () => {
		const param = baseFeat?.parameter as FeatParameter<string>;
		if (!param) {
			return <></>;
		}
		const hasError = parameterError!;
		// If not exact, add Other option
		const options = param.exact ? param.values : [...param.values, OTHER_OPTION];
		return (
			<div key={param.id}>
				<LabeledDropdown
					label={param.name}
					value={parameter}
					options={options}
					describe={option => option}
					onChange={handleParameterChange}
					placeholder='Select parameter'
				/>
				{/* Show textbox if "Other" is selected */}
				{!param.exact && parameter === OTHER_OPTION && (
					<LabeledInput
						label='Custom Value'
						value={customParameter ?? ''}
						onChange={value => {
							setCustomParameter(value);
							setParameterError(null);
						}}
					/>
				)}
				{hasError && (
					<div
						style={{
							fontSize: '0.8em',
							color: 'red',
							marginTop: '4px',
						}}
					>
						This field is required
					</div>
				)}
			</div>
		);
	};

	return (
		<div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<RichText>{baseFeat.description}</RichText>

			{renderFeatParameterPicker()}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button onClick={handleCancel} title='Cancel' />
				<Button onClick={handleConfirm} title='Confirm' />
			</div>
		</div>
	);
};
