import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import {
	Character,
	Weapon,
	Armor,
	Shield,
	ArmorType,
	ShieldType,
	CharacterSheet,
	StatType,
	PrimaryWeaponType,
	Equipment,
	Item,
} from '../types';

import Block from './shared/Block';

// Predefined equipment (mapping from name to a factory function that returns an Item)
const predefinedEquipment: Record<string, () => Item> = {
	Javelin: () => new Weapon('Javelin', PrimaryWeaponType.Thrown, 2, [], StatType.STR, 7),
	Hatchet: () =>
		new Weapon('Hatchet', PrimaryWeaponType.LightMelee, 2, ['Thrown (Range 5m)'], StatType.DEX, 5),
	Dagger: () =>
		new Weapon(
			'Dagger',
			PrimaryWeaponType.LightMelee,
			3,
			['Concealable', 'Thrown (Range 5m)'],
			StatType.DEX,
			5
		),
	Rapier: () => new Weapon('Rapier', PrimaryWeaponType.LightMelee, 4, [], StatType.DEX),
	'Bow & Arrows': () =>
		new Weapon(
			'Bow & Arrows',
			PrimaryWeaponType.Ranged,
			4,
			['Concentrate', 'Two-Handed'],
			StatType.DEX,
			20
		),
	'Crossbow & Darts': () =>
		new Weapon(
			'Crossbow & Darts',
			PrimaryWeaponType.Ranged,
			5,
			['Concentrate', 'Two-Handed', 'Reload'],
			StatType.DEX,
			20
		),
	Spear: () =>
		new Weapon('Spear', PrimaryWeaponType.HeavyMelee, 4, ['Polearm', 'Two-Handed'], StatType.STR),
	Mace: () => new Weapon('Mace', PrimaryWeaponType.HeavyMelee, 5, [], StatType.STR),
	Longsword: () =>
		new Weapon('Longsword', PrimaryWeaponType.HeavyMelee, 6, ['Two-Handed'], StatType.STR),
	'Light Armor': () => new Armor('Light Armor', ArmorType.Light, 1, 0),
	'Medium Armor': () => new Armor('Medium Armor', ArmorType.Medium, 3, -1),
	'Heavy Armor': () => new Armor('Heavy Armor', ArmorType.Heavy, 5, -3),
	'Small Shield': () => new Shield('Small Shield', ShieldType.Small, 2, false),
	'Large Shield': () => new Shield('Large Shield', ShieldType.Large, 6, true),
};

interface EquipmentSectionProps {
	character: Character;
	onUpdateEquipment: (equipment: Equipment) => void;
	editMode: boolean;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
	character,
	onUpdateEquipment,
	editMode,
}) => {
	const equipment = CharacterSheet.from(character.props);

	// State for the dropdown (selected predefined item)
	const [selectedItem, setSelectedItem] = useState<string>('');

	// On dropdown change, if a predefined item is selected, add it (and reset dropdown)
	const handleAddPredefinedItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const name = e.target.value;
		if (name && predefinedEquipment[name]) {
			const newItem = predefinedEquipment[name]();
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
								{Object.keys(predefinedEquipment).map(name => (
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
								<button
									onClick={() => handleRemoveItem(idx)}
									style={{ padding: '2px 6px', fontSize: '0.9em' }}
								>
									<FaTrash />
								</button>
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
