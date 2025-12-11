import {
	ArcaneComponentMode,
	ArcaneSpellComponentType,
	ArmorMode,
	ArmorType,
	BASIC_EQUIPMENT,
	BasicEquipmentType,
	Bonus,
	CharacterSheet,
	Distance,
	Equipment,
	Item,
	ItemMode,
	MODE_TYPE_LABELS,
	ModeType,
	PrimaryWeaponType,
	Resource,
	ResourceCost,
	ShieldMode,
	ShieldType,
	Trait,
	WeaponMode,
} from '@shattered-wilds/commons';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';

// Form state for each mode type - use string literals that match ModeType enum values
interface WeaponModeState {
	type: 'weapon';
	weaponType: PrimaryWeaponType;
	bonus: number;
	range: number;
}

interface ArmorModeState {
	type: 'armor';
	armorType: ArmorType;
	bonus: number;
	dexPenalty: number;
}

interface ShieldModeState {
	type: 'shield';
	shieldType: ShieldType;
	bonus: number;
}

interface ArcaneModeState {
	type: 'arcane';
	component: ArcaneSpellComponentType;
	category: string;
	bonus: number;
	spCost: number;
}

type ModeState = WeaponModeState | ArmorModeState | ShieldModeState | ArcaneModeState;

// Create default states for each mode type
const createDefaultWeaponMode = (): WeaponModeState => ({
	type: 'weapon',
	weaponType: PrimaryWeaponType.LightMelee,
	bonus: 0,
	range: 1,
});

const createDefaultArmorMode = (): ArmorModeState => ({
	type: 'armor',
	armorType: ArmorType.LightArmor,
	bonus: 0,
	dexPenalty: 0,
});

const createDefaultShieldMode = (): ShieldModeState => ({
	type: 'shield',
	shieldType: ShieldType.SmallShield,
	bonus: 0,
});

const createDefaultArcaneMode = (): ArcaneModeState => ({
	type: 'arcane',
	component: ArcaneSpellComponentType.Focal,
	category: '',
	bonus: 0,
	spCost: 1,
});

// Convert domain mode to form state
const modeToState = (mode: ItemMode): ModeState => {
	if (mode instanceof WeaponMode) {
		return {
			type: 'weapon',
			weaponType: mode.type,
			bonus: mode.bonus.value,
			range: mode.range.value,
		};
	}
	if (mode instanceof ArmorMode) {
		return {
			type: 'armor',
			armorType: mode.type,
			bonus: mode.bonus.value,
			dexPenalty: mode.dexPenalty.value,
		};
	}
	if (mode instanceof ShieldMode) {
		return {
			type: 'shield',
			shieldType: mode.type,
			bonus: mode.bonus.value,
		};
	}
	if (mode instanceof ArcaneComponentMode) {
		const spCost = mode.costs.find(c => c.resource === Resource.SpiritPoint);
		return {
			type: 'arcane',
			component: mode.component,
			category: mode.category,
			bonus: mode.bonus.value,
			spCost: spCost?.amount ?? 1,
		};
	}
	// Fallback - shouldn't happen
	return createDefaultWeaponMode();
};

// Convert form state to domain mode
const stateToMode = (state: ModeState): ItemMode => {
	switch (state.type) {
		case 'weapon':
			return new WeaponMode({
				type: state.weaponType,
				bonus: Bonus.of(state.bonus),
				range: Distance.of(state.range),
			});
		case 'armor':
			return new ArmorMode({
				type: state.armorType,
				bonus: Bonus.of(state.bonus),
				dexPenalty: Bonus.of(state.dexPenalty),
			});
		case 'shield':
			return new ShieldMode({
				type: state.shieldType,
				bonus: Bonus.of(state.bonus),
				costs: [],
			});
		case 'arcane':
			return new ArcaneComponentMode({
				component: state.component,
				category: state.category || 'Arcane Component',
				bonus: Bonus.of(state.bonus),
				costs: state.spCost > 0 ? [new ResourceCost({ resource: Resource.SpiritPoint, amount: state.spCost })] : [],
			});
	}
};

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

	const [template, setTemplate] = useState<BasicEquipmentType | null>(null);
	const [name, setName] = useState<string>(() => existing?.name ?? '');
	const [traits, setTraits] = useState<Trait[]>(() => existing?.traits ?? []);
	const [modes, setModes] = useState<ModeState[]>(() =>
		existing?.modes.length ? existing.modes.map(modeToState) : [createDefaultWeaponMode()],
	);

	// For adding new modes
	const [newModeType, setNewModeType] = useState<ModeType>(ModeType.Weapon);

	// Traits
	const equipmentTraits: Trait[] = [Trait.Concealable, Trait.Reloadable, Trait.TwoHanded, Trait.Polearm];
	const toggleTrait = (t: Trait) => {
		setTraits(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
	};

	// Load from template
	useEffect(() => {
		if (typeof itemIndex === 'number') return;
		if (!template) return;

		const item = BASIC_EQUIPMENT[template].generator();
		setName(item.name);
		setTraits(item.traits);
		setModes(item.modes.length ? item.modes.map(modeToState) : [createDefaultWeaponMode()]);
	}, [template, itemIndex]);

	const didResetOnViewRef = useRef(false);

	// If switching to view mode mid-edit, reset fields to last saved data
	useEffect(() => {
		if (editMode) {
			didResetOnViewRef.current = false;
			return;
		}
		if (typeof itemIndex !== 'number') return;
		if (didResetOnViewRef.current) return;
		const current = equipment.items[itemIndex];
		if (!current) return;

		setName(current.name);
		setTraits(current.traits);
		setModes(current.modes.length ? current.modes.map(modeToState) : []);
		didResetOnViewRef.current = true;
	}, [editMode, itemIndex, equipment.items]);

	const addMode = () => {
		let newMode: ModeState;
		switch (newModeType) {
			case 'weapon':
				newMode = createDefaultWeaponMode();
				break;
			case 'armor':
				newMode = createDefaultArmorMode();
				break;
			case 'shield':
				newMode = createDefaultShieldMode();
				break;
			case 'arcane':
				newMode = createDefaultArcaneMode();
				break;
		}
		setModes(prev => [...prev, newMode]);
	};

	const removeMode = (index: number) => {
		setModes(prev => prev.filter((_, i) => i !== index));
	};

	const updateMode = <T extends ModeState>(index: number, updates: Partial<T>) => {
		setModes(prev => prev.map((m, i) => (i === index ? { ...m, ...updates } : m)));
	};

	const buildItem = (): Item => {
		const itemModes = modes.map(stateToMode);
		return new Item({ name: name || 'New Item', modes: itemModes, traits });
	};

	const isValid = useMemo(() => {
		return name.trim().length > 0 || modes.length > 0;
	}, [name, modes.length]);

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

	const renderModeEditor = (mode: ModeState, index: number): React.ReactNode => {
		switch (mode.type) {
			case ModeType.Weapon:
				return (
					<div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
						<LabeledDropdown
							variant='inline'
							label='Weapon'
							value={mode.weaponType}
							options={Object.values(PrimaryWeaponType)}
							disabled={!editMode}
							onChange={val => updateMode<WeaponModeState>(index, { weaponType: val as PrimaryWeaponType })}
						/>
						<LabeledInput
							variant='inline'
							label='Bonus'
							value={`${mode.bonus}`}
							disabled={!editMode}
							onBlur={val => updateMode<WeaponModeState>(index, { bonus: parseInt(val) || 0 })}
						/>
						<LabeledInput
							variant='inline'
							label='Range'
							value={`${mode.range}`}
							disabled={!editMode}
							onBlur={val => updateMode<WeaponModeState>(index, { range: parseInt(val) || 1 })}
						/>
						{editMode && <Button variant='inline' title='Remove' onClick={() => removeMode(index)} />}
					</div>
				);
			case ModeType.Armor:
				return (
					<div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
						<LabeledDropdown
							variant='inline'
							label='Armor'
							value={mode.armorType}
							options={Object.values(ArmorType)}
							disabled={!editMode}
							onChange={val => updateMode<ArmorModeState>(index, { armorType: val as ArmorType })}
						/>
						<LabeledInput
							variant='inline'
							label='Bonus'
							value={`${mode.bonus}`}
							disabled={!editMode}
							onBlur={val => updateMode<ArmorModeState>(index, { bonus: parseInt(val) || 0 })}
						/>
						<LabeledInput
							variant='inline'
							label='DEX Penalty'
							value={`${mode.dexPenalty}`}
							disabled={!editMode}
							onBlur={val => updateMode<ArmorModeState>(index, { dexPenalty: parseInt(val) || 0 })}
						/>
						{editMode && <Button variant='inline' title='Remove' onClick={() => removeMode(index)} />}
					</div>
				);
			case ModeType.Shield:
				return (
					<div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
						<LabeledDropdown
							variant='inline'
							label='Shield'
							value={mode.shieldType}
							options={Object.values(ShieldType)}
							disabled={!editMode}
							onChange={val => updateMode<ShieldModeState>(index, { shieldType: val as ShieldType })}
						/>
						<LabeledInput
							variant='inline'
							label='Bonus'
							value={`${mode.bonus}`}
							disabled={!editMode}
							onBlur={val => updateMode<ShieldModeState>(index, { bonus: parseInt(val) || 0 })}
						/>
						{editMode && <Button variant='inline' title='Remove' onClick={() => removeMode(index)} />}
					</div>
				);
			case ModeType.Arcane:
				return (
					<div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
						<LabeledDropdown
							variant='inline'
							label='Arcane'
							value={mode.component}
							options={Object.values(ArcaneSpellComponentType)}
							disabled={!editMode}
							onChange={val => updateMode<ArcaneModeState>(index, { component: val as ArcaneSpellComponentType })}
						/>
						<LabeledInput
							variant='inline'
							label='Bonus'
							value={`${mode.bonus}`}
							disabled={!editMode}
							onBlur={val => updateMode<ArcaneModeState>(index, { bonus: parseInt(val) || 0 })}
						/>
						<LabeledInput
							variant='inline'
							label='SP Cost'
							value={`${mode.spCost}`}
							disabled={!editMode}
							onBlur={val => updateMode<ArcaneModeState>(index, { spCost: parseInt(val) || 0 })}
						/>
						<LabeledInput
							variant='inline'
							label='Category'
							value={mode.category}
							disabled={!editMode}
							onBlur={val => updateMode<ArcaneModeState>(index, { category: val })}
						/>
						{editMode && <Button variant='inline' title='Remove' onClick={() => removeMode(index)} />}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
			{typeof itemIndex !== 'number' && (
				<LabeledDropdown
					label='Template (optional)'
					value={template}
					options={Object.values(BasicEquipmentType)}
					describe={t => t}
					placeholder='Start from scratch'
					onChange={setTemplate}
				/>
			)}

			<LabeledInput label='Name' value={name} onBlur={setName} disabled={!editMode} />

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

			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
				<span style={{ fontWeight: 'bold' }}>Modes:</span>
				{modes.map((mode, idx) => renderModeEditor(mode, idx))}
				{editMode && (
					<div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
						<LabeledDropdown
							variant='inline'
							label='Add'
							value={newModeType}
							options={Object.values(ModeType)}
							describe={t => MODE_TYPE_LABELS[t]}
							onChange={val => setNewModeType(val as ModeType)}
						/>
						<Button variant='inline' title='Add Mode' onClick={addMode} />
					</div>
				)}
			</div>

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
