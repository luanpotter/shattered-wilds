// sadly TS sucks and there is no easy way to de/serialize polymorphic types
// I've spent too much time on this - I will just write a hacky serializer for now
import { ArcaneComponentMode, ArmorMode, Item, ShieldMode, WeaponMode } from './equipment.js';
import { Bonus, Distance } from '../stats/value.js';
import { ResourceCost } from '../stats/resources.js';
export const EquipmentSerializer = {
    serialize(equipment) {
        const serializedItems = equipment.map(item => serializeItem(item));
        return JSON.stringify(serializedItems);
    },
    deserialize(data) {
        try {
            const serializedItems = JSON.parse(data);
            return serializedItems.map(itemData => deserializeItem(itemData));
        }
        catch (e) {
            console.log('-----------------------------');
            console.error('Failed to deserialize equipment:', e);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log(JSON.parse(data).map(e => e.name));
            console.log('-----------------------------');
            return [];
        }
    },
};
const serializeItem = (item) => {
    const pojo = {
        name: item.name,
        slot: item.slot,
        isEquipped: item.isEquipped,
        traits: [...item.traits],
        modes: item.modes.map(mode => serializeItemMode(mode)),
    };
    return JSON.stringify(pojo);
};
const serializeItemMode = (mode) => {
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
const deserializeItem = (data) => {
    const pojo = JSON.parse(data);
    const modes = (pojo.modes ?? []).map(mode => deserializeItemMode(mode));
    return new Item({
        name: pojo.name,
        slot: pojo.slot,
        isEquipped: pojo.isEquipped ?? false,
        traits: pojo.traits ?? [],
        modes,
    });
};
const deserializeItemMode = (data) => {
    const { __type, ...props } = data;
    switch (__type) {
        case 'WeaponMode':
            return new WeaponMode({
                type: props.type,
                bonus: deserializeBonus(props.bonus),
                range: deserializeDistance(props.range),
                costs: deserializeResourceCosts(props.costs),
            });
        case 'ArmorMode':
            return new ArmorMode({
                type: props.type,
                bonus: deserializeBonus(props.bonus),
                dexPenalty: deserializeBonus(props.dexPenalty),
            });
        case 'ShieldMode':
            return new ShieldMode({
                type: props.type,
                bonus: deserializeBonus(props.bonus),
                costs: deserializeResourceCosts(props.costs),
            });
        case 'ArcaneComponentMode':
            return new ArcaneComponentMode({
                category: props.category,
                component: props.component,
                bonus: deserializeBonus(props.bonus),
                costs: deserializeResourceCosts(props.costs),
            });
        default:
            throw new Error(`Unknown ItemMode type: ${__type}`);
    }
};
const serializeBonus = (bonus) => {
    if (!bonus) {
        return undefined;
    }
    return { value: bonus.value };
};
const deserializeBonus = (data) => {
    if (!data || typeof data !== 'object' || typeof data.value !== 'number') {
        throw new Error('Invalid Bonus data during deserialization');
    }
    return Bonus.of(data.value);
};
const serializeDistance = (distance) => {
    if (!distance) {
        return undefined;
    }
    return { value: distance.value };
};
const deserializeDistance = (data) => {
    if (!data) {
        return undefined;
    }
    if (typeof data !== 'object' || typeof data.value !== 'number') {
        throw new Error('Invalid Distance data during deserialization');
    }
    return Distance.of(data.value);
};
const serializeResourceCost = (cost) => ({
    resource: cost.resource,
    amount: cost.amount,
    variable: cost.variable,
});
const deserializeResourceCost = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid ResourceCost data during deserialization');
    }
    const { resource, amount, variable } = data;
    if (typeof resource !== 'string') {
        throw new Error('Invalid Resource identifier during deserialization');
    }
    if (typeof amount !== 'number') {
        throw new Error('Invalid ResourceCost amount during deserialization');
    }
    const props = {
        resource: resource,
        amount,
    };
    if (typeof variable === 'boolean') {
        props.variable = variable;
    }
    return new ResourceCost(props);
};
const deserializeResourceCosts = (data) => {
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map(deserializeResourceCost);
};
//# sourceMappingURL=equipment-serializer.js.map