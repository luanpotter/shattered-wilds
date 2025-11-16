import {
	ArcaneFocus,
	Armor,
	ArmorType,
	Bonus,
	Distance,
	Equipment,
	Item,
	OtherItem,
	PrimaryWeaponType,
	Shield,
	ShieldType,
	Trait,
	TraitTarget,
	TRAITS,
	Weapon,
	WeaponMode,
} from '@shattered-wilds/commons';
import { createHandlebarsApplicationBase, getActorById, showNotification } from '../foundry-shim.js';
import { parseCharacterProps } from '../helpers/character.js';
import { updateActorProps } from '../helpers/resources.js';
import { confirmAction } from './modals.js';

type EquipmentKind = 'weapon' | 'armor' | 'shield' | 'arcaneFocus' | 'other';

type WeaponModeFormState = {
	type: PrimaryWeaponType;
	bonus: string;
	range: string;
};

type WeaponFormState = {
	kind: 'weapon';
	name: string;
	traits: Trait[];
	modes: WeaponModeFormState[];
};

type ArmorFormState = {
	kind: 'armor';
	name: string;
	traits: Trait[];
	type: ArmorType;
	bonus: string;
	dexPenalty: string;
};

type ShieldFormState = {
	kind: 'shield';
	name: string;
	traits: Trait[];
	type: ShieldType;
	bonus: string;
};

type ArcaneFocusFormState = {
	kind: 'arcaneFocus';
	name: string;
	traits: Trait[];
	bonus: string;
	spCost: string;
	details: string;
};

type OtherFormState = {
	kind: 'other';
	name: string;
	details: string;
};

type EquipmentFormState = WeaponFormState | ArmorFormState | ShieldFormState | ArcaneFocusFormState | OtherFormState;

type ValidationResult = {
	valid: boolean;
	errors: string[];
};

const EQUIPMENT_KIND_VALUES: EquipmentKind[] = ['weapon', 'armor', 'shield', 'arcaneFocus', 'other'];

const EQUIPMENT_KIND_LABELS: Record<EquipmentKind, string> = {
	weapon: 'Weapon',
	armor: 'Armor',
	shield: 'Shield',
	arcaneFocus: 'Arcane Focus',
	other: 'Other',
};

const PRIMARY_WEAPON_TYPE_VALUES = Object.values(PrimaryWeaponType) as PrimaryWeaponType[];
const ARMOR_TYPE_VALUES = Object.values(ArmorType) as ArmorType[];
const SHIELD_TYPE_VALUES = Object.values(ShieldType) as ShieldType[];

const EQUIPMENT_TRAITS = (Object.values(Trait) as Trait[]).filter(
	trait => TRAITS[trait]?.target === TraitTarget.Equipment,
);
const EQUIPMENT_TRAIT_SET = new Set<Trait>(EQUIPMENT_TRAITS);

const PRIMARY_WEAPON_TYPE_OPTIONS = PRIMARY_WEAPON_TYPE_VALUES.map(value => ({ value, label: value }));
const ARMOR_TYPE_OPTIONS = ARMOR_TYPE_VALUES.map(value => ({ value, label: value }));
const SHIELD_TYPE_OPTIONS = SHIELD_TYPE_VALUES.map(value => ({ value, label: value }));

const HandlebarsAppBase = createHandlebarsApplicationBase();

interface EquipmentEditorModalInternalOptions {
	actorId: string;
	mode: 'create' | 'edit';
	itemIndex?: number;
	initialState: EquipmentFormState;
	onUpdate?: () => void;
}

function isEquipmentKind(value: string): value is EquipmentKind {
	return EQUIPMENT_KIND_VALUES.includes(value as EquipmentKind);
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

function isEquipmentTrait(value: string): value is Trait {
	return EQUIPMENT_TRAIT_SET.has(value as Trait);
}

function isWeaponState(state: EquipmentFormState): state is WeaponFormState {
	return state.kind === 'weapon';
}

function isArmorState(state: EquipmentFormState): state is ArmorFormState {
	return state.kind === 'armor';
}

function isShieldState(state: EquipmentFormState): state is ShieldFormState {
	return state.kind === 'shield';
}

function isArcaneFocusState(state: EquipmentFormState): state is ArcaneFocusFormState {
	return state.kind === 'arcaneFocus';
}

function stateSupportsTraits(
	state: EquipmentFormState,
): state is WeaponFormState | ArmorFormState | ShieldFormState | ArcaneFocusFormState {
	return state.kind !== 'other';
}

function createDefaultState(kind: EquipmentKind, name = ''): EquipmentFormState {
	switch (kind) {
		case 'weapon':
			return {
				kind,
				name,
				traits: [],
				modes: [
					{
						type: PrimaryWeaponType.LightMelee,
						bonus: '0',
						range: '1',
					},
				],
			};
		case 'armor':
			return {
				kind,
				name,
				traits: [],
				type: ArmorType.LightArmor,
				bonus: '0',
				dexPenalty: '0',
			};
		case 'shield':
			return {
				kind,
				name,
				traits: [],
				type: ShieldType.SmallShield,
				bonus: '0',
			};
		case 'arcaneFocus':
			return {
				kind,
				name,
				traits: [],
				bonus: '0',
				spCost: '0',
				details: '',
			};
		case 'other':
		default:
			return {
				kind: 'other',
				name,
				details: '',
			};
	}
}

function createStateFromItem(item: Item): EquipmentFormState {
	if (item instanceof Weapon) {
		return {
			kind: 'weapon',
			name: item.name,
			traits: [...item.traits],
			modes: item.modes.map(mode => ({
				type: mode.type,
				bonus: mode.bonus.value.toString(),
				range: mode.range?.value ? mode.range.value.toString() : '1',
			})),
		};
	}

	if (item instanceof Armor) {
		return {
			kind: 'armor',
			name: item.name,
			traits: [...item.traits],
			type: item.type,
			bonus: item.bonus.value.toString(),
			dexPenalty: item.dexPenalty.value.toString(),
		};
	}

	if (item instanceof Shield) {
		return {
			kind: 'shield',
			name: item.name,
			traits: [...item.traits],
			type: item.type,
			bonus: item.bonus.value.toString(),
		};
	}

	if (item instanceof ArcaneFocus) {
		return {
			kind: 'arcaneFocus',
			name: item.name,
			traits: [...item.traits],
			bonus: item.bonus.value.toString(),
			spCost: item.spCost.toString(),
			details: item.details ?? '',
		};
	}

	if (item instanceof OtherItem) {
		return {
			kind: 'other',
			name: item.name,
			details: item.details ?? '',
		};
	}

	return createDefaultState('other', item.name);
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

		const supportsTraits = stateSupportsTraits(state);
		const traitState = supportsTraits
			? (state as WeaponFormState | ArmorFormState | ShieldFormState | ArcaneFocusFormState)
			: null;
		const weaponState = isWeaponState(state) ? state : null;
		const armorState = isArmorState(state) ? state : null;
		const shieldState = isShieldState(state) ? state : null;
		const arcaneFocusState = isArcaneFocusState(state) ? state : null;

		const traitOptions = traitState
			? EQUIPMENT_TRAITS.map(trait => ({
					value: trait,
					label: trait,
					checked: traitState.traits.includes(trait),
				}))
			: [];

		const weaponModes = weaponState
			? weaponState.modes.map((mode, index) => ({
					index,
					bonus: mode.bonus,
					range: mode.range,
					typeOptions: PRIMARY_WEAPON_TYPE_OPTIONS.map(option => ({
						value: option.value,
						label: option.label,
						selected: option.value === mode.type,
					})),
				}))
			: [];

		const armorOptions = armorState
			? {
					typeOptions: ARMOR_TYPE_OPTIONS.map(option => ({
						value: option.value,
						label: option.label,
						selected: option.value === armorState.type,
					})),
					bonus: armorState.bonus,
					dexPenalty: armorState.dexPenalty,
				}
			: null;

		const shieldOptions = shieldState
			? {
					typeOptions: SHIELD_TYPE_OPTIONS.map(option => ({
						value: option.value,
						label: option.label,
						selected: option.value === shieldState.type,
					})),
					bonus: shieldState.bonus,
				}
			: null;

		const arcaneFocusOptions = arcaneFocusState
			? {
					bonus: arcaneFocusState.bonus,
					spCost: arcaneFocusState.spCost,
					details: arcaneFocusState.details,
				}
			: null;

		return {
			mode: this.#options.mode,
			isEditMode: this.#options.mode === 'edit',
			kindOptions: EQUIPMENT_KIND_VALUES.map(value => ({
				value,
				label: EQUIPMENT_KIND_LABELS[value],
				selected: state.kind === value,
			})),
			name: state.name,
			hasTraits: Boolean(traitState),
			traitOptions,
			isWeapon: Boolean(weaponState),
			weaponModes,
			isArmor: Boolean(armorOptions),
			armorOptions,
			isShield: Boolean(shieldOptions),
			shieldOptions,
			isArcaneFocus: Boolean(arcaneFocusOptions),
			arcaneFocusOptions,
			isOther: state.kind === 'other',
			otherDetails: state.kind === 'other' ? state.details : '',
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

		switch (actionElement.dataset.action) {
			case 'add-weapon-mode':
				event.preventDefault();
				this.addWeaponMode();
				break;
			case 'remove-weapon-mode':
				event.preventDefault();
				this.removeWeaponMode(parseInt(actionElement.dataset.modeIndex ?? '-1', 10));
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
			this.updateWeaponModeField(
				parseInt(target.dataset.modeIndex ?? '-1', 10),
				target.dataset.modeField,
				target.value,
			);
			return;
		}

		if (target.dataset.field) {
			this.updateField(target.dataset.field, target.value);
		}
	}

	private handleChange(event: Event): void {
		const target = event.target;
		if (target instanceof HTMLSelectElement) {
			if (target.dataset.field === 'kind') {
				this.handleKindChange(target.value);
				return;
			}

			if (target.dataset.field) {
				this.updateField(target.dataset.field, target.value);
				return;
			}

			if (target.dataset.modeField) {
				this.updateWeaponModeField(
					parseInt(target.dataset.modeIndex ?? '-1', 10),
					target.dataset.modeField,
					target.value,
				);
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
				this.updateWeaponModeField(
					parseInt(target.dataset.modeIndex ?? '-1', 10),
					target.dataset.modeField,
					target.value,
				);
			}
		}
	}

	private handleKindChange(value: string): void {
		if (!isEquipmentKind(value)) {
			return;
		}

		this.#state = createDefaultState(value, this.#state.name);
		this.#submitAttempted = false;
		this.#submissionError = null;
		void this.render(false);
	}

	private updateField(field: string, rawValue: string): void {
		const value = rawValue ?? '';

		switch (field) {
			case 'name':
				this.#state = { ...this.#state, name: value } as EquipmentFormState;
				break;
			case 'armorType':
				if (isArmorState(this.#state) && isArmorType(value)) {
					const nextState: ArmorFormState = { ...this.#state, type: value };
					this.#state = nextState;
				}
				break;
			case 'armorBonus':
				if (isArmorState(this.#state)) {
					const nextState: ArmorFormState = { ...this.#state, bonus: value };
					this.#state = nextState;
				}
				break;
			case 'armorDexPenalty':
				if (isArmorState(this.#state)) {
					const nextState: ArmorFormState = { ...this.#state, dexPenalty: value };
					this.#state = nextState;
				}
				break;
			case 'shieldType':
				if (isShieldState(this.#state) && isShieldType(value)) {
					const nextState: ShieldFormState = { ...this.#state, type: value };
					this.#state = nextState;
				}
				break;
			case 'shieldBonus':
				if (isShieldState(this.#state)) {
					const nextState: ShieldFormState = { ...this.#state, bonus: value };
					this.#state = nextState;
				}
				break;
			case 'focusBonus':
				if (isArcaneFocusState(this.#state)) {
					const nextState: ArcaneFocusFormState = { ...this.#state, bonus: value };
					this.#state = nextState;
				}
				break;
			case 'focusSpCost':
				if (isArcaneFocusState(this.#state)) {
					const nextState: ArcaneFocusFormState = { ...this.#state, spCost: value };
					this.#state = nextState;
				}
				break;
			case 'focusDetails':
				if (isArcaneFocusState(this.#state)) {
					const nextState: ArcaneFocusFormState = { ...this.#state, details: value };
					this.#state = nextState;
				}
				break;
			case 'otherDetails':
				if (this.#state.kind === 'other') {
					this.#state = { ...this.#state, details: value };
				}
				break;
			default:
				break;
		}

		this.#submissionError = null;
		this.refreshSubmissionUI();
	}

	private updateWeaponModeField(index: number, field: string | undefined, rawValue: string): void {
		if (!isWeaponState(this.#state) || field === undefined || Number.isNaN(index) || index < 0) {
			return;
		}

		const modes = this.#state.modes.map((mode, idx) => {
			if (idx !== index) return mode;
			switch (field) {
				case 'type':
					return isPrimaryWeaponType(rawValue) ? { ...mode, type: rawValue } : mode;
				case 'bonus':
					return { ...mode, bonus: rawValue };
				case 'range':
					return { ...mode, range: rawValue };
				default:
					return mode;
			}
		});
		this.#state = { ...this.#state, modes };
		this.#submissionError = null;
		this.refreshSubmissionUI();
	}

	private addWeaponMode(): void {
		if (!isWeaponState(this.#state)) {
			return;
		}

		const nextModes = [...this.#state.modes, { type: PrimaryWeaponType.LightMelee, bonus: '0', range: '1' }];
		this.#state = { ...this.#state, modes: nextModes };
		void this.render(false);
	}

	private removeWeaponMode(index: number): void {
		if (!isWeaponState(this.#state) || Number.isNaN(index) || index < 0) {
			return;
		}

		if (this.#state.modes.length <= 1) {
			showNotification('warn', 'Weapons must have at least one mode');
			return;
		}

		const nextModes = this.#state.modes.filter((_, idx) => idx !== index);
		this.#state = { ...this.#state, modes: nextModes };
		void this.render(false);
	}

	private toggleTrait(traitValue: string, isChecked: boolean): void {
		if (!stateSupportsTraits(this.#state) || !isEquipmentTrait(traitValue)) {
			return;
		}

		const traitSet = new Set(this.#state.traits);
		if (isChecked) {
			traitSet.add(traitValue);
		} else {
			traitSet.delete(traitValue);
		}

		const nextState = { ...this.#state, traits: Array.from(traitSet) };
		this.#state = nextState;
		this.refreshSubmissionUI();
	}

	private validateState(state: EquipmentFormState): ValidationResult {
		const errors: string[] = [];
		if (!state.name.trim()) {
			errors.push('Name is required.');
		}

		switch (state.kind) {
			case 'weapon': {
				if (state.modes.length === 0) {
					errors.push('Add at least one weapon mode.');
				}
				state.modes.forEach((mode, idx) => {
					if (!mode.bonus.trim() || Number.isNaN(Number.parseInt(mode.bonus, 10))) {
						errors.push(`Weapon mode ${idx + 1} needs a valid bonus.`);
					}
					if (mode.range.trim()) {
						const parsedRange = Number.parseInt(mode.range, 10);
						if (Number.isNaN(parsedRange) || parsedRange < 1) {
							errors.push(`Weapon mode ${idx + 1} needs a range of 1 or greater.`);
						}
					}
				});
				break;
			}
			case 'armor': {
				if (!state.bonus.trim() || Number.isNaN(Number.parseInt(state.bonus, 10))) {
					errors.push('Armor bonus must be a number.');
				}
				if (!state.dexPenalty.trim() || Number.isNaN(Number.parseInt(state.dexPenalty, 10))) {
					errors.push('DEX penalty must be a number.');
				}
				break;
			}
			case 'shield': {
				if (!state.bonus.trim() || Number.isNaN(Number.parseInt(state.bonus, 10))) {
					errors.push('Shield bonus must be a number.');
				}
				break;
			}
			case 'arcaneFocus': {
				if (!state.bonus.trim() || Number.isNaN(Number.parseInt(state.bonus, 10))) {
					errors.push('Focus bonus must be a number.');
				}
				const parsedCost = Number.parseInt(state.spCost, 10);
				if (!state.spCost.trim() || Number.isNaN(parsedCost) || parsedCost < 0) {
					errors.push('SP cost must be zero or a positive number.');
				}
				break;
			}
			case 'other':
			default:
				break;
		}

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

		switch (state.kind) {
			case 'weapon': {
				const modes = state.modes.map(
					mode =>
						new WeaponMode({
							type: mode.type,
							bonus: Bonus.of(Number.parseInt(mode.bonus, 10)),
							range: mode.range.trim() ? Distance.of(Number.parseInt(mode.range, 10)) : undefined,
						}),
				);
				return new Weapon({ name, modes, traits: [...state.traits] });
			}
			case 'armor':
				return new Armor({
					name,
					type: state.type,
					bonus: Bonus.of(Number.parseInt(state.bonus, 10)),
					dexPenalty: Bonus.of(Number.parseInt(state.dexPenalty, 10)),
					traits: [...state.traits],
				});
			case 'shield':
				return new Shield({
					name,
					type: state.type,
					bonus: Bonus.of(Number.parseInt(state.bonus, 10)),
					traits: [...state.traits],
				});
			case 'arcaneFocus':
				return new ArcaneFocus({
					name,
					bonus: Bonus.of(Number.parseInt(state.bonus, 10)),
					spCost: Number.parseInt(state.spCost, 10),
					details: state.details.trim() || undefined,
					traits: [...state.traits],
				});
			case 'other':
			default:
				return new OtherItem({
					name,
					details: state.details.trim() || undefined,
				});
		}
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
			initialState = createDefaultState('weapon');
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
