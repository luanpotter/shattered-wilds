import {
	ArcaneComponentMode,
	ArcaneSpellComponentType,
	ArmorMode,
	ArmorType,
	Bonus,
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
	TraitTarget,
	TRAITS,
	WeaponMode,
	SlotType,
} from '@shattered-wilds/d12';
import { createHandlebarsApplicationBase, getActorById, showNotification } from '../foundry-shim.js';
import { parseCharacterProps } from '../helpers/character.js';
import { updateActorProps } from '../helpers/resources.js';
import { confirmAction } from './modals.js';
import { isEnumValue } from '@shattered-wilds/commons';

// =============================================================================
// Type Definitions
// =============================================================================

const MODE_TYPE_VALUES = Object.values(ModeType) as ModeType[];

// Form state for each mode type - use string literals that match ModeType enum values
type WeaponModeFormState = {
	modeType: 'weapon';
	type: PrimaryWeaponType;
	bonus: string;
	range: string;
};

type ArmorModeFormState = {
	modeType: 'armor';
	type: ArmorType;
	bonus: string;
	dexPenalty: string;
};

type ShieldModeFormState = {
	modeType: 'shield';
	type: ShieldType;
	bonus: string;
};

type ArcaneComponentModeFormState = {
	modeType: 'arcane';
	componentType: ArcaneSpellComponentType;
	category: string;
	bonus: string;
	spCost: string;
};

type ModeFormState = WeaponModeFormState | ArmorModeFormState | ShieldModeFormState | ArcaneComponentModeFormState;

type EquipmentFormState = {
	name: string;
	slot: SlotType;
	traits: Trait[];
	modes: ModeFormState[];
};

type ValidationResult = {
	valid: boolean;
	errors: string[];
};

// =============================================================================
// Constants
// =============================================================================

const PRIMARY_WEAPON_TYPE_VALUES = Object.values(PrimaryWeaponType) as PrimaryWeaponType[];
const ARMOR_TYPE_VALUES = Object.values(ArmorType) as ArmorType[];
const SHIELD_TYPE_VALUES = Object.values(ShieldType) as ShieldType[];
const ARCANE_COMPONENT_TYPE_VALUES = Object.values(ArcaneSpellComponentType) as ArcaneSpellComponentType[];

const EQUIPMENT_TRAITS = (Object.values(Trait) as Trait[]).filter(
	trait => TRAITS[trait]?.target === TraitTarget.Equipment,
);
const EQUIPMENT_TRAIT_SET = new Set<Trait>(EQUIPMENT_TRAITS);

const PRIMARY_WEAPON_TYPE_OPTIONS = PRIMARY_WEAPON_TYPE_VALUES.map(value => ({ value, label: value }));
const ARMOR_TYPE_OPTIONS = ARMOR_TYPE_VALUES.map(value => ({ value, label: value }));
const SHIELD_TYPE_OPTIONS = SHIELD_TYPE_VALUES.map(value => ({ value, label: value }));
const ARCANE_COMPONENT_TYPE_OPTIONS = ARCANE_COMPONENT_TYPE_VALUES.map(value => ({ value, label: value }));

// =============================================================================
// Type Guards
// =============================================================================

function isModeType(value: string): value is ModeType {
	return MODE_TYPE_VALUES.includes(value as ModeType);
}

function isPrimaryWeaponType(value: string): value is PrimaryWeaponType {
	return PRIMARY_WEAPON_TYPE_VALUES.includes(value as PrimaryWeaponType);
}

function isArmorType(value: string): value is ArmorType {
	return ARMOR_TYPE_VALUES.includes(value as ArmorType);
}

function isShieldType(value: string): value is ShieldType {
	return SHIELD_TYPE_VALUES.includes(value as ShieldType);
}

function isArcaneComponentType(value: string): value is ArcaneSpellComponentType {
	return ARCANE_COMPONENT_TYPE_VALUES.includes(value as ArcaneSpellComponentType);
}

function isEquipmentTrait(value: string): value is Trait {
	return EQUIPMENT_TRAIT_SET.has(value as Trait);
}

// =============================================================================
// State Creation
// =============================================================================

function createDefaultModeState(modeType: ModeType): ModeFormState {
	switch (modeType) {
		case ModeType.Weapon:
			return {
				modeType: 'weapon',
				type: PrimaryWeaponType.LightMelee,
				bonus: '0',
				range: '1',
			};
		case ModeType.Armor:
			return {
				modeType: 'armor',
				type: ArmorType.LightArmor,
				bonus: '0',
				dexPenalty: '0',
			};
		case ModeType.Shield:
			return {
				modeType: 'shield',
				type: ShieldType.SmallShield,
				bonus: '0',
			};
		case ModeType.Arcane:
			return {
				modeType: 'arcane',
				componentType: ArcaneSpellComponentType.Focal,
				category: '',
				bonus: '0',
				spCost: '0',
			};
	}
}

function createDefaultState(name = ''): EquipmentFormState {
	return {
		name,
		slot: SlotType.None,
		traits: [],
		modes: [createDefaultModeState(ModeType.Weapon)],
	};
}

/**
 * Convert a domain ItemMode to form state
 */
function modeToFormState(mode: ItemMode): ModeFormState {
	if (mode instanceof WeaponMode) {
		return {
			modeType: 'weapon',
			type: mode.type,
			bonus: mode.bonus.value.toString(),
			range: mode.range?.value?.toString() ?? '1',
		};
	}
	if (mode instanceof ArmorMode) {
		return {
			modeType: 'armor',
			type: mode.type,
			bonus: mode.bonus.value.toString(),
			dexPenalty: mode.dexPenalty.value.toString(),
		};
	}
	if (mode instanceof ShieldMode) {
		return {
			modeType: 'shield',
			type: mode.type,
			bonus: mode.bonus.value.toString(),
		};
	}
	if (mode instanceof ArcaneComponentMode) {
		const spCost = mode.costs.find(c => c.resource === Resource.SpiritPoint)?.amount ?? 0;
		return {
			modeType: 'arcane',
			componentType: mode.component,
			category: mode.category,
			bonus: mode.bonus.value.toString(),
			spCost: spCost.toString(),
		};
	}
	// Fallback - should never happen
	return createDefaultModeState(ModeType.Weapon);
}

function createStateFromItem(item: Item): EquipmentFormState {
	return {
		name: item.name,
		slot: item.slot,
		traits: [...item.traits],
		modes: item.modes.length > 0 ? item.modes.map(modeToFormState) : [createDefaultModeState(ModeType.Weapon)],
	};
}

// =============================================================================
// Modal Implementation
// =============================================================================

const HandlebarsAppBase = createHandlebarsApplicationBase();

interface EquipmentEditorModalInternalOptions {
	actorId: string;
	mode: 'create' | 'edit';
	itemIndex?: number;
	initialState: EquipmentFormState;
	onUpdate?: () => void;
}

class EquipmentEditorModalImpl extends HandlebarsAppBase {
	#options: EquipmentEditorModalInternalOptions;
	#state: EquipmentFormState;
	#submitAttempted = false;
	#submissionError: string | null = null;
	#boundRoot: HTMLElement | null = null;
	private readonly handleClickBound = (event: Event) => this.handleClick(event);
	private readonly handleInputBound = (event: Event) => this.handleInput(event);
	private readonly handleChangeBound = (event: Event) => this.handleChange(event);

	constructor(options: EquipmentEditorModalInternalOptions) {
		super({
			window: {
				title: options.mode === 'edit' ? 'Edit Equipment Item' : 'Add Equipment Item',
			},
			width: 560,
			height: 'auto',
			resizable: true,
			classes: ['sw-equipment-editor-app'],
		});
		this.#options = options;
		this.#state = options.initialState;
	}

	static override get DEFAULT_OPTIONS() {
		return {
			id: 'sw-equipment-editor-modal',
			template: 'systems/shattered-wilds/templates/equipment/equipment-editor-modal.html',
		};
	}

	static get PARTS() {
		return {
			content: { template: 'systems/shattered-wilds/templates/equipment/equipment-editor-modal.html' },
		};
	}

	override async _prepareContext(): Promise<Record<string, unknown>> {
		const state = this.#state;
		const validation = this.validateState(state);
		const showValidation = this.#submitAttempted && !validation.valid;

		const traitOptions = EQUIPMENT_TRAITS.map(trait => ({
			value: trait,
			label: trait,
			checked: state.traits.includes(trait),
		}));

		// Build modes list for template - each mode knows its own type
		const modes = state.modes.map((mode, index) => {
			const baseModeData = {
				index,
				modeType: mode.modeType,
				modeTypeLabel: MODE_TYPE_LABELS[mode.modeType as ModeType],
				isWeapon: mode.modeType === 'weapon',
				isArmor: mode.modeType === 'armor',
				isShield: mode.modeType === 'shield',
				isArcane: mode.modeType === 'arcane',
			};

			switch (mode.modeType) {
				case 'weapon':
					return {
						...baseModeData,
						bonus: mode.bonus,
						range: mode.range,
						typeOptions: PRIMARY_WEAPON_TYPE_OPTIONS.map(option => ({
							value: option.value,
							label: option.label,
							selected: option.value === mode.type,
						})),
					};
				case 'armor':
					return {
						...baseModeData,
						bonus: mode.bonus,
						dexPenalty: mode.dexPenalty,
						typeOptions: ARMOR_TYPE_OPTIONS.map(option => ({
							value: option.value,
							label: option.label,
							selected: option.value === mode.type,
						})),
					};
				case 'shield':
					return {
						...baseModeData,
						bonus: mode.bonus,
						typeOptions: SHIELD_TYPE_OPTIONS.map(option => ({
							value: option.value,
							label: option.label,
							selected: option.value === mode.type,
						})),
					};
				case 'arcane':
					return {
						...baseModeData,
						category: mode.category,
						bonus: mode.bonus,
						spCost: mode.spCost,
						componentTypeOptions: ARCANE_COMPONENT_TYPE_OPTIONS.map(option => ({
							value: option.value,
							label: option.label,
							selected: option.value === mode.componentType,
						})),
					};
				default:
					return baseModeData;
			}
		});

		// Mode type options for the "Add Mode" dropdown
		const modeTypeOptions = MODE_TYPE_VALUES.map(value => ({
			value,
			label: MODE_TYPE_LABELS[value],
		}));

		const slotTypeOptions = Object.values(SlotType).map(value => ({
			value,
			label: value,
			selected: value === state.slot,
		}));

		return {
			mode: this.#options.mode,
			isEditMode: this.#options.mode === 'edit',
			name: state.name,
			hasTraits: true,
			traitOptions,
			modes,
			hasModes: modes.length > 0,
			modeTypeOptions,
			slotTypeOptions,
			canSubmit: validation.valid,
			submitLabel: this.#options.mode === 'edit' ? 'Save Item' : 'Add Item',
			canDelete: this.#options.mode === 'edit',
			validationMessage: showValidation ? validation.errors[0] : null,
			submissionError: this.#submissionError,
		};
	}

	override async _onRender(): Promise<void> {
		const root = this.element;
		if (!root) return;
		this.bindRootEvents(root);
		this.refreshSubmissionUI();
	}

	private bindRootEvents(root: HTMLElement): void {
		if (this.#boundRoot === root) {
			return;
		}

		if (this.#boundRoot) {
			this.#boundRoot.removeEventListener('click', this.handleClickBound);
			this.#boundRoot.removeEventListener('input', this.handleInputBound);
			this.#boundRoot.removeEventListener('change', this.handleChangeBound);
		}

		root.addEventListener('click', this.handleClickBound);
		root.addEventListener('input', this.handleInputBound);
		root.addEventListener('change', this.handleChangeBound);
		this.#boundRoot = root;
	}

	private handleClick(event: Event): void {
		const target = event.target as HTMLElement | null;
		if (!target) return;

		const actionElement = target.closest<HTMLElement>('[data-action]');
		if (!actionElement) return;

		const action = actionElement.dataset.action;
		const modeIndex = parseInt(actionElement.dataset.modeIndex ?? '-1', 10);

		switch (action) {
			case 'add-mode':
				event.preventDefault();
				this.addMode();
				break;
			case 'remove-mode':
				event.preventDefault();
				this.removeMode(modeIndex);
				break;
			case 'submit':
				event.preventDefault();
				void this.handleSubmit();
				break;
			case 'cancel':
				event.preventDefault();
				void this.close();
				break;
			case 'delete':
				event.preventDefault();
				void this.handleDelete();
				break;
			default:
				break;
		}
	}

	private handleInput(event: Event): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
			return;
		}

		if (target.type === 'checkbox') {
			return;
		}

		if (target.dataset.modeField) {
			this.updateModeField(parseInt(target.dataset.modeIndex ?? '-1', 10), target.dataset.modeField, target.value);
			return;
		}

		if (target.dataset.field) {
			this.updateField(target.dataset.field, target.value);
		}
	}

	private handleChange(event: Event): void {
		const target = event.target;
		if (target instanceof HTMLSelectElement) {
			if (target.dataset.field === 'newModeType') {
				// Just store the selected mode type for the next "add mode" action
				return;
			}

			if (target.dataset.field) {
				this.updateField(target.dataset.field, target.value);
				return;
			}

			if (target.dataset.modeField) {
				this.updateModeField(parseInt(target.dataset.modeIndex ?? '-1', 10), target.dataset.modeField, target.value);
			}
			return;
		}

		if (target instanceof HTMLInputElement) {
			if (target.type === 'checkbox' && target.dataset.trait) {
				this.toggleTrait(target.dataset.trait, target.checked);
				return;
			}

			if (target.dataset.field) {
				this.updateField(target.dataset.field, target.value);
				return;
			}

			if (target.dataset.modeField) {
				this.updateModeField(parseInt(target.dataset.modeIndex ?? '-1', 10), target.dataset.modeField, target.value);
			}
		}
	}

	private updateField(field: string, rawValue: string): void {
		const value = rawValue ?? '';

		switch (field) {
			case 'name':
				this.#state = { ...this.#state, name: value };
				break;
			case 'slot':
				if (isEnumValue(SlotType)(value)) {
					this.#state = { ...this.#state, slot: value };
				} else {
					console.error(`Invalid slot type selected: ${value}`);
				}
				break;
			default:
				break;
		}

		this.#submissionError = null;
		this.refreshSubmissionUI();
	}

	private updateModeField(index: number, field: string | undefined, rawValue: string): void {
		if (field === undefined || Number.isNaN(index) || index < 0) {
			return;
		}

		const mode = this.#state.modes[index];
		if (!mode) return;

		const updatedModes = [...this.#state.modes];

		switch (mode.modeType) {
			case 'weapon': {
				const weaponMode = mode as WeaponModeFormState;
				switch (field) {
					case 'type':
						if (isPrimaryWeaponType(rawValue)) {
							updatedModes[index] = { ...weaponMode, type: rawValue };
						}
						break;
					case 'bonus':
						updatedModes[index] = { ...weaponMode, bonus: rawValue };
						break;
					case 'range':
						updatedModes[index] = { ...weaponMode, range: rawValue };
						break;
				}
				break;
			}
			case 'armor': {
				const armorMode = mode as ArmorModeFormState;
				switch (field) {
					case 'type':
						if (isArmorType(rawValue)) {
							updatedModes[index] = { ...armorMode, type: rawValue };
						}
						break;
					case 'bonus':
						updatedModes[index] = { ...armorMode, bonus: rawValue };
						break;
					case 'dexPenalty':
						updatedModes[index] = { ...armorMode, dexPenalty: rawValue };
						break;
				}
				break;
			}
			case 'shield': {
				const shieldMode = mode as ShieldModeFormState;
				switch (field) {
					case 'type':
						if (isShieldType(rawValue)) {
							updatedModes[index] = { ...shieldMode, type: rawValue };
						}
						break;
					case 'bonus':
						updatedModes[index] = { ...shieldMode, bonus: rawValue };
						break;
				}
				break;
			}
			case 'arcane': {
				const arcaneMode = mode as ArcaneComponentModeFormState;
				switch (field) {
					case 'componentType':
						if (isArcaneComponentType(rawValue)) {
							updatedModes[index] = { ...arcaneMode, componentType: rawValue };
						}
						break;
					case 'category':
						updatedModes[index] = { ...arcaneMode, category: rawValue };
						break;
					case 'bonus':
						updatedModes[index] = { ...arcaneMode, bonus: rawValue };
						break;
					case 'spCost':
						updatedModes[index] = { ...arcaneMode, spCost: rawValue };
						break;
				}
				break;
			}
		}

		this.#state = { ...this.#state, modes: updatedModes };
		this.#submissionError = null;
		this.refreshSubmissionUI();
	}

	private addMode(modeType?: ModeType): void {
		// Get the mode type from the dropdown if not provided
		const root = this.element;
		if (!modeType && root) {
			const modeTypeSelect = root.querySelector<HTMLSelectElement>('[data-field="newModeType"]');
			const selectedValue = modeTypeSelect?.value;
			if (selectedValue && isModeType(selectedValue)) {
				modeType = selectedValue as ModeType;
			}
		}

		// Default to weapon if still not set
		if (!modeType) {
			modeType = ModeType.Weapon;
		}

		const newMode = createDefaultModeState(modeType);
		const nextModes = [...this.#state.modes, newMode];
		this.#state = { ...this.#state, modes: nextModes };

		void this.render(false);
	}

	private removeMode(index: number): void {
		if (Number.isNaN(index) || index < 0) {
			return;
		}

		// Items can have no modes (becomes "other" type item)
		const nextModes = this.#state.modes.filter((_, idx) => idx !== index);
		this.#state = { ...this.#state, modes: nextModes };

		void this.render(false);
	}

	private toggleTrait(traitValue: string, isChecked: boolean): void {
		if (!isEquipmentTrait(traitValue)) {
			return;
		}

		const traitSet = new Set(this.#state.traits);
		if (isChecked) {
			traitSet.add(traitValue);
		} else {
			traitSet.delete(traitValue);
		}

		this.#state = { ...this.#state, traits: Array.from(traitSet) };
		this.refreshSubmissionUI();
	}

	private validateState(state: EquipmentFormState): ValidationResult {
		const errors: string[] = [];
		if (!state.name.trim()) {
			errors.push('Name is required.');
		}

		// Validate each mode based on its type
		state.modes.forEach((mode, idx) => {
			const modeLabel = MODE_TYPE_LABELS[mode.modeType as ModeType];
			switch (mode.modeType) {
				case 'weapon': {
					if (!mode.bonus.trim() || Number.isNaN(Number.parseInt(mode.bonus, 10))) {
						errors.push(`${modeLabel} mode ${idx + 1} needs a valid bonus.`);
					}
					if (mode.range.trim()) {
						const parsedRange = Number.parseInt(mode.range, 10);
						if (Number.isNaN(parsedRange) || parsedRange < 1) {
							errors.push(`${modeLabel} mode ${idx + 1} needs a range of 1 or greater.`);
						}
					}
					break;
				}
				case 'armor': {
					if (!mode.bonus.trim() || Number.isNaN(Number.parseInt(mode.bonus, 10))) {
						errors.push(`${modeLabel} mode ${idx + 1} bonus must be a number.`);
					}
					if (!mode.dexPenalty.trim() || Number.isNaN(Number.parseInt(mode.dexPenalty, 10))) {
						errors.push(`${modeLabel} mode ${idx + 1} DEX penalty must be a number.`);
					}
					break;
				}
				case 'shield': {
					if (!mode.bonus.trim() || Number.isNaN(Number.parseInt(mode.bonus, 10))) {
						errors.push(`${modeLabel} mode ${idx + 1} bonus must be a number.`);
					}
					break;
				}
				case 'arcane': {
					if (!mode.bonus.trim() || Number.isNaN(Number.parseInt(mode.bonus, 10))) {
						errors.push(`${modeLabel} mode ${idx + 1} bonus must be a number.`);
					}
					const parsedCost = Number.parseInt(mode.spCost, 10);
					if (!mode.spCost.trim() || Number.isNaN(parsedCost) || parsedCost < 0) {
						errors.push(`${modeLabel} mode ${idx + 1} SP cost must be zero or a positive number.`);
					}
					break;
				}
			}
		});

		return { valid: errors.length === 0, errors };
	}

	private async handleSubmit(): Promise<void> {
		const validation = this.validateState(this.#state);
		if (!validation.valid) {
			this.#submitAttempted = true;
			this.#submissionError = null;
			await this.render(false);
			return;
		}

		try {
			const item = this.buildItemFromState(this.#state);
			await this.saveItem(item);
			showNotification('info', this.#options.mode === 'edit' ? 'Equipment item updated' : 'Equipment item added');
			this.#options.onUpdate?.();
			await this.close();
		} catch (error) {
			console.error('Failed to save equipment item:', error);
			this.#submissionError = 'Failed to save equipment item.';
			await this.render(false);
		}
	}

	private refreshSubmissionUI(): void {
		const root = this.element;
		if (!root) return;

		const validation = this.validateState(this.#state);
		const submitBtn = root.querySelector('[data-action="submit"]') as HTMLButtonElement | null;
		if (submitBtn) {
			submitBtn.disabled = !validation.valid;
		}

		const validationEl = root.querySelector('[data-role="validation-message"]') as HTMLElement | null;
		if (validationEl) {
			if (this.#submitAttempted && !validation.valid) {
				validationEl.textContent = validation.errors[0] ?? '';
				validationEl.style.display = validation.errors.length > 0 ? 'block' : 'none';
			} else {
				validationEl.textContent = '';
				validationEl.style.display = 'none';
			}
		}

		const errorEl = root.querySelector('[data-role="submission-error"]') as HTMLElement | null;
		if (errorEl) {
			if (this.#submissionError) {
				errorEl.textContent = this.#submissionError;
				errorEl.style.display = 'block';
			} else {
				errorEl.textContent = '';
				errorEl.style.display = 'none';
			}
		}
	}

	private buildItemFromState(state: EquipmentFormState): Item {
		const name = state.name.trim();
		const slot = state.slot;
		const traits = [...state.traits];

		// Convert each mode form state to a domain mode
		const modes: ItemMode[] = state.modes.map(mode => {
			switch (mode.modeType) {
				case 'weapon':
					return new WeaponMode({
						type: mode.type,
						bonus: Bonus.of(Number.parseInt(mode.bonus, 10)),
						range: mode.range.trim() ? Distance.of(Number.parseInt(mode.range, 10)) : undefined,
					});
				case 'armor':
					return new ArmorMode({
						type: mode.type,
						bonus: Bonus.of(Number.parseInt(mode.bonus, 10)),
						dexPenalty: Bonus.of(Number.parseInt(mode.dexPenalty, 10)),
					});
				case 'shield':
					return new ShieldMode({
						type: mode.type,
						bonus: Bonus.of(Number.parseInt(mode.bonus, 10)),
						costs: [],
					});
				case 'arcane': {
					const spCost = Number.parseInt(mode.spCost, 10);
					const costs: ResourceCost[] =
						spCost > 0 ? [new ResourceCost({ resource: Resource.SpiritPoint, amount: spCost })] : [];
					return new ArcaneComponentMode({
						component: mode.componentType,
						category: mode.category.trim() || mode.componentType,
						bonus: Bonus.of(Number.parseInt(mode.bonus, 10)),
						costs,
					});
				}
			}
		});

		return new Item({ name, slot, modes, traits });
	}

	private async saveItem(item: Item): Promise<void> {
		const actor = getActorById(this.#options.actorId);
		if (!actor) {
			throw new Error('Actor not found');
		}

		const currentProps = parseCharacterProps(actor);
		const equipment = Equipment.from(currentProps['equipment']);
		const updatedItems = [...equipment.items];

		if (this.#options.mode === 'edit' && this.#options.itemIndex !== undefined) {
			if (this.#options.itemIndex < 0 || this.#options.itemIndex >= updatedItems.length) {
				throw new Error('Equipment item index out of bounds');
			}
			updatedItems[this.#options.itemIndex] = item;
		} else {
			updatedItems.push(item);
		}

		const updatedEquipment = new Equipment(updatedItems);
		const updatedProps = { ...currentProps, equipment: updatedEquipment.toProp() };
		await updateActorProps(actor, updatedProps);
	}

	private async handleDelete(): Promise<void> {
		if (this.#options.mode !== 'edit' || this.#options.itemIndex === undefined) {
			return;
		}

		const confirmed = await confirmAction({
			title: 'Delete Equipment Item',
			message: 'Remove this equipment item from the character?',
		});

		if (!confirmed) {
			return;
		}

		try {
			await this.deleteItem();
			showNotification('info', 'Equipment item deleted');
			this.#options.onUpdate?.();
			await this.close();
		} catch (error) {
			console.error('Failed to delete equipment item:', error);
			this.#submissionError = 'Failed to delete equipment item.';
			await this.render(false);
		}
	}

	private async deleteItem(): Promise<void> {
		const actor = getActorById(this.#options.actorId);
		if (!actor) {
			throw new Error('Actor not found');
		}

		const currentProps = parseCharacterProps(actor);
		const equipment = Equipment.from(currentProps['equipment']);
		const index = this.#options.itemIndex ?? -1;
		if (index < 0 || index >= equipment.items.length) {
			throw new Error('Equipment item index out of bounds');
		}

		const updatedItems = equipment.items.filter((_, idx) => idx !== index);
		const updatedEquipment = new Equipment(updatedItems);
		const updatedProps = { ...currentProps, equipment: updatedEquipment.toProp() };
		await updateActorProps(actor, updatedProps);
	}
}

// =============================================================================
// Public API
// =============================================================================

interface EquipmentEditorModalOpenOptions {
	actorId: string;
	itemIndex?: number;
	onUpdate?: () => void;
}

export class EquipmentEditorModal {
	static async open(options: EquipmentEditorModalOpenOptions): Promise<EquipmentEditorModalImpl | null> {
		const { actorId, itemIndex, onUpdate } = options;
		const actor = getActorById(actorId);
		if (!actor) {
			showNotification('error', 'Actor not found');
			return null;
		}

		let equipment: Equipment;
		try {
			const props = parseCharacterProps(actor);
			equipment = Equipment.from(props['equipment']);
		} catch (error) {
			console.error('Failed to load equipment data:', error);
			showNotification('error', 'Unable to load equipment for this actor.');
			return null;
		}

		let initialState: EquipmentFormState;
		let mode: 'create' | 'edit' = 'create';
		let resolvedIndex: number | undefined;

		if (typeof itemIndex === 'number') {
			const existingItem = equipment.items[itemIndex];
			if (!existingItem) {
				showNotification('warn', 'Selected equipment entry no longer exists.');
				return null;
			}
			initialState = createStateFromItem(existingItem);
			mode = 'edit';
			resolvedIndex = itemIndex;
		} else {
			initialState = createDefaultState();
		}

		const modalOptions: EquipmentEditorModalInternalOptions = {
			actorId,
			mode,
			initialState,
			...(resolvedIndex !== undefined ? { itemIndex: resolvedIndex } : {}),
			...(onUpdate ? { onUpdate } : {}),
		};

		const modal = new EquipmentEditorModalImpl(modalOptions);

		await modal.render(true);
		return modal;
	}
}
