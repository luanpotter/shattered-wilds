import { CharacterSheet, Resource, RESOURCES } from '@shattered-wilds/commons';
import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';

import { usePropUpdates } from '../hooks/usePropUpdates';
import { Character } from '../types/ui';

import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';

interface ResourceInputComponentProps {
	variant: 'inline' | 'normal';
	character: Character;
	sheet: CharacterSheet;
	resource: Resource;
}

export const ResourceInputComponent: React.FC<ResourceInputComponentProps> = ({
	variant,
	character,
	sheet,
	resource,
}) => {
	const { updateResourceByDelta } = usePropUpdates(character, sheet);

	const { max, current } = sheet.getResource(resource);
	const { fullName, shortCode } = RESOURCES[resource];

	return (
		<LabeledInput
			variant={variant}
			key={resource}
			label={variant === 'inline' ? shortCode : fullName}
			value={`${current}/${max}`}
			disabled={true}
			buttons={
				<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '12px' }}>
					<Button
						variant='inline'
						onClick={() => updateResourceByDelta(resource, -1)}
						icon={FaMinus}
						tooltip={`Decrease ${resource}`}
					/>
					<Button
						variant='inline'
						onClick={() => updateResourceByDelta(resource, 1)}
						icon={FaPlus}
						tooltip={`Increase ${resource}`}
					/>
				</div>
			}
		/>
	);
};
