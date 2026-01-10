import { slugify } from '@shattered-wilds/commons';
import { CLASS_DEFINITIONS } from '@shattered-wilds/d12';

export const classes = Object.values(CLASS_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Classes',
		groupSlug: 'Classes',
		globalDataKey: 'classes',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [
			{
				key: 'realm',
				title: 'Realm',
				value: `${def.realm} (${def.primaryAttribute.parent})`,
				cssClass: 'metadata-type',
			},
			{
				key: 'role',
				title: 'Role',
				slug: slugify(`${def.role} ${def.realm}`),
				value: `${def.role} (${def.primaryAttribute})`,
				cssClass: 'metadata-source',
			},
			{
				key: 'flavor',
				title: 'Flavor',
				slug: slugify(`${def.flavor} ${def.realm}`),
				value: def.flavor,
				cssClass: 'metadata-source',
			},
		],

		// other parameters
		name: def.name,
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
		role: def.role,
		flavor: def.flavor,
	};
});
