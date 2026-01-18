import { BASIC_EQUIPMENT, BasicEquipmentType, Bonus, Item, ItemMode, WeaponMode } from '@shattered-wilds/d12';

const processModes = (modes: ItemMode[], overrides: { bonus: Bonus }): ItemMode[] => {
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

const item = (
	base: BasicEquipmentType,
	overrides: { isEquipped: boolean; name?: string | undefined; weaponMode?: { bonus: Bonus } | undefined },
) => {
	const item = BASIC_EQUIPMENT[base].generator();
	return new Item({
		...item,
		name: overrides.name ?? item.name,
		modes: overrides.weaponMode ? processModes(item.modes, overrides.weaponMode) : item.modes,
		isEquipped: overrides.isEquipped,
	});
};

export const ItemBuilder = { item };
