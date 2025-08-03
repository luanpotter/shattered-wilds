import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import { Character, CharacterSheet, Equipment, BASIC_EQUIPMENT, BasicEquipmentType } from '../types';

import Block from './shared/Block';
import { Button } from './shared/Button';

interface EquipmentSectionProps {
	character: Character;
	onUpdateEquipment: (equipment: Equipment) => void;
	editMode: boolean;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ character, onUpdateEquipment, editMode }) => {
	const equipment = CharacterSheet.from(character.props);

	// State for the dropdown (selected predefined item)
	const [selectedItem, setSelectedItem] = useState<string>('');

	// On dropdown change, if a predefined item is selected, add it (and reset dropdown)
	const handleAddPredefinedItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const name = e.target.value as BasicEquipmentType;
		if (name && BASIC_EQUIPMENT[name]) {
			const newItem = BASIC_EQUIPMENT[name]();
			equipment.equipment.items.push(newItem);
			onUpdateEquipment(equipment.equipment);
			setSelectedItem('');
		}
	};

	const handleRemoveItem = (idx: number) => {
		equipment.equipment.items.splice(idx, 1);
		onUpdateEquipment(equipment.equipment);
	};

	const commonInputStyle: React.CSSProperties = {
		flex: 1,
		boxSizing: 'border-box' as const,
		fontSize: '0.9em',
		padding: '2px 4px',
		margin: 0,
		height: '24px',
		width: '100%',
	};

	const commonLabelStyle: React.CSSProperties = {
		fontSize: '0.9em',
		whiteSpace: 'nowrap' as const,
		flexShrink: 0,
		paddingRight: '4px',
	};

	const commonRowStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '4px',
		gap: '4px',
		width: '100%',
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
							<select
								value={selectedItem}
								onChange={handleAddPredefinedItem}
								style={{ padding: '2px 6px', fontSize: '0.9em' }}
							>
								<option value=''>Select…</option>
								{Object.keys(BASIC_EQUIPMENT).map(name => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				{equipment.equipment.items.map((item, idx) => (
					<div key={idx} style={commonRowStyle}>
						{editMode ? (
							<>
								<input
									type='text'
									value={item.name}
									onChange={e => {
										item.name = e.target.value;
										onUpdateEquipment(equipment.equipment);
									}}
									style={commonInputStyle}
									placeholder='Item name'
								/>
								<Button onClick={() => handleRemoveItem(idx)} icon={FaTrash} tooltip='Remove item' type='inline' />
							</>
						) : (
							<span style={commonLabelStyle}>{item.name}</span>
						)}
					</div>
				))}
			</div>
		</Block>
	);
};
