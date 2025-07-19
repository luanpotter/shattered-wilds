import { StatType } from '@shattered-wilds/commons';

export const stats = StatType.values
	.filter(stat => stat.name)
	.map(stat => {
		const children = StatType.childrenOf(stat);
		return {
			slug: stat.name,
			name: stat.name,
			hierarchy: stat.hierarchy,
			parent: stat.parent?.name,
			description: stat.description,
			longDescription: stat.longDescription,
			exampleUsages: stat.exampleUsages,
			children: children.map(child => child.name),
			childHierarchy: children[0]?.hierarchy ?? null,
			url: `/wiki/Stat_${stat.name}/`,
			shortTitle: stat.name,
		};
	});
