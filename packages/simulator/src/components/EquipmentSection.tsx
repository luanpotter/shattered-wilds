import { CharacterSheet, Equipment } from '@shattered-wilds/commons';
import React from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';

import Block from './shared/Block';
import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';

interface EquipmentSectionProps {
	characterId: string;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ characterId }) => {
	const { openAddItemModal, openViewItemModal } = useModals();
	const editMode = useStore(state => state.editMode);

	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const equipment = CharacterSheet.from(character.props).equipment;

	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const onUpdateEquipment = (equipment: Equipment) => updateCharacterProp(character, 'equipment', equipment.toProp());

	const handleRemoveItem = (idx: number) => {
		equipment.items.splice(idx, 1);
		onUpdateEquipment(equipment);
	};

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Equipment</h3>
				{editMode && <Button onClick={() => openAddItemModal({ characterId })} title='Add Item' icon={FaPlus} />}
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
						onBlur={value => {
							item.name = value;
							onUpdateEquipment(equipment);
						}}
						onClick={!editMode ? () => openViewItemModal({ characterId, itemIndex: idx }) : undefined}
						disabled={!editMode}
					/>
					{editMode && (
						<>
							<Button
								onClick={() => openViewItemModal({ characterId, itemIndex: idx })}
								icon={FaEdit}
								tooltip='Edit item'
								variant='inline'
							/>
							<Button onClick={() => handleRemoveItem(idx)} icon={FaTrash} tooltip='Remove item' variant='inline' />
						</>
					)}
				</div>
			))}
		</Block>
	);
};
