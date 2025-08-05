import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet, Equipment, BASIC_EQUIPMENT, BasicEquipmentType } from '../types';

import Block from './shared/Block';
import { Button } from './shared/Button';
import LabeledDropdown from './shared/LabeledDropdown';
import LabeledInput from './shared/LabeledInput';

interface EquipmentSectionProps {
	character: Character;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ character }) => {
	const editMode = useStore(state => state.editMode);
	const equipment = CharacterSheet.from(character.props).equipment;

	const [selectedItem, setSelectedItem] = useState<BasicEquipmentType | null>(null);

	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const onUpdateEquipment = (equipment: Equipment) => updateCharacterProp(character, 'equipment', equipment.toProp());

	const handleAddPredefinedItem = (item: BasicEquipmentType) => {
		const newItem = BASIC_EQUIPMENT[item].generator();
		equipment.items.push(newItem);
		onUpdateEquipment(equipment);
		setSelectedItem(null);
	};

	const handleRemoveItem = (idx: number) => {
		equipment.items.splice(idx, 1);
		onUpdateEquipment(equipment);
	};

	return (
		<Block>
			<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Equipment</h3>

			<div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '4px',
					}}
				>
					{editMode && (
						<div>
							<LabeledDropdown
								label='Add Equipment'
								value={selectedItem}
								options={Object.values(BasicEquipmentType)}
								describe={item => item}
								placeholder='Select equipment to add...'
								onChange={handleAddPredefinedItem}
							/>
						</div>
					)}
				</div>

				{equipment.items.map((item, idx) => (
					<div
						key={idx}
						style={{
							display: 'flex',
							alignItems: 'center',
							marginBottom: '4px',
							gap: '4px',
							width: '100%',
						}}
					>
						<LabeledInput
							variant='inline'
							value={item.name}
							onChange={value => {
								item.name = value;
								onUpdateEquipment(equipment);
							}}
							disabled={!editMode}
						/>
						{editMode && (
							<Button onClick={() => handleRemoveItem(idx)} icon={FaTrash} tooltip='Remove item' variant='inline' />
						)}
					</div>
				))}
			</div>
		</Block>
	);
};
