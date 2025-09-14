import { FeatDefinition, FeatParameter, FeatSlot, FeatInfo } from '@shattered-wilds/commons';
import React, { useState } from 'react';

import { useStore } from '../../store';
import { Button } from '../shared/Button';
import LabeledDropdown from '../shared/LabeledDropdown';

interface FeatParameterSetupModalProps {
	characterId: string;
	slot: FeatSlot;
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
	const [parameter, setParameter] = useState<string | undefined>(undefined);
	const [customParameter, setCustomParameter] = useState<string>('');
	const [parameterError, setParameterError] = useState<string | undefined>(undefined);

	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return <div>Character not found: {characterId}</div>;
	}

	const handleParameterChange = (value: string | undefined) => {
		setParameter(value);
		setParameterError(undefined);
		if (value !== undefined) {
			setCustomParameter('');
		}
	};

	const handleCustomParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCustomParameter(e.target.value);
		setParameterError(undefined);
	};
	const handleConfirm = () => {
		// Validate all required parameters are filled
		const param = baseFeat.parameter as FeatParameter<string> | undefined;
		let finalParameter: string | undefined = parameter;
		if (param && !param.exact && parameter === undefined) {
			if (!customParameter.trim()) {
				setParameterError('Custom value is required');
				return;
			}
			finalParameter = customParameter.trim();
		}
		if (!param || !finalParameter) {
			setParameterError(`Missing required parameters for ${baseFeat.name}`);
			return;
		}
		setParameterError(undefined);
		const info = FeatInfo.hydrateFeatDefinition(baseFeat, { [param.id]: finalParameter as string }, slot);
		const [key, value] = info.toProp()!;
		updateCharacterProp(character, key, value);
		onClose();
	};

	const handleCancel = () => {
		setParameter(undefined);
		setParameterError(undefined);
		onClose();
	};

	const renderFeatParameterPicker = () => {
		const param = baseFeat?.parameter as FeatParameter<string>;
		if (!param) {
			return <></>;
		}
		const hasError = parameterError!;
		// If not exact, add Other option
		const options: (string | undefined)[] = param.exact ? param.values : [...param.values, undefined];
		return (
			<div key={param.id} style={{ marginBottom: '12px' }}>
				<LabeledDropdown
					label={param.name}
					value={parameter}
					options={options}
					describe={option => (option === undefined ? 'Other...' : option)}
					onChange={handleParameterChange}
					placeholder='Select parameter'
				/>
				{/* Show textbox if "Other" is selected */}
				{!param.exact && parameter === undefined && (
					<input
						type='text'
						value={customParameter}
						onChange={handleCustomParameterChange}
						placeholder='Enter custom value'
						style={{ marginTop: '8px', width: '100%' }}
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
		<div>
			<div style={{ fontSize: '0.9em', marginBottom: '12px' }}>{baseFeat.description}</div>

			{renderFeatParameterPicker()}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
				<Button onClick={handleCancel} title='Cancel' />
				<Button onClick={handleConfirm} title='Confirm' />
			</div>
		</div>
	);
};
