import { getEnumKeys, slugify } from '@shattered-wilds/commons';
import { BASIC_EQUIPMENT, getItemType, Item, MODE_TYPE_LABELS } from '../character/equipment.js';
import { ACTIONS } from '../core/actions.js';
import { ARCANE_SCHOOLS, PREDEFINED_ARCANE_SPELLS } from '../core/arcane.js';
import { CLASS_DEFINITIONS, CLASS_FLAVORS, CLASS_ROLES } from '../core/classes.js';
import { CONDITIONS } from '../generated/conditions-data.js';
import { CONSEQUENCES } from '../core/consequences.js';
import { COVER_TYPES } from '../core/cover.js';
import { FEATS } from '../core/feats.js';
import { UPBRINGING_DEFINITIONS } from '../core/races.js';
import { TRAITS } from '../core/traits.js';
import { GENERATED_LEXICON } from '../generated/lexicon.js';
import { DERIVED_STATS } from '../stats/derived-stat.js';
import { Resource, RESOURCES } from '../stats/resources.js';
import { StatType } from '../stats/stat-type.js';
import { MetadataClass, WikiMetadata, WikiMetadataFrom } from './metadata.js';

export interface WikiGroup {
	group: string;
	groupSlug: string;
	globalDataKey: string;
}

export interface WikiDatum {
	slug: string;
	url: string;
	group: string;
	groupSlug: string;
	globalDataKey: string;
	title: string;
	content: string;
	metadata: Array<WikiMetadata>;
	[key: string]: unknown;
}

const buildWiki = ({
	slug,
	group,
	title,
	content,
	metadata = [],
	...other
}: {
	slug: string;
	group: WikiGroup;
	title: string;
	content: string;
	metadata?: Array<WikiMetadata | undefined>;
	[key: string]: unknown;
}): WikiDatum => {
	return {
		slug,
		url: `/wiki/${slug}/`,
		group: group.group,
		groupSlug: group.groupSlug,
		globalDataKey: group.globalDataKey,
		title,
		content,
		metadata: metadata.filter((m): m is WikiMetadata => m !== undefined),
		...other,
	};
};

const actions = Object.values(ACTIONS).map(def => {
	const slug = slugify(def.name);
	const addCostMetadata = (resource: Resource, force: boolean): WikiMetadata | undefined => {
		const cost = def.costs.find(c => c.resource === resource);
		if (!cost) {
			return undefined;
		}
		return WikiMetadataFrom.cost(cost, { force });
	};

	return buildWiki({
		// wiki parameters
		group: { group: 'Action', groupSlug: 'Action', globalDataKey: 'actions' },
		slug,
		title: `${def.name}`,
		content: def.description,
		metadata: [
			WikiMetadataFrom.type(def.type),
			...def.traits.map(WikiMetadataFrom.trait),
			...getEnumKeys(Resource).map(resource => addCostMetadata(resource, resource === Resource.ActionPoint)),
		],

		// other data
		type: def.type,
		traits: def.traits,
	});
});

const arcane = Object.values(PREDEFINED_ARCANE_SPELLS).map((def, idx) => {
	const slug = `${slugify(def.name)}`;

	const combinedModifier = def.augmentations.reduce((acc, augmentation) => acc + augmentation.bonus.value, 0);
	const hasVariableModifier = def.augmentations.some(augmentation => augmentation.variable);

	const group = {
		group: 'Predefined_Arcane_Spells',
		groupSlug: 'Predefined_Arcane_Spells',
		globalDataKey: 'predefinedArcaneSpells',
	};

	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		content: `${def.description}`,
		order: idx,
		metadata: [
			WikiMetadataFrom.school(def.school),
			WikiMetadataFrom.numeric({
				key: 'CM',
				value: -combinedModifier,
				variable: hasVariableModifier,
			}),
			...def.traits.map(WikiMetadataFrom.trait),
		],

		// other parameters
		school: def.school,
		augmentations: def.augmentations.map(augmentation => ({
			...augmentation,
			description: augmentation.description,
		})),
		traits: def.traits,
	});
});

const classes = Object.values(CLASS_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	const group = {
		group: 'Classes',
		groupSlug: 'Classes',
		globalDataKey: 'classes',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		content: def.description,
		metadata: [WikiMetadataFrom.realm(def.realm), WikiMetadataFrom.role(def.role), WikiMetadataFrom.flavor(def.flavor)],

		// other parameters
		name: def.name,
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
		role: def.role,
		flavor: def.flavor,
	});
});

const conditions = Object.values(CONDITIONS).map(def => {
	const slug = `${slugify(def.name)}`;
	const group = {
		group: 'Condition',
		groupSlug: 'Condition',
		globalDataKey: 'conditions',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		content: `${def.description}`,
	});
});

const consequences = Object.values(CONSEQUENCES).map(def => {
	const slug = `${slugify(def.name)}`;
	const group = {
		group: 'Consequence',
		groupSlug: 'Consequence',
		globalDataKey: 'consequences',
	};
	return buildWiki({
		// wiki parameters
		group,
		globalDataKey: 'consequences',
		slug,
		title: `${def.name}`,
		content: `${def.description}`,
	});
});

const covers = Object.values(COVER_TYPES).map(def => {
	const slug = `Cover_${slugify(def.type)}`;
	const group = {
		group: 'Cover',
		groupSlug: 'Cover',
		globalDataKey: 'covers',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `Passive Cover - ${def.type}`,
		content: `${def.bonus.description} (${def.examples})`,
		order: -def.bonus.value,
	});
});

const derivedStats = Object.values(DERIVED_STATS).map(stat => {
	const slug = slugify(stat.name);
	const group = {
		group: 'Derived_Stat',
		groupSlug: 'Derived_Stat',
		globalDataKey: 'derivedStats',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: stat.name,
		content: stat.description,
		metadata: [],

		// other parameters
		name: stat.name,
		description: stat.description,
		formula: stat.formula,
	});
});

const computeTypeLabel = (item: Item): string => {
	const itemType = getItemType(item);
	return itemType ? MODE_TYPE_LABELS[itemType] : 'Other';
};

export const equipment = Object.values(BASIC_EQUIPMENT).map(def => {
	const item = def.generator();
	const slug = slugify(item.name);

	const type = computeTypeLabel(item);
	const bonusForSorting = item.modes.length > 0 ? Math.min(...item.modes.map(mode => mode.bonus.value)) : 0;

	const group = {
		group: 'Equipment',
		groupSlug: 'Equipment',
		globalDataKey: 'equipment',
	};

	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${item.name}`,
		url: `/wiki/${slug}/`,
		content: item.description,
		metadata: [
			{
				metadataClass: MetadataClass.Type,
				key: { text: 'Type' },
				value: { text: type },
			},
			...item.traits.map(WikiMetadataFrom.trait),
		],
		order: bonusForSorting,

		// other data
		type,
		traits: item.traits,
		alternativeNames: def.alternativeNames,
		modes: item.modes.map(mode => ({ description: mode.description })),
	});
});

const feats = Object.values(FEATS).map(feat => {
	const slug = slugify(feat.name);

	const group = {
		group: 'Feat',
		groupSlug: 'Feat',
		globalDataKey: 'feats',
	};
	return buildWiki({
		// wiki parameters
		slug,
		group,
		title: feat.name,
		url: `/wiki/${slug}/`,
		content: feat.description,
		metadata: [
			WikiMetadataFrom.type(feat.type),
			WikiMetadataFrom.numeric({ key: 'Level', value: feat.level }),
			...feat.sources.map(WikiMetadataFrom.source),
		],

		// other parameters
		name: feat.name,
		type: feat.type,
		sources: feat.sources,
		level: feat.level,
		description: feat.description,
		isCore: feat.type === 'Core',
		isMajor: feat.type === 'Major',
		isMinor: feat.type === 'Minor',
		isNotCore: feat.type !== 'Core',
		isNotMajor: feat.type !== 'Major',
		isNotMinor: feat.type !== 'Minor',
	});
});

const flavors = Object.values(CLASS_FLAVORS).map(def => {
	const title = `${def.name} ${def.realm}`;
	const slug = slugify(title);

	const group = {
		group: 'Class Flavors',
		groupSlug: 'Classes',
		globalDataKey: 'flavors',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [WikiMetadataFrom.realm(def.realm)],

		// other parameters
		name: def.name,
		realm: def.realm,
	});
});

const resources = Object.values(RESOURCES).map(resource => {
	const slug = slugify(resource.fullName);
	const group = {
		group: 'Resource',
		groupSlug: 'Resource',
		globalDataKey: 'resources',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: resource.fullName,
		url: `/wiki/${slug}/`,
		content: resource.description,
		metadata: [],

		// other parameters
		name: resource.fullName,
		description: resource.description,
		formula: resource.formula,
	});
});

const roles = Object.values(CLASS_ROLES).map(def => {
	const title = `${def.name} ${def.realm}`;
	const slug = slugify(title);

	const group = {
		group: 'Class Roles',
		groupSlug: 'Classes',
		globalDataKey: 'roles',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [WikiMetadataFrom.realm(def.realm), WikiMetadataFrom.attribute(def.primaryAttribute)],

		// other parameters
		name: def.name,
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
	});
});

const schools = Object.values(ARCANE_SCHOOLS).map(def => {
	const slug = `${slugify(def.name)}`;
	const group = {
		group: 'Arcane_Schools',
		groupSlug: 'Arcane_Schools',
		globalDataKey: 'schools',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	});
});

const stats = StatType.values
	.filter(stat => stat.name)
	.map(stat => {
		const children = StatType.childrenOf(stat);
		const slug = slugify(stat.name);
		const group = {
			group: 'Stat',
			groupSlug: 'Stat',
			globalDataKey: 'stats',
		};
		return buildWiki({
			// wiki parameters
			group,
			slug,
			title: stat.name,
			url: `/wiki/${slug}/`,
			content: stat.description,

			// other parameters
			name: stat.name,
			hierarchy: stat.hierarchy,
			parent: stat.parent?.name,
			description: stat.description,
			longDescription: stat.longDescription,
			exampleUsages: stat.exampleUsages,
			children: children.map(child => child.name),
			childHierarchy: children[0]?.hierarchy ?? null,
		});
	});

const traits = Object.values(TRAITS).map(def => {
	const slug = slugify(def.name);
	const group = {
		group: 'Trait',
		groupSlug: 'Trait',
		globalDataKey: 'traits',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [
			{
				metadataClass: MetadataClass.Trait,
				key: { text: def.target, slug: slugify(def.target) },
			},
		],

		// other data
		target: def.target,
	});
});

const upbringings = Object.values(UPBRINGING_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	const group = {
		group: 'Upbringings',
		groupSlug: 'Upbringings',
		globalDataKey: 'upbringings',
	};
	return buildWiki({
		// wiki parameters
		group,
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
	});
});

// Lexicon entries from generated markdown files
const lexicon = Object.entries(GENERATED_LEXICON).map(([slug, content]) => {
	const group = {
		group: 'Lexicon',
		groupSlug: 'Lexicon',
		globalDataKey: 'lexicon',
	};
	return buildWiki({
		group,
		slug,
		title: slug.replace(/_/g, ' '),
		url: `/wiki/${slug}/`,
		content,
	});
});

export const WIKI = [
	...actions,
	...arcane,
	...classes,
	...conditions,
	...consequences,
	...covers,
	...derivedStats,
	...equipment,
	...feats,
	...flavors,
	...lexicon,
	...resources,
	...roles,
	...schools,
	...stats,
	...traits,
	...upbringings,
]

	.filter(e => e.slug)
	.sort((a, b) => a.title.localeCompare(b.title));
