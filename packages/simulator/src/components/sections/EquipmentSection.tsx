import { CharacterSheet, Equipment, SlotType } from '@shattered-wilds/commons';
import React from 'react';
import { IconType } from 'react-icons';
import {
	FaArrowDown,
	FaArrowUp,
	FaBox,
	FaChild,
	FaEdit,
	FaPlus,
	FaQuestionCircle,
	FaRing,
	FaTrash,
} from 'react-icons/fa';
import { FaHandBackFist, FaHandHoldingHand } from 'react-icons/fa6';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { semanticClick } from '../../utils';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import LabeledInput from '../shared/LabeledInput';

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

	const handleMoveItem = ({ itemIndex, delta }: { itemIndex: number; delta: number }) => {
		const newIndex = itemIndex + delta;
		if (newIndex < 0 || newIndex >= equipment.items.length) {
			return;
		}
		const [item] = equipment.items.splice(itemIndex, 1);
		equipment.items.splice(newIndex, 0, item);
		onUpdateEquipment(equipment);
	};

	const toggleIsEquipped = (idx: number) => {
		const item = equipment.items[idx];
		item.isEquipped = !item.isEquipped;
		console.log(equipment);
		onUpdateEquipment(equipment);
	};

	const slotTypeToIcon = (slotType: SlotType): IconType => {
		switch (slotType) {
			case SlotType.Armor:
				return FaChild;
			case SlotType.OneHand:
				return FaHandBackFist;
			case SlotType.TwoHands:
				return FaHandHoldingHand;
			case SlotType.Free:
				return FaRing;
			case SlotType.None:
				return FaBox;
			case undefined:
				return FaQuestionCircle;
		}
	};

	const slotTypeIcon = (slotType: SlotType, isEquipped: boolean, onClick?: () => void): React.JSX.Element => {
		const Icon = slotTypeToIcon(slotType);
		const tooltip = `${slotType}${slotType == SlotType.None ? '' : isEquipped ? ' (equipped)' : ' (not equipped)'}`;
		const style = {
			opacity: isEquipped ? '1' : '0.25',
			cursor: onClick ? 'pointer' : 'default',
		};
		return <Icon style={style} title={tooltip} {...(onClick ? semanticClick('button', onClick) : {})} />;
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
					{slotTypeIcon(item.slot, item.isEquipped, () => toggleIsEquipped(idx))}
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
								onClick={() => handleMoveItem({ itemIndex: idx, delta: 1 })}
								icon={FaArrowDown}
								tooltip='Move down'
								variant='inline'
								disabled={idx === equipment.items.length - 1}
							/>
							<Button
								onClick={() => handleMoveItem({ itemIndex: idx, delta: -1 })}
								icon={FaArrowUp}
								tooltip='Move up'
								variant='inline'
								disabled={idx === 0}
							/>
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
