import { Resource, RESOURCES } from '@shattered-wilds/commons';
import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet } from '../types';

import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';

interface ResourceInputComponentProps {
	character: Character;
	sheet: CharacterSheet;
	resource: Resource;
}

export const ResourceInputComponent: React.FC<ResourceInputComponentProps> = ({ character, sheet, resource }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const { max, current } = sheet.getResource(resource);
	const { name } = RESOURCES[resource];

	const handlePointChange = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResource(resource, delta);
		updateCharacterProp(character, resource, newValue.toString());
	};

	return (
		<LabeledInput
			key={resource}
			label={name}
			value={`${current}/${max}`}
			disabled={true}
			prefix={
				<Button
					onClick={() => handlePointChange(resource, -1)}
					icon={FaMinus}
					tooltip={`Decrease ${resource}`}
					type='inline'
				/>
			}
			suffix={
				<Button
					onClick={() => handlePointChange(resource, 1)}
					icon={FaPlus}
					tooltip={`Increase ${resource}`}
					type='inline'
				/>
			}
		/>
	);
};
