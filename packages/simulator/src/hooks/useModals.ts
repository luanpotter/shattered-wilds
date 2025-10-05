import { ActionCost, Check, FeatDefinition, FeatSlot } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { HexPosition, Modal } from '../types/ui';
import { Mouse } from '../utils/mouse';
import { DistributiveOmit } from '../utils/types';

export function useModals() {
	const modals = useStore(state => state.modals);
	const addModalStore = useStore(state => state.addModal);
	const updateModal = useStore(state => state.updateModal);
	const removeModal = useStore(state => state.removeModal);
	const characters = useStore(state => state.characters);

	const generateModalId = () => window.crypto.randomUUID();

	const addModal = (params: DistributiveOmit<Modal, 'id' | 'position'>) => {
		addModalStore({
			id: generateModalId(),
			position: Mouse.getPosition(),
			...params,
		});
	};

	const openCharacterListModal = () => {
		addModal({
			title: 'Characters',
			type: 'character-list',
		});
	};

	const openCharacterCreationModal = ({ hexPosition }: { hexPosition?: HexPosition }) => {
		const title = hexPosition ? `Create Character (${hexPosition.q}, ${hexPosition.r})` : 'Create Character';
		addModal({
			title,
			type: 'character-creation',
			...(hexPosition && { hexPosition }),
		});
	};

	const openCharacterSheetModal = ({ characterId }: { characterId: string }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'character-sheet' && modal.characterId === characterId);
		if (existingModal) return;

		addModal({
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId,
			width: '750px',
		});
	};

	const openRaceSetupModal = ({ characterId }: { characterId: string }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'race-setup' && modal.characterId === characterId);
		if (existingModal) return;

		addModal({
			title: `${character.props.name}'s Race Setup`,
			type: 'race-setup',
			characterId,
			width: '500px',
		});
	};

	const openClassSetupModal = ({ characterId }: { characterId: string }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'class-setup' && modal.characterId === characterId);
		if (existingModal) return;

		addModal({
			title: `${character.props.name}'s Class Setup`,
			type: 'class-setup',
			characterId,
			width: '700px',
		});
	};

	const openFeatsSetupModal = ({ characterId }: { characterId: string }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'feats-setup' && modal.characterId === characterId);
		if (existingModal) return;

		addModal({
			title: `${character.props.name}'s Feats`,
			type: 'feats-setup',
			characterId,
			width: '700px',
		});
	};

	const openBasicAttacksModal = ({ characterId }: { characterId: string }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'basic-attacks' && modal.characterId === characterId);
		if (existingModal) return;

		addModal({
			title: `${character.props.name}'s Basic Attacks`,
			type: 'basic-attacks',
			characterId,
		});
	};

	const openDiceRollModal = ({
		characterId,
		check,
		onDiceRollComplete,
		initialTargetDC,
	}: {
		characterId: string;
		check: Check;
		onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
		initialTargetDC?: number;
	}) => {
		addModal({
			title: check.descriptor,
			type: 'dice-roll',
			characterId,
			check,
			...(onDiceRollComplete && { onDiceRollComplete }),
			...(initialTargetDC !== undefined && { initialTargetDC }),
		});
	};

	const openAttackActionModal = ({
		attackerId,
		defenderId,
		attackIndex,
	}: {
		attackerId: string;
		defenderId: string;
		attackIndex: number;
	}) => {
		const attacker = characters.find(c => c.id === attackerId);
		const defender = characters.find(c => c.id === defenderId);

		if (!attacker || !defender) {
			console.error('Attacker or defender not found:', { attackerId, defenderId });
			return;
		}

		addModal({
			title: `${attacker.props.name} attacks ${defender.props.name}`,
			type: 'attack-action',
			attackerId,
			defenderId,
			attackIndex,
		});
	};

	const openMeasureModal = ({
		fromCharacterId,
		toPosition,
		distance,
	}: {
		fromCharacterId: string;
		toPosition: HexPosition;
		distance: number;
	}) => {
		const character = characters.find(c => c.id === fromCharacterId);
		if (!character) {
			console.error('Character not found:', fromCharacterId);
			return;
		}

		addModal({
			title: `Measure Distance`,
			type: 'measure',
			fromCharacterId,
			toPosition,
			distance,
		});
	};

	const openConsumeResourceModal = ({
		characterId,
		actionCosts,
		title,
	}: {
		characterId: string;
		actionCosts: ActionCost[];
		title?: string;
	}) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		addModal({
			title: title ?? 'Consume Resources',
			type: 'consume-resource',
			characterId,
			actionCosts,
		});
	};

	const openFeatSelectionModal = ({ characterId, slot }: { characterId: string; slot: FeatSlot }) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		addModal({
			title: `Select ${slot.type} Feat for Level ${slot.level}`,
			type: 'feat-selection',
			characterId,
			slot,
			width: '600px',
		});
	};

	const openFeatParameterSetupModal = ({
		characterId,
		slot,
		baseFeat,
	}: {
		characterId: string;
		// note: typically core feats (no slots) are not configurable,
		//       except if they have a independentlyChosen parameter
		slot: FeatSlot | undefined;
		baseFeat: FeatDefinition<string | void>;
	}) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) {
			console.error('Character not found:', characterId);
			return;
		}

		addModal({
			title: `Configure ${baseFeat.name}`,
			type: 'feat-parameter-setup',
			characterId,
			slot,
			baseFeat,
			width: '500px',
		});
	};

	const openAddItemModal = ({ characterId }: { characterId: string }) => {
		addModal({
			title: 'Add Item',
			type: 'item',
			characterId,
		});
	};

	const openViewItemModal = ({ characterId, itemIndex }: { characterId: string; itemIndex: number }) => {
		addModal({
			title: 'View Item',
			type: 'item',
			characterId,
			itemIndex,
		});
	};

	const closeModal = (modalId: string) => {
		removeModal(modalId);
	};

	const closeAllModals = () => {
		modals.forEach(modal => {
			removeModal(modal.id);
		});
	};

	return {
		openCharacterListModal,
		openCharacterCreationModal,
		openCharacterSheetModal,
		openRaceSetupModal,
		openClassSetupModal,
		openFeatsSetupModal,
		openBasicAttacksModal,
		openDiceRollModal,
		openAttackActionModal,
		openMeasureModal,
		openConsumeResourceModal,
		openFeatSelectionModal,
		openFeatParameterSetupModal,
		openAddItemModal,
		openViewItemModal,
		closeModal,
		closeAllModals,
		updateModal,
	};
}
