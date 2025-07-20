import { CLASS_DEFINITIONS } from '@shattered-wilds/commons';

export const classes = Object.values(CLASS_DEFINITIONS).map(def => ({
	// wiki parameters
	slug: `${def.name}`,
	title: `${def.name}`,
	url: `/wiki/Class_${def.name}/`,

	// class parameters
	name: def.name,
	realm: def.realm,
	primaryAttribute: def.primaryAttribute,
	role: def.role,
	flavor: def.flavor,
}));
