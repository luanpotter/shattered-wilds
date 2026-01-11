import { slugify } from '@shattered-wilds/commons';
import {
	ResourceCost,
	RESOURCES,
	CLASS_FLAVORS,
	CLASS_REALMS,
	CLASS_ROLES,
	ClassFlavor,
	ClassRealm,
	ClassRole,
	Trait,
	TRAITS,
	ActionType,
	ArcaneSpellSchool,
	FeatSource,
	FeatType,
	StatType,
} from '../types/types.js';

export enum MetadataClass {
	Type = 'metadata-type',
	Cost = 'metadata-cost',
	Level = 'metadata-level',
	Trait = 'metadata-trait',
	School = 'metadata-school',
	Category = 'metadata-category',
	Source = 'metadata-source',
}

export const METADATA_CLASSES: Record<MetadataClass, { label: string; color: string }> = {
	[MetadataClass.Type]: { label: 'Type', color: '#4ecdc4' },
	[MetadataClass.Cost]: { label: 'Cost', color: '#ff6b6b' },
	[MetadataClass.Level]: { label: 'Level', color: '#ff6b6b' },
	[MetadataClass.Trait]: { label: 'Trait', color: '#6bff6b' },
	[MetadataClass.School]: { label: 'School', color: '#f06292' },
	[MetadataClass.Category]: { label: 'Category', color: '#abad30' },
	[MetadataClass.Source]: { label: 'Source', color: '#abad30' },
};

export interface WikiMetadata {
	metadataClass: MetadataClass;
	key: WikiMetadataComponent;
	value?: WikiMetadataComponent;
}

export interface WikiMetadataComponent {
	text: string;
	slug?: string | undefined;
}

export const WikiMetadataFrom = {
	type: (type: ActionType | FeatType): WikiMetadata => {
		return {
			metadataClass: MetadataClass.Type,
			key: { text: 'Type' },
			value: { text: type },
		};
	},

	school: (school: ArcaneSpellSchool): WikiMetadata => {
		return {
			metadataClass: MetadataClass.School,
			key: {
				text: 'School',
			},
			value: {
				text: school,
				slug: slugify(school),
			},
		};
	},

	trait: (trait: Trait): WikiMetadata => {
		const def = TRAITS[trait];
		return {
			metadataClass: MetadataClass.Trait,
			key: {
				text: def.name,
				slug: slugify(def.name),
			},
		};
	},

	realm: (realm: ClassRealm): WikiMetadata => {
		return {
			metadataClass: MetadataClass.Type,
			key: { text: 'Realm' },
			value: {
				text: `${realm} (${CLASS_REALMS[realm].realm})`,
				slug: slugify(realm),
			},
		};
	},

	attribute: (attribute: StatType): WikiMetadata => {
		return {
			metadataClass: MetadataClass.Source,
			key: { text: 'Primary Attribute' },
			value: { text: attribute.name, slug: slugify(attribute.name) },
		};
	},

	role: (role: ClassRole): WikiMetadata => {
		return {
			metadataClass: MetadataClass.Source,
			key: { text: 'Role' },
			value: {
				text: `${role} (${CLASS_ROLES[role].realm})`,
				slug: slugify(role),
			},
		};
	},

	flavor: (flavor: ClassFlavor): WikiMetadata => {
		return {
			metadataClass: MetadataClass.Source,
			key: { text: 'Flavor' },
			value: {
				text: `${flavor} (${CLASS_FLAVORS[flavor].realm})`,
				slug: slugify(flavor),
			},
		};
	},

	source: (source: FeatSource): WikiMetadata => {
		const sourceToSlug = (source: FeatSource): string | undefined => {
			if (source in CLASS_FLAVORS) {
				const flavor = CLASS_FLAVORS[source as ClassFlavor];
				return slugify(`${flavor.name} ${flavor.realm}`);
			}
			if (source in CLASS_ROLES) {
				const role = CLASS_ROLES[source as ClassRole];
				return slugify(`${role.name} ${role.realm}`);
			}
			if (source === 'General') {
				return 'Feat';
			}
			return undefined;
		};

		return {
			metadataClass: MetadataClass.Source,
			key: { text: 'Source' },
			value: { text: source, slug: sourceToSlug(source) },
		};
	},

	cost: (cost: ResourceCost, { force }: { force: boolean }): WikiMetadata | undefined => {
		const resource = cost.resource;
		const amount = cost?.amount ?? 0;
		if (amount === 0 && !force) {
			return undefined;
		}

		const resourceDef = RESOURCES[resource];
		return WikiMetadataFrom.numeric({
			key: resourceDef.shortCode,
			keySlug: slugify(resourceDef.fullName),
			value: amount,
			variable: cost?.variable === true,
		});
	},

	numeric: ({
		key,
		value,
		variable = false,
		keySlug,
	}: {
		key: string;
		value: number;
		variable?: boolean;
		keySlug?: string;
	}) => {
		return {
			metadataClass: MetadataClass.Cost,
			key: { text: key, slug: keySlug },
			value: { text: `${value}${variable ? '+' : ''}` },
		};
	},
};
