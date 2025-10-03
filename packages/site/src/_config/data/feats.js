import { FEATS, slugify } from '@shattered-wilds/commons';

export const feats = Object.values(FEATS).map(feat => {
	const slug = slugify(feat.name);
	return {
		// wiki parameters
		group: 'Feat',
		slug,
		title: feat.name,
		url: `/wiki/${slug}/`,
		content: feat.description,
		metadata: [
			{
				key: 'type',
				title: 'Type',
				value: feat.type,
				cssClass: 'metadata-type',
			},
			{
				key: 'level',
				title: 'Level',
				value: feat.level,
				cssClass: 'metadata-level',
			},
			...feat.sources.map(source => ({
				key: 'source',
				title: 'Source',
				value: source,
				cssClass: 'metadata-source',
			})),
		],

		// other parameters
		name: feat.name,
		type: feat.type,
		category: feat.category,
		sources: feat.sources,
		level: feat.level,
		description: feat.description,
		isCore: feat.type === 'Core',
		isMajor: feat.type === 'Major',
		isMinor: feat.type === 'Minor',
		isNotCore: feat.type !== 'Core',
		isNotMajor: feat.type !== 'Major',
		isNotMinor: feat.type !== 'Minor',
	};
});
