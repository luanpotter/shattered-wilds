import { StatNode, StatType } from '@shattered-wilds/commons';

import { useStore } from '../../store';

export const useHandleAllocatePoint = (
	onUpdateCharacterProp: (key: string, value: string) => void,
): ((node: StatNode) => void) => {
	const editMode = useStore(state => state.editMode);
	return (node: StatNode) => {
		if (editMode && node.canAllocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.points + 1).toString());
		}
	};
};

export const useHandleDeallocatePoint = (
	onUpdateCharacterProp: (key: string, value: string) => void,
): ((node: StatNode) => void) => {
	const editMode = useStore(state => state.editMode);
	return (node: StatNode) => {
		if (editMode && node.canDeallocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.points - 1).toString());
		}
	};
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
