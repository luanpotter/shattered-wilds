import { slugify } from '@shattered-wilds/commons';
import { CLASS_ROLES, CLASS_REALMS } from '@shattered-wilds/d12';

export const roles = Object.values(CLASS_ROLES).map(def => {
	const title = `${def.name} ${def.realm}`;
	const slug = slugify(title);

	return {
		// wiki parameters
		group: 'Class Roles',
		groupSlug: 'Classes',
		slug,
		title,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [
			{
				key: 'realm',
				title: 'Realm',
				value: `${def.realm} (${CLASS_REALMS[def.realm].realm})`,
				cssClass: 'metadata-type',
			},
			{
				key: 'role',
				title: 'Primary Attribute',
				slug: slugify(def.primaryAttribute.name),
				value: def.primaryAttribute.name,
				cssClass: 'metadata-source',
			},
		],

		// other parameters
		name: def.name,
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
	};
});
