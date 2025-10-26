import { CLASS_ROLES, slugify } from '@shattered-wilds/commons';

export const roles = Object.values(CLASS_ROLES).map(def => {
	const title = `${def.name} ${def.realm}`;
	const slug = slugify(title);

	return {
		// wiki parameters
		group: 'Roles',
		groupSlug: 'Classes',
		slug,
		title,
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
				title: 'Primary Attribute',
				value: `${def.primaryAttribute}`,
				cssClass: 'metadata-source',
			},
		],

		// other parameters
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
	};
});
