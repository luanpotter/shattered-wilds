import { StatType } from '@shattered-wilds/commons';

const statTree = Object.values(StatType);

export const stats = statTree
	.filter(stat => stat.name)
	.map(stat => {
		const children = statTree.filter(child => child.parent?.name === stat.name);
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
