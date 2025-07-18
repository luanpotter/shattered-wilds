import { StatType } from '@shattered-wilds/commons';

const stats = Object.values(StatType).map(stat => ({
	name: stat.name,
}));

export const eleventyComputed = {
	stats,
};
