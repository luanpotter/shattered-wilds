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
			{
				key: 'source',
				title: 'Source',
				value: feat.source,
				cssClass: 'metadata-source',
			},
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
		source: feat.source,
		level: feat.level,
		description: feat.description,
	};
});
