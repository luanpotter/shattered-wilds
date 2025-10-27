import { CLASS_FLAVORS, CLASS_ROLES, FEATS, slugify } from '@shattered-wilds/commons';

export const feats = Object.values(FEATS).map(feat => {
	const slug = slugify(feat.name);

	const sourceToSlug = source => {
		const maybeFlavor = CLASS_FLAVORS[source];
		if (maybeFlavor) {
			return `${maybeFlavor.name} ${maybeFlavor.realm}`;
		}
		const maybeRole = CLASS_ROLES[source];
		if (maybeRole) {
			return `${maybeRole.name} ${maybeRole.realm}`;
		}
		return source;
	};

	return {
		// wiki parameters
		group: 'Feat',
		groupSlug: 'Feat',
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
				key: 'level',
				title: 'Level',
				value: feat.level,
				cssClass: 'metadata-level',
			},
			...feat.sources.map(source => ({
				key: 'source',
				title: 'Source',
				slug: slugify(sourceToSlug(source)),
				value: source,
				cssClass: 'metadata-source',
			})),
		],

		// other parameters
		name: feat.name,
		type: feat.type,
		category: feat.category,
		sources: feat.sources,
		level: feat.level,
		description: feat.description,
		isCore: feat.type === 'Core',
		isMajor: feat.type === 'Major',
		isMinor: feat.type === 'Minor',
		isNotCore: feat.type !== 'Core',
		isNotMajor: feat.type !== 'Major',
		isNotMinor: feat.type !== 'Minor',
	};
});
