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
import React, { useCallback, useMemo, useState } from 'react';

import { useStore } from '../../store';
import { CharacterSheet, Equipment, BASIC_EQUIPMENT, BasicEquipmentType, Weapon, WeaponMode } from '../../types';
import { Button } from '../shared/Button';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';

type ItemKind = 'weapon' | 'armor' | 'shield' | 'other';

interface AddItemModalProps {
	characterId: string;
	onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ characterId, onClose }) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const character = characters.find(c => c.id === characterId);
	const sheet = character ? CharacterSheet.from(character.props) : null;
	const equipment: Equipment = sheet?.equipment ?? new Equipment();

	const [kind, setKind] = useState<ItemKind>('weapon');
	const [template, setTemplate] = useState<BasicEquipmentType | null>(null);
	const [name, setName] = useState<string>('');
	const [traits, setTraits] = useState<Trait[]>([]);

	// Weapon
	const emptyMode = () => ({ type: PrimaryWeaponType.LightMelee as PrimaryWeaponType, bonus: 0, range: 1 });
	const [weaponModes, setWeaponModes] = useState<Array<{ type: PrimaryWeaponType; bonus: number; range: number }>>([
		emptyMode(),
	]);

	// Armor
	const [armorType, setArmorType] = useState<ArmorType>(ArmorType.LightArmor);
	const [armorBonus, setArmorBonus] = useState<number>(0);
	const [armorDexPenalty, setArmorDexPenalty] = useState<number>(0);

	// Shield
	const [shieldType, setShieldType] = useState<ShieldType>(ShieldType.SmallShield);
	const [shieldBonus, setShieldBonus] = useState<number>(0);

	// Other
	const [otherDetails, setOtherDetails] = useState<string>('');

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

	// When kind or template changes, seed form values from template
	React.useEffect(() => {
		if (!template) {
			clearFields();
			return;
		}

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
	}, [template, clearFields]);

	const handleSetKind = (newKind: ItemKind) => {
		setKind(newKind);
		setTemplate(null);
		clearFields();
	};

	const addMode = () => setWeaponModes(prev => [...prev, emptyMode()]);
	const removeMode = (index: number) => setWeaponModes(prev => prev.filter((_, i) => i !== index));

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
		equipment.items.push(item);
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
					onChange={value => handleSetKind(value as ItemKind)}
				/>
				{kind !== 'other' && (
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

			<LabeledInput label='Name' value={name} onBlur={setName} />

			{kind === 'weapon' && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
					{weaponModes.map((mode, idx) => (
						<div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
							<LabeledDropdown
								variant='inline'
								label={`Mode ${idx + 1}`}
								value={mode.type}
								options={Object.values(PrimaryWeaponType)}
								onChange={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, type: val as PrimaryWeaponType } : m)))
								}
							/>
							<LabeledInput
								variant='inline'
								label='Bonus'
								value={`${mode.bonus}`}
								onBlur={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, bonus: parseInt(val) || 0 } : m)))
								}
							/>
							<LabeledInput
								variant='inline'
								label='Range'
								value={`${mode.range}`}
								onBlur={val =>
									setWeaponModes(prev => prev.map((m, i) => (i === idx ? { ...m, range: parseInt(val) || 1 } : m)))
								}
							/>
							<Button variant='inline' title='Remove' onClick={() => removeMode(idx)} />
						</div>
					))}
					<div style={{ display: 'flex' }}>
						<Button variant='inline' title='Add Mode' onClick={addMode} />
					</div>

					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox key={t} label={t} checked={traits.includes(t)} onChange={() => toggleTrait(t)} />
						))}
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
							onChange={val => setArmorType(val as ArmorType)}
						/>
						<LabeledInput label='Armor Bonus' value={`${armorBonus}`} onBlur={v => setArmorBonus(parseInt(v) || 0)} />
						<LabeledInput
							label='Dex Penalty'
							value={`${armorDexPenalty}`}
							onBlur={v => setArmorDexPenalty(parseInt(v) || 0)}
						/>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox key={t} label={t} checked={traits.includes(t)} onChange={() => toggleTrait(t)} />
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
						onChange={val => setShieldType(val as ShieldType)}
					/>
					<LabeledInput label='Shield Bonus' value={`${shieldBonus}`} onBlur={v => setShieldBonus(parseInt(v) || 0)} />
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontWeight: 'bold', marginRight: '4px' }}>Traits:</span>
						{equipmentTraits.map(t => (
							<LabeledCheckbox key={t} label={t} checked={traits.includes(t)} onChange={() => toggleTrait(t)} />
						))}
					</div>
				</div>
			)}

			{kind === 'other' && <LabeledInput label='Details' value={otherDetails} onBlur={setOtherDetails} />}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
				<Button onClick={handleCancel} title='Cancel' />
				<Button onClick={handleConfirm} title='Confirm' disabled={!isValid} />
			</div>
		</div>
	);
};
