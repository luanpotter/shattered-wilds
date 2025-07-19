import { StatNode, StatType } from '../../types';

export const handleAllocatePoint = (
	node: StatNode,
	disabled: boolean,
	onUpdateCharacterProp: (key: string, value: string) => void,
) => {
	if (!disabled && node.canAllocatePoint) {
		onUpdateCharacterProp(node.type.name, (node.points + 1).toString());
	}
};

export const handleDeallocatePoint = (
	node: StatNode,
	disabled: boolean,
	onUpdateCharacterProp: (key: string, value: string) => void,
) => {
	if (!disabled && node.canDeallocatePoint) {
		onUpdateCharacterProp(node.type.name, (node.points - 1).toString());
	}
};

export const getRealmBackgroundColor = (realmType: StatType): string => {
	switch (realmType) {
		case StatType.Body:
			return 'rgba(255, 100, 100, 0.1)';
		case StatType.Mind:
			return 'rgba(100, 100, 255, 0.1)';
		case StatType.Soul:
			return 'rgba(100, 255, 100, 0.1)';
		default:
			throw new Error(`Unhandled realm type: ${realmType}`);
	}
};

export const findAttributeByType = (realm: StatNode | undefined, type: StatType): StatNode | undefined => {
	return realm?.children.find(attr => attr.type === type);
};
