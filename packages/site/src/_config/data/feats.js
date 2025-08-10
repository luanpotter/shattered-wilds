import { FEATS } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

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
			...feat.sources.map(source => ({
				key: 'source',
				title: 'Source',
				value: source,
				cssClass: 'metadata-source',
			})),
			{
				key: 'level',
				title: 'Level',
				value: feat.level,
				cssClass: 'metadata-level',
			},
		],

		// other parameters
		name: feat.name,
		type: feat.type,
		category: feat.category,
		sources: feat.sources,
		level: feat.level,
		description: feat.description,
		isCore: feat.isCore,
		isNotCore: !feat.isCore,
	};
});
