import { CLASS_FLAVORS, CLASS_REALMS, slugify } from '@shattered-wilds/commons';

export const flavors = Object.values(CLASS_FLAVORS).map(def => {
	const title = `${def.name} ${def.realm}`;
	const slug = slugify(title);

	return {
		// wiki parameters
		group: 'Class Flavors',
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
		],

		// other parameters
		name: def.name,
		realm: def.realm,
	};
});
