import { numberToOrdinal } from '@shattered-wilds/commons';
import { WeaponModeOption } from '../character/equipment';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree';
import { Bonus, Distance } from '../stats/value';

export const Ranged = {
	computeRangeIncrementModifier: ({
		weaponModeOption,
		range,
	}: {
		weaponModeOption: WeaponModeOption;
		range: Distance;
	}): CircumstanceModifier | null => {
		const weaponRange = weaponModeOption.mode.range;
		const rangeIncrements = Math.max(0, Math.floor((range.value - 1) / weaponRange.value));

		if (rangeIncrements === 0) {
			return null;
		}

		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});
	},
};
