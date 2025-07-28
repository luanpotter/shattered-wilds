import { StatType } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const stats = StatType.values
	.filter(stat => stat.name)
	.map(stat => {
		const children = StatType.childrenOf(stat);
		const slug = slugify(stat.name);
		return {
			// wiki parameters
			group: 'Stat',
			slug,
			title: stat.name,
			url: `/wiki/${slug}/`,
			content: stat.description,
			metadata: [],

			// other parameters
			name: stat.name,
			hierarchy: stat.hierarchy,
			parent: stat.parent?.name,
			description: stat.description,
			longDescription: stat.longDescription,
			exampleUsages: stat.exampleUsages,
			children: children.map(child => child.name),
			childHierarchy: children[0]?.hierarchy ?? null,
		};
	});
