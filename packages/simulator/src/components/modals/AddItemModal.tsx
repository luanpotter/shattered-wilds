import {
	Armor,
	ArmorType,
	Bonus,
	Distance,
	OtherItem,
	PrimaryWeaponType,
	Shield,
	ShieldType,
	Trait,
} from '@shattered-wilds/commons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useStore } from '../../store';
import { CharacterSheet, Equipment, BASIC_EQUIPMENT, BasicEquipmentType, Weapon, WeaponMode } from '../../types';
import { Button } from '../shared/Button';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';

type ItemKind = 'weapon' | 'armor' | 'shield' | 'other';

interface AddItemModalProps {
	characterId: string;
	itemIndex: number | undefined;
	onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ characterId, itemIndex, onClose }) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const editMode = useStore(state => state.editMode);

	const character = characters.find(c => c.id === characterId);
	const sheet = character ? CharacterSheet.from(character.props) : null;
	const equipment: Equipment = sheet?.equipment ?? new Equipment();

	// Editing/viewing existing item? Derive initial values from it once
	const existing = typeof itemIndex === 'number' ? equipment.items[itemIndex] : undefined;

	const [kind, setKind] = useState<ItemKind>(() => {
		if (existing instanceof Weapon) return 'weapon';
		if (existing instanceof Armor) return 'armor';
		if (existing instanceof Shield) return 'shield';
		if (existing instanceof OtherItem) return 'other';
		return 'weapon';
	});
	const [template, setTemplate] = useState<BasicEquipmentType | null>(null);
	const [name, setName] = useState<string>(() => (existing ? existing.name : ''));
	const [traits, setTraits] = useState<Trait[]>(() =>
		existing && !(existing instanceof OtherItem) ? existing.traits : [],
	);

	// Weapon
	const emptyMode = () => ({ type: PrimaryWeaponType.LightMelee as PrimaryWeaponType, bonus: 0, range: 1 });
	const [weaponModes, setWeaponModes] = useState<Array<{ type: PrimaryWeaponType; bonus: number; range: number }>>(
		() =>
			existing instanceof Weapon
				? existing.modes.map(m => ({ type: m.type, bonus: m.bonus.value, range: m.range.value }))
				: [emptyMode()],
	);

	// Armor
	const [armorType, setArmorType] = useState<ArmorType>(
		existing instanceof Armor ? existing.type : ArmorType.LightArmor,
	);
	const [armorBonus, setArmorBonus] = useState<number>(existing instanceof Armor ? existing.bonus.value : 0);
	const [armorDexPenalty, setArmorDexPenalty] = useState<number>(
		existing instanceof Armor ? existing.dexPenalty.value : 0,
	);

	// Shield
	const [shieldType, setShieldType] = useState<ShieldType>(
		existing instanceof Shield ? existing.type : ShieldType.SmallShield,
	);
	const [shieldBonus, setShieldBonus] = useState<number>(existing instanceof Shield ? existing.bonus.value : 0);

	// Other
	const [otherDetails, setOtherDetails] = useState<string>(
		existing instanceof OtherItem ? (existing.details ?? '') : '',
	);

	// Traits
	const equipmentTraits: Trait[] = [Trait.Concealable, Trait.Reloadable, Trait.TwoHanded, Trait.Polearm];
	const toggleTrait = (t: Trait) => {
		setTraits(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
	};

	const templatesForKind = useMemo(() => {
		return Object.values(BasicEquipmentType).filter(key => {
			const item = BASIC_EQUIPMENT[key].generator();
			if (kind === 'weapon') return item instanceof Weapon;
			if (kind === 'armor') return item instanceof Armor;
			if (kind === 'shield') return item instanceof Shield;
			return false;
		});
	}, [kind]);

	const clearFields = useCallback(() => {
		setName('');
		setTraits([]);
		setWeaponModes([emptyMode()]);
		setArmorType(ArmorType.LightArmor);
		setArmorBonus(0);
		setArmorDexPenalty(0);
		setShieldType(ShieldType.SmallShield);
		setShieldBonus(0);
		setOtherDetails('');
	}, []);

	useEffect(() => {
		if (typeof itemIndex === 'number') return;
		if (!template) return;

		const item = BASIC_EQUIPMENT[template].generator(); // fresh instance to avoid mutating templates
		if (item instanceof Weapon) {
			setKind('weapon');
			setName(item.name);
			setTraits(item.traits);
			setWeaponModes(item.modes.map(m => ({ type: m.type, bonus: m.bonus.value, range: m.range.value })));
		} else if (item instanceof Armor) {
			setKind('armor');
			setName(item.name);
			setTraits(item.traits);
			setArmorType(item.type);
			setArmorBonus(item.bonus.value);
			setArmorDexPenalty(item.dexPenalty.value);
		} else if (item instanceof Shield) {
			setKind('shield');
			setName(item.name);
			setTraits(item.traits);
			setShieldType(item.type);
			setShieldBonus(item.bonus.value);
		}
	}, [template, itemIndex]);

	const handleSetKind = (newKind: ItemKind) => {
		setKind(newKind);
		setTemplate(null);
		clearFields();
	};

	const addMode = () => setWeaponModes(prev => [...prev, emptyMode()]);
	const didResetOnViewRef = useRef(false);
	const removeMode = (index: number) => setWeaponModes(prev => prev.filter((_, i) => i !== index));

	// If switching to view mode mid-edit, reset fields to last saved data (only once per switch)
	useEffect(() => {
		if (editMode) {
			didResetOnViewRef.current = false;
			return;
		}
		if (typeof itemIndex !== 'number') return;
		if (didResetOnViewRef.current) return;
		const current = equipment.items[itemIndex];
		if (!current) return;
		// Reset to persisted item values
		setName(current.name);
		if (current instanceof Weapon) {
			setKind('weapon');
			setTraits(current.traits);
			setWeaponModes(current.modes.map(m => ({ type: m.type, bonus: m.bonus.value, range: m.range.value })));
		} else if (current instanceof Armor) {
			setKind('armor');
			setTraits(current.traits);
			setArmorType(current.type);
			setArmorBonus(current.bonus.value);
			setArmorDexPenalty(current.dexPenalty.value);
		} else if (current instanceof Shield) {
			setKind('shield');
			setTraits(current.traits);
			setShieldType(current.type);
			setShieldBonus(current.bonus.value);
		} else if (current instanceof OtherItem) {
			setKind('other');
			setOtherDetails(current.details ?? '');
		}
		didResetOnViewRef.current = true;
	}, [editMode, itemIndex, equipment.items]);

	const buildItem = () => {
		if (kind === 'weapon') {
			const modesFinal = weaponModes.map(
				m => new WeaponMode({ type: m.type, bonus: Bonus.of(m.bonus), range: Distance.of(m.range) }),
			);
			return new Weapon({ name: name || 'Unnamed Weapon', modes: modesFinal, traits });
		}
		if (kind === 'armor') {
			return new Armor({
				name: name || 'Unnamed Armor',
				type: armorType,
				bonus: Bonus.of(armorBonus),
				dexPenalty: Bonus.of(armorDexPenalty),
				traits,
			});
		}
		if (kind === 'shield') {
			return new Shield({ name: name || 'Unnamed Shield', type: shieldType, bonus: Bonus.of(shieldBonus), traits });
		}
		return new OtherItem({ name: name || 'New Item', details: otherDetails || undefined });
	};

	const isValid = useMemo(() => {
		if (!name && kind !== 'other') return false;
		if (kind === 'weapon') return weaponModes.length > 0;
		return true;
	}, [name, kind, weaponModes.length]);

	const handleConfirm = () => {
		const item = buildItem();
		if (typeof itemIndex === 'number') {
			equipment.items[itemIndex] = item;
		} else {
			equipment.items.push(item);
		}
		if (character) {
			updateCharacterProp(character, 'equipment', equipment.toProp());
		}
		onClose();
	};

	const handleCancel = () => {
		onClose();
	};

	return (
		<div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<div style={{ display: 'flex', gap: '8px' }}>
				<LabeledDropdown
					label='Item Type'
					value={kind}
					options={['weapon', 'armor', 'shield', 'other'] as const}
					describe={k => ({ weapon: 'Weapon', armor: 'Armor', shield: 'Shield', other: 'Other' })[k]}
					disabled={!editMode}
					onChange={value => handleSetKind(value as ItemKind)}
				/>
				{kind !== 'other' && typeof itemIndex !== 'number' && (
					<LabeledDropdown
						label='Template (optional)'
						value={template}
						options={templatesForKind}
						describe={t => t}
						placeholder='Start from scratch'
						onChange={setTemplate}
					/>
				)}
			</div>

			<LabeledInput label='Name' value={name} onBlur={setName} disabled={!editMode} />

			{kind === 'weapon' && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
					{/* Traits above modes */}
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox
								key={t}
								label={String(t)}
								checked={traits.includes(t)}
								disabled={!editMode}
								onChange={() => toggleTrait(t)}
							/>
						))}
					</div>

					{weaponModes.map((mode, idx) => (
						<div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
							<LabeledDropdown
								variant='inline'
								label={`Mode ${idx + 1}`}
								value={mode.type}
								options={Object.values(PrimaryWeaponType)}
								disabled={!editMode}
								onChange={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, type: val as PrimaryWeaponType } : m)))
								}
							/>
							<LabeledInput
								variant='inline'
								label='Bonus'
								value={`${mode.bonus}`}
								disabled={!editMode}
								onBlur={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, bonus: parseInt(val) || 0 } : m)))
								}
							/>
							<LabeledInput
								variant='inline'
								label='Range'
								value={`${mode.range}`}
								disabled={!editMode}
								onBlur={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, range: parseInt(val) || 1 } : m)))
								}
							/>
							<Button variant='inline' title='Remove' onClick={() => removeMode(idx)} disabled={!editMode} />
						</div>
					))}
					<div style={{ display: 'flex', justifyContent: 'center' }}>
						<Button variant='inline' title='Add Mode' onClick={addMode} disabled={!editMode} />
					</div>
				</div>
			)}

			{kind === 'armor' && (
				<div>
					<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
						<LabeledDropdown
							label='Armor Type'
							value={armorType}
							options={Object.values(ArmorType)}
							disabled={!editMode}
							onChange={val => setArmorType(val as ArmorType)}
						/>
						<LabeledInput
							label='Armor Bonus'
							value={`${armorBonus}`}
							onBlur={v => setArmorBonus(parseInt(v) || 0)}
							disabled={!editMode}
						/>
						<LabeledInput
							label='Dex Penalty'
							value={`${armorDexPenalty}`}
							onBlur={v => setArmorDexPenalty(parseInt(v) || 0)}
							disabled={!editMode}
						/>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox
								key={t}
								label={String(t)}
								checked={traits.includes(t)}
								disabled={!editMode}
								onChange={() => toggleTrait(t)}
							/>
						))}
					</div>
				</div>
			)}

			{kind === 'shield' && (
				<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
					<LabeledDropdown
						label='Shield Type'
						value={shieldType}
						options={Object.values(ShieldType)}
						disabled={!editMode}
						onChange={val => setShieldType(val as ShieldType)}
					/>
					<LabeledInput
						label='Shield Bonus'
						value={`${shieldBonus}`}
						onBlur={v => setShieldBonus(parseInt(v) || 0)}
						disabled={!editMode}
					/>
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox
								key={t}
								label={String(t)}
								checked={traits.includes(t)}
								disabled={!editMode}
								onChange={() => toggleTrait(t)}
							/>
						))}
					</div>
				</div>
			)}

			{kind === 'other' && (
				<LabeledInput label='Details' value={otherDetails} onBlur={setOtherDetails} disabled={!editMode} />
			)}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
				{editMode ? (
					<>
						<Button onClick={handleCancel} title='Cancel' />
						<Button onClick={handleConfirm} title='Confirm' disabled={!isValid} />
					</>
				) : (
					<Button onClick={handleCancel} title='Close' />
				)}
			</div>
		</div>
	);
};
