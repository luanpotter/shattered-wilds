import {
	ArcaneComponentMode,
	ArmorMode,
	CharacterSheet,
	Equipment,
	Item,
	ItemMode,
	PRIMARY_WEAPON_TYPES,
	ResourceCost,
	ShieldMode,
	Trait,
	WeaponMode,
	WeaponModeOption,
} from '@shattered-wilds/d12';

// =============================================================================
// Type Definitions
// =============================================================================

export type ModeType = 'weapon' | 'armor' | 'shield' | 'arcane' | 'generic';

/**
 * Base display information for any mode
 */
export interface ModeDisplayBase {
	modeType: ModeType;
	description: string;
	costs: string | null;
}

/**
 * Weapon mode display - includes attack action capability
 */
export interface WeaponModeDisplay extends ModeDisplayBase {
	modeType: 'weapon';
	idx: number;
	type: string;
	bonus: string;
	bonusValue: number;
	range: string | null;
	attackStat: string;
	primaryAttribute: string;
}

/**
 * Armor mode display
 */
export interface ArmorModeDisplay extends ModeDisplayBase {
	modeType: 'armor';
	type: string;
	bonus: string;
	dexPenalty: string | null;
}

/**
 * Shield mode display - includes shield block action capability
 */
export interface ShieldModeDisplay extends ModeDisplayBase {
	modeType: 'shield';
	type: string;
	bonus: string;
}

/**
 * Arcane component mode display
 */
export interface ArcaneModeDisplay extends ModeDisplayBase {
	modeType: 'arcane';
	bonus: string;
	category: string;
	componentType: string;
}

/**
 * Generic mode display for unknown mode types
 */
export interface GenericModeDisplay extends ModeDisplayBase {
	modeType: 'generic';
}

export type ModeDisplay =
	| WeaponModeDisplay
	| ArmorModeDisplay
	| ShieldModeDisplay
	| ArcaneModeDisplay
	| GenericModeDisplay;

/**
 * Equipment item display data
 */
export interface EquipmentItemDisplay {
	index: number;
	name: string;
	headerDisplay: string;
	description: string | null;
	itemType: string;
	traits: string[];

	// Unified modes array
	modes: ModeDisplay[];

	// Convenience flags for template rendering
	hasSingleMode: boolean;
	hasMultipleModes: boolean;

	// Quick access to check if item has specific mode types
	hasWeaponModes: boolean;
	hasArmorModes: boolean;
	hasShieldModes: boolean;
	hasArcaneModes: boolean;

	// Backward-compatible properties (for existing templates)
	weaponModes?: WeaponModeDisplay[];
	armorInfo?: { type: string; bonus: string; dexPenalty: string | null };
	shieldInfo?: { type: string; bonus: string };
	arcaneFocusInfo?: { bonus: string; spCost: string | null; details: string | null };
}

export interface EquipmentDisplayData {
	isEmpty: boolean;
	items: EquipmentItemDisplay[];
	hasAnyShield: boolean;
}

// =============================================================================
// Main Entry Point
// =============================================================================

export const prepareEquipmentDisplayData = (
	characterSheet: CharacterSheet | undefined,
): EquipmentDisplayData | null => {
	if (!characterSheet) {
		return null;
	}

	try {
		const equipment = characterSheet.equipment;
		if (!equipment || equipment.items.length === 0) {
			return { isEmpty: true, items: [], hasAnyShield: false };
		}

		const weaponIndexByMode = buildWeaponModeIndex(equipment);
		const items = equipment.items.map((item, index) => buildEquipmentItemDisplay({ item, index, weaponIndexByMode }));

		// Check if any item has a shield mode (for shield bash availability)
		const hasAnyShield = items.some(item => item.hasShieldModes);

		return {
			isEmpty: items.length === 0,
			items,
			hasAnyShield,
		};
	} catch (error) {
		console.warn('Failed to prepare equipment data:', error);
		return { isEmpty: true, items: [], hasAnyShield: false };
	}
};

// =============================================================================
// Index Building
// =============================================================================

const buildWeaponModeIndex = (equipment: Equipment): Map<WeaponMode, number> => {
	const indexByMode = new Map<WeaponMode, number>();
	const options = equipment.weaponOptions();

	options.forEach((option, idx) => {
		if (option === WeaponModeOption.unarmed || option === WeaponModeOption.shieldBash) {
			return;
		}
		indexByMode.set(option.mode, idx);
	});

	return indexByMode;
};

// =============================================================================
// Item Display Building
// =============================================================================

const buildEquipmentItemDisplay = ({
	item,
	index,
	weaponIndexByMode,
}: {
	item: Item;
	index: number;
	weaponIndexByMode: Map<WeaponMode, number>;
}): EquipmentItemDisplay => {
	// Filter modes by type
	const weaponModes = filterModes(item, WeaponMode);
	const armorModes = filterModes(item, ArmorMode);
	const shieldModes = filterModes(item, ShieldMode);
	const arcaneModes = filterModes(item, ArcaneComponentMode);

	// Build unified modes array
	const modes: ModeDisplay[] = [
		...weaponModes.map(mode => buildWeaponModeDisplay(mode, weaponIndexByMode)),
		...armorModes.map(mode => buildArmorModeDisplay(mode)),
		...shieldModes.map(mode => buildShieldModeDisplay(mode)),
		...arcaneModes.map(mode => buildArcaneModeDisplay(mode)),
		// Add generic modes for any unrecognized mode types
		...item.modes
			.filter(
				mode =>
					!(mode instanceof WeaponMode) &&
					!(mode instanceof ArmorMode) &&
					!(mode instanceof ShieldMode) &&
					!(mode instanceof ArcaneComponentMode),
			)
			.map(mode => buildGenericModeDisplay(mode)),
	];

	const itemType = determineItemType({ weaponModes, armorModes, shieldModes, arcaneModes });
	const modeSummary = buildModeSummary(item.modes);
	const description = buildModeDescription(item.modes);

	// Build backward-compatible structures for existing templates
	const weaponModeDisplays = modes.filter((m): m is WeaponModeDisplay => m.modeType === 'weapon');
	const armorModeDisplays = modes.filter((m): m is ArmorModeDisplay => m.modeType === 'armor');
	const shieldModeDisplays = modes.filter((m): m is ShieldModeDisplay => m.modeType === 'shield');
	const arcaneModeDisplays = modes.filter((m): m is ArcaneModeDisplay => m.modeType === 'arcane');

	return {
		index,
		name: item.name,
		headerDisplay: buildHeaderDisplay(item.name, modeSummary),
		description,
		itemType,
		traits: item.traits.map(formatTrait),

		// Unified modes
		modes,
		hasSingleMode: modes.length === 1,
		hasMultipleModes: modes.length > 1,

		// Mode type flags
		hasWeaponModes: weaponModeDisplays.length > 0,
		hasArmorModes: armorModeDisplays.length > 0,
		hasShieldModes: shieldModeDisplays.length > 0,
		hasArcaneModes: arcaneModeDisplays.length > 0,

		// Backward-compatible structures
		...spreadIfDefined('weaponModes', weaponModeDisplays.length > 0 ? weaponModeDisplays : undefined),
		...spreadIfDefined('armorInfo', buildLegacyArmorInfo(armorModeDisplays)),
		...spreadIfDefined('shieldInfo', buildLegacyShieldInfo(shieldModeDisplays)),
		...spreadIfDefined('arcaneFocusInfo', buildLegacyArcaneInfo(arcaneModeDisplays, arcaneModes)),
	};
};

// =============================================================================
// Mode Display Builders
// =============================================================================

const buildWeaponModeDisplay = (mode: WeaponMode, weaponIndexByMode: Map<WeaponMode, number>): WeaponModeDisplay => {
	const idx = weaponIndexByMode.get(mode) ?? -1;
	const weaponTypeDef = PRIMARY_WEAPON_TYPES[mode.type];

	return {
		modeType: 'weapon',
		description: mode.description,
		costs: formatResourceCosts(mode.costs),
		idx,
		type: mode.type,
		bonus: mode.bonus.description,
		bonusValue: mode.bonus.value,
		range: mode.range?.description ?? null,
		attackStat: weaponTypeDef.statType.name,
		primaryAttribute: `Primary: ${weaponTypeDef.statType.name}`,
	};
};

const buildArmorModeDisplay = (mode: ArmorMode): ArmorModeDisplay => {
	return {
		modeType: 'armor',
		description: mode.description,
		costs: formatResourceCosts(mode.costs),
		type: mode.type,
		bonus: mode.bonus.description,
		dexPenalty: mode.dexPenalty.isNotZero ? mode.dexPenalty.description : null,
	};
};

const buildShieldModeDisplay = (mode: ShieldMode): ShieldModeDisplay => {
	return {
		modeType: 'shield',
		description: mode.description,
		costs: formatResourceCosts(mode.costs),
		type: mode.type,
		bonus: mode.bonus.description,
	};
};

const buildArcaneModeDisplay = (mode: ArcaneComponentMode): ArcaneModeDisplay => {
	return {
		modeType: 'arcane',
		description: mode.description,
		costs: formatResourceCosts(mode.costs),
		bonus: mode.bonus.description,
		category: mode.category,
		componentType: mode.component,
	};
};

const buildGenericModeDisplay = (mode: ItemMode): GenericModeDisplay => {
	return {
		modeType: 'generic',
		description: mode.description,
		costs: formatResourceCosts(mode.costs),
	};
};

// =============================================================================
// Legacy/Backward-Compatible Builders
// =============================================================================

const buildLegacyArmorInfo = (
	armorDisplays: ArmorModeDisplay[],
): { type: string; bonus: string; dexPenalty: string | null } | undefined => {
	if (armorDisplays.length === 0) {
		return undefined;
	}

	if (armorDisplays.length === 1) {
		const armor = armorDisplays[0]!;
		return {
			type: armor.type,
			bonus: armor.bonus,
			dexPenalty: armor.dexPenalty,
		};
	}

	const types = armorDisplays.map(d => d.type).join(', ');
	const bonuses = armorDisplays.map(d => d.bonus).join(' / ');
	const dexPenalties = armorDisplays
		.map(d => d.dexPenalty)
		.filter(isNonEmptyString)
		.join(' / ');

	return {
		type: types,
		bonus: bonuses,
		dexPenalty: dexPenalties.length > 0 ? dexPenalties : null,
	};
};

const buildLegacyShieldInfo = (shieldDisplays: ShieldModeDisplay[]): { type: string; bonus: string } | undefined => {
	if (shieldDisplays.length === 0) {
		return undefined;
	}

	if (shieldDisplays.length === 1) {
		const shield = shieldDisplays[0]!;
		return {
			type: shield.type,
			bonus: shield.bonus,
		};
	}

	return {
		type: shieldDisplays.map(d => d.type).join(', '),
		bonus: shieldDisplays.map(d => d.bonus).join(' / '),
	};
};

const buildLegacyArcaneInfo = (
	arcaneDisplays: ArcaneModeDisplay[],
	arcaneModes: ArcaneComponentMode[],
): { bonus: string; spCost: string | null; details: string | null } | undefined => {
	if (arcaneDisplays.length === 0) {
		return undefined;
	}

	if (arcaneDisplays.length === 1) {
		const display = arcaneDisplays[0]!;
		const mode = arcaneModes[0]!;
		return {
			bonus: display.bonus,
			spCost: formatResourceCosts(mode.costs),
			details: `${display.category} • ${display.componentType}`,
		};
	}

	return {
		bonus: arcaneDisplays.map(d => `${d.category}: ${d.bonus}`).join(' / '),
		spCost: joinStrings(arcaneModes.map(m => formatResourceCosts(m.costs)).filter(isNonEmptyString)),
		details: joinStrings(arcaneDisplays.map(d => `${d.category} • ${d.componentType}`)),
	};
};

// =============================================================================
// Helper Functions
// =============================================================================

const filterModes = <T extends ItemMode>(item: Item, ctor: new (...args: never[]) => T): T[] => {
	return item.modes.filter((mode): mode is T => mode instanceof ctor);
};

const determineItemType = ({
	weaponModes,
	armorModes,
	shieldModes,
	arcaneModes,
}: {
	weaponModes: WeaponMode[];
	armorModes: ArmorMode[];
	shieldModes: ShieldMode[];
	arcaneModes: ArcaneComponentMode[];
}): string => {
	const labels = new Set<string>();
	if (weaponModes.length > 0) labels.add('Weapon');
	if (armorModes.length > 0) labels.add('Armor');
	if (shieldModes.length > 0) labels.add('Shield');
	if (arcaneModes.length > 0) labels.add('Arcane Component');

	if (labels.size === 0) {
		return 'Equipment';
	}

	return Array.from(labels).join(' / ');
};

const buildModeSummary = (modes: ItemMode[]): string | null => {
	if (modes.length === 0) {
		return null;
	}

	return modes.map(mode => formatModeSummary(mode)).join(' / ');
};

const buildModeDescription = (modes: ItemMode[]): string | null => {
	if (modes.length === 0) {
		return null;
	}

	const details = modes.map(mode => formatModeDetail(mode));

	if (details.length === 1) {
		return details[0] ?? null;
	}

	return details.map(detail => `• ${detail}`).join('<br>');
};

const buildHeaderDisplay = (name: string, modeSummary: string | null): string => {
	return modeSummary ? `<strong>${name}</strong> - ${modeSummary}` : `<strong>${name}</strong>`;
};

const formatModeSummary = (mode: ItemMode): string => {
	if (mode instanceof ArcaneComponentMode) {
		return `${mode.category} (${mode.bonus.description})`;
	}
	return mode.description;
};

const formatModeDetail = (mode: ItemMode): string => {
	const costs = formatResourceCosts(mode.costs);

	if (mode instanceof WeaponMode) {
		return appendCosts(`Weapon Mode: ${mode.description}`, costs);
	}

	if (mode instanceof ArmorMode) {
		const dexPenalty = mode.dexPenalty.isNotZero ? `, DEX Penalty ${mode.dexPenalty.description}` : '';
		return appendCosts(`Armor Mode: ${mode.type} ${mode.bonus.description}${dexPenalty}`, costs);
	}

	if (mode instanceof ShieldMode) {
		return appendCosts(`Shield Mode: ${mode.type} ${mode.bonus.description}`, costs);
	}

	if (mode instanceof ArcaneComponentMode) {
		return appendCosts(`Arcane Component: ${mode.category} (${mode.component}) ${mode.bonus.description}`, costs);
	}

	return appendCosts(`Mode: ${mode.description}`, costs);
};

const appendCosts = (base: string, costs: string | null): string => {
	return costs ? `${base} • Costs: ${costs}` : base;
};

const formatResourceCosts = (costs: ResourceCost[]): string | null => {
	if (!costs || costs.length === 0) {
		return null;
	}

	const formatted = costs.map(cost => cost.shortDescription).join(', ');
	return formatted.length > 0 ? formatted : null;
};

const joinStrings = (values: string[]): string | null => {
	if (values.length === 0) {
		return null;
	}

	return values.join(' / ');
};

const formatTrait = (trait: Trait): string => trait;

const spreadIfDefined = <K extends keyof EquipmentItemDisplay, V extends EquipmentItemDisplay[K]>(
	key: K,
	value: V | undefined,
): Partial<EquipmentItemDisplay> => {
	return value !== undefined ? ({ [key]: value } as Partial<EquipmentItemDisplay>) : {};
};

const isNonEmptyString = (value: string | null | undefined): value is string => {
	return typeof value === 'string' && value.length > 0;
};
