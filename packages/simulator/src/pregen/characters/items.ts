import {
	ArmorMode,
	BASIC_EQUIPMENT,
	BasicEquipmentType,
	Bonus,
	Item,
	ItemMode,
	WeaponMode,
} from '@shattered-wilds/d12';

const processWeaponModes = (modes: ItemMode[], overrides: { bonus: Bonus }): ItemMode[] => {
	if (modes.length !== 1) {
		throw new Error('Only single-mode items are supported in this shortcut function.');
	}
	const mode = modes[0];
	if (!(mode instanceof WeaponMode)) {
		throw new Error('Only weapon modes are supported in this shortcut function.');
	}
	return [
		new WeaponMode({
			...mode,
			bonus: Bonus.add([mode.bonus, overrides.bonus]),
		}),
	];
};

const processArmorModes = (modes: ItemMode[], overrides: { bonus?: Bonus; dexPenalty?: Bonus }): ItemMode[] => {
	if (modes.length !== 1) {
		throw new Error('Only single-mode items are supported in this shortcut function.');
	}
	const mode = modes[0];
	if (!(mode instanceof ArmorMode)) {
		throw new Error('Only armor modes are supported in this shortcut function.');
	}
	return [
		new ArmorMode({
			type: mode.type,
			bonus: overrides.bonus ? Bonus.add([mode.bonus, overrides.bonus]) : mode.bonus,
			dexPenalty: overrides.dexPenalty ? Bonus.add([mode.dexPenalty, overrides.dexPenalty]) : mode.dexPenalty,
		}),
	];
};

const item = (
	base: BasicEquipmentType,
	overrides: {
		isEquipped: boolean;
		name?: string | undefined;
		weaponMode?: { bonus: Bonus } | undefined;
		armorMode?: { bonus?: Bonus; dexPenalty?: Bonus } | undefined;
	},
) => {
	const item = BASIC_EQUIPMENT[base].generator();
	let modes = item.modes;
	if (overrides.weaponMode) {
		modes = processWeaponModes(modes, overrides.weaponMode);
	}
	if (overrides.armorMode) {
		modes = processArmorModes(modes, overrides.armorMode);
	}
	return new Item({
		...item,
		name: overrides.name ?? item.name,
		modes,
		isEquipped: overrides.isEquipped,
	});
};

export const ItemBuilder = { item };
