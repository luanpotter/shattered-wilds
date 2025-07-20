import { StatType } from '@shattered-wilds/commons';

export const stats = StatType.values
	.filter(stat => stat.name)
	.map(stat => {
		const children = StatType.childrenOf(stat);
		return {
			// wiki parameters
			slug: stat.name,
			title: stat.name,
			url: `/wiki/Stat_${stat.name}/`,

			// stat parameters
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
