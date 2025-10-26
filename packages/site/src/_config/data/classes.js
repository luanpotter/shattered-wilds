import { CLASS_DEFINITIONS, slugify } from '@shattered-wilds/commons';

export const classes = Object.values(CLASS_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Classes',
		groupSlug: 'Classes',
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
				value: `${def.role} (${def.primaryAttribute})`,
				cssClass: 'metadata-source',
			},
			{
				key: 'flavor',
				title: 'Flavor',
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
