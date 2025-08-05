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
	const [parameter, setParameter] = useState<string | null>(null);
	const [parameterError, setParameterError] = useState<string | null>(null);

	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return <div>Character not found: {characterId}</div>;
	}

	const handleParameterChange = (value: string) => {
		setParameter(value);
		setParameterError(null);
	};

	const handleConfirm = () => {
		// Validate all required parameters are filled
		const missingParameter = !baseFeat.parameter || !parameter;

		if (missingParameter) {
			// Set error state for missing parameters
			setParameterError(`Missing required parameters for ${baseFeat.name}`);
			return;
		}

		// Clear any previous errors
		setParameterError(null);

		// Create the parameterized feat instance
		const info = FeatInfo.hydrateFeatDefinition(
			baseFeat,
			parameter ? { [baseFeat.parameter!.id]: parameter } : {},
			slot,
		);

		// Update the slot with the parameterized feat ID
		const [key, value] = info.toProp()!;
		updateCharacterProp(character, key, value);

		// Close modal
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
		return (
			<div key={param.id} style={{ marginBottom: '12px' }}>
				<LabeledDropdown
					label={param.name}
					value={parameter}
					options={param.values || []}
					describe={option => option}
					onChange={handleParameterChange}
				/>
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
			<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
				{baseFeat.description}
			</div>

			{renderFeatParameterPicker()}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
				<Button onClick={handleCancel} title='Cancel' />
				<Button onClick={handleConfirm} title='Confirm' />
			</div>
		</div>
	);
};
