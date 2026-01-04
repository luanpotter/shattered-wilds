// sadly TS sucks and there is no easy way to de/serialize polymorphic types
// I've spent too much time on this - I will just write a hacky serializer for now

import { ArcaneComponentMode, ArmorMode, Item, ItemMode, ShieldMode, SlotType, WeaponMode } from './equipment.js';
import { Bonus, Distance } from '../stats/value.js';
import { ResourceCost } from '../stats/resources.js';

export const EquipmentSerializer = {
	serialize(equipment: Item[]): string {
		const serializedItems = equipment.map(item => serializeItem(item));
		return JSON.stringify(serializedItems);
	},

	deserialize(data: string): Item[] {
		try {
			const serializedItems: string[] = JSON.parse(data);
			return serializedItems.map(itemData => deserializeItem(itemData));
		} catch (e) {
			console.log('-----------------------------');
			console.error('Failed to deserialize equipment:', e);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			console.log((JSON.parse(data) as any[]).map(e => e.name));
			console.log('-----------------------------');
			return [];
		}
	},
};

const serializeItem = (item: Item): string => {
	const pojo = {
		name: item.name,
		slot: item.slot,
		traits: [...item.traits],
		modes: item.modes.map(mode => serializeItemMode(mode)),
	};
	return JSON.stringify(pojo);
};

const serializeItemMode = (mode: ItemMode): unknown => {
	if (mode instanceof WeaponMode) {
		return {
			__type: 'WeaponMode',
			type: mode.type,
			bonus: serializeBonus(mode.bonus),
			range: serializeDistance(mode.range),
			costs: mode.costs.map(serializeResourceCost),
		};
	}

	if (mode instanceof ArmorMode) {
		return {
			__type: 'ArmorMode',
			type: mode.type,
			bonus: serializeBonus(mode.bonus),
			dexPenalty: serializeBonus(mode.dexPenalty),
			costs: mode.costs.map(serializeResourceCost),
		};
	}

	if (mode instanceof ShieldMode) {
		return {
			__type: 'ShieldMode',
			type: mode.type,
			bonus: serializeBonus(mode.bonus),
			costs: mode.costs.map(serializeResourceCost),
		};
	}

	if (mode instanceof ArcaneComponentMode) {
		return {
			__type: 'ArcaneComponentMode',
			category: mode.category,
			component: mode.component,
			bonus: serializeBonus(mode.bonus),
			costs: mode.costs.map(serializeResourceCost),
		};
	}

	throw new Error(`Unsupported ItemMode subtype: ${mode.constructor.name}`);
};

const deserializeItem = (data: string): Item => {
	const pojo = JSON.parse(data) as {
		name: string;
		slot: string;
		traits?: Item['traits'];
		modes?: { __type: string; [key: string]: unknown }[];
	};
	const modes = (pojo.modes ?? []).map(mode => deserializeItemMode(mode));
	return new Item({
		name: pojo.name,
		slot: pojo.slot as SlotType,
		traits: pojo.traits ?? [],
		modes,
	});
};

const deserializeItemMode = (data: { __type: string; [key: string]: unknown }): ItemMode => {
	const { __type, ...props } = data;
	switch (__type) {
		case 'WeaponMode':
			return new WeaponMode({
				type: props.type as WeaponMode['type'],
				bonus: deserializeBonus(props.bonus),
				range: deserializeDistance(props.range),
				costs: deserializeResourceCosts(props.costs),
			});
		case 'ArmorMode':
			return new ArmorMode({
				type: props.type as ArmorMode['type'],
				bonus: deserializeBonus(props.bonus),
				dexPenalty: deserializeBonus(props.dexPenalty),
			});
		case 'ShieldMode':
			return new ShieldMode({
				type: props.type as ShieldMode['type'],
				bonus: deserializeBonus(props.bonus),
				costs: deserializeResourceCosts(props.costs),
			});
		case 'ArcaneComponentMode':
			return new ArcaneComponentMode({
				category: props.category as ArcaneComponentMode['category'],
				component: props.component as ArcaneComponentMode['component'],
				bonus: deserializeBonus(props.bonus),
				costs: deserializeResourceCosts(props.costs),
			});
		default:
			throw new Error(`Unknown ItemMode type: ${__type}`);
	}
};

type SerializedBonus = { value: number } | undefined;

const serializeBonus = (bonus: Bonus | undefined): SerializedBonus => {
	if (!bonus) {
		return undefined;
	}
	return { value: bonus.value };
};

const deserializeBonus = (data: unknown): Bonus => {
	if (!data || typeof data !== 'object' || typeof (data as SerializedBonus & { value?: unknown }).value !== 'number') {
		throw new Error('Invalid Bonus data during deserialization');
	}
	return Bonus.of((data as { value: number }).value);
};

type SerializedDistance = { value: number } | undefined;

const serializeDistance = (distance: Distance | undefined): SerializedDistance => {
	if (!distance) {
		return undefined;
	}
	return { value: distance.value };
};

const deserializeDistance = (data: unknown): Distance | undefined => {
	if (!data) {
		return undefined;
	}
	if (typeof data !== 'object' || typeof (data as { value?: unknown }).value !== 'number') {
		throw new Error('Invalid Distance data during deserialization');
	}
	return Distance.of((data as { value: number }).value);
};

type SerializedResourceCost = {
	resource: ResourceCost['resource'];
	amount: number;
	variable?: boolean;
};

const serializeResourceCost = (cost: ResourceCost): SerializedResourceCost => ({
	resource: cost.resource,
	amount: cost.amount,
	variable: cost.variable,
});

const deserializeResourceCost = (data: unknown): ResourceCost => {
	if (!data || typeof data !== 'object') {
		throw new Error('Invalid ResourceCost data during deserialization');
	}
	const { resource, amount, variable } = data as Partial<SerializedResourceCost>;
	if (typeof resource !== 'string') {
		throw new Error('Invalid Resource identifier during deserialization');
	}
	if (typeof amount !== 'number') {
		throw new Error('Invalid ResourceCost amount during deserialization');
	}
	const props: ConstructorParameters<typeof ResourceCost>[0] = {
		resource: resource as ResourceCost['resource'],
		amount,
	};
	if (typeof variable === 'boolean') {
		props.variable = variable;
	}
	return new ResourceCost(props);
};

const deserializeResourceCosts = (data: unknown): ResourceCost[] => {
	if (!Array.isArray(data)) {
		return [];
	}
	return data.map(deserializeResourceCost);
};
