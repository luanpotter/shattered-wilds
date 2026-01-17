import { numberToOrdinal } from '@shattered-wilds/commons';
import { COVER_TYPES } from '../../generated/covers-data.js';
import { WeaponModeOption } from '../character/equipment.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus, Distance } from '../stats/value.js';
import { PassiveCoverType } from './cover.js';

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

	computeCoverModifier: (cover: PassiveCoverType): CircumstanceModifier | null => {
		if (cover === PassiveCoverType.None) {
			return null;
		}
		return COVER_TYPES[cover].modifier;
	},

	computeHeightIncrementsModifier: (heightIncrements: number): CircumstanceModifier | null => {
		if (heightIncrements === 0) {
			return null;
		}
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Height Increments (${heightIncrements})`,
			value: Bonus.of(heightIncrements * -3),
		});
	},
};
