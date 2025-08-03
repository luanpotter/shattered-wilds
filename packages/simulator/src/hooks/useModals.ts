import { ActionCost, Check } from '@shattered-wilds/commons';

import { useStore } from '../store';
import { HexPosition } from '../types';
import { findNextWindowPosition } from '../utils';

interface CharacterCreationModalParams {
	hexPosition?: HexPosition;
}

export function useModals() {
	const modals = useStore(state => state.modals);
	const addModal = useStore(state => state.addModal);
	const updateModal = useStore(state => state.updateModal);
	const removeModal = useStore(state => state.removeModal);
	const characters = useStore(state => state.characters);

	const generateModalId = () => window.crypto.randomUUID();

	const getNextPosition = () => findNextWindowPosition(modals);

	const openCharacterListModal = () => {
		addModal({
			id: generateModalId(),
			title: 'Characters',
			type: 'character-list',
			position: getNextPosition(),
		});
	};

	const openCharacterCreationModal = ({ hexPosition }: CharacterCreationModalParams = {}) => {
		const title = hexPosition ? `Create Character (${hexPosition.q}, ${hexPosition.r})` : 'Create Character';

		addModal({
			id: generateModalId(),
			title,
			type: 'character-creation',
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${character.props.name}'s Race Setup`,
			type: 'race-setup',
			characterId,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${character.props.name}'s Class Setup`,
			type: 'class-setup',
			characterId,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${character.props.name}'s Feats`,
			type: 'feats-setup',
			characterId,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${character.props.name}'s Basic Attacks`,
			type: 'basic-attacks',
			characterId,
			position: getNextPosition(),
		});
	};

	const openDiceRollModal = ({
		characterId,
		check,
		onDiceRollComplete,
		title,
		initialTargetDC,
	}: {
		characterId: string;
		check: Check;
		onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
		title?: string;
		initialTargetDC?: number;
	}) => {
		addModal({
			id: generateModalId(),
			title: title ?? 'Roll Dice',
			type: 'dice-roll',
			characterId,
			check,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `${attacker.props.name} attacks ${defender.props.name}`,
			type: 'attack-action',
			attackerId,
			defenderId,
			attackIndex,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: `Measure Distance`,
			type: 'measure',
			fromCharacterId,
			toPosition,
			distance,
			position: getNextPosition(),
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
			id: generateModalId(),
			title: title ?? 'Consume Resources',
			type: 'consume-resource',
			characterId,
			actionCosts,
			position: getNextPosition(),
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
		closeModal,
		closeAllModals,
		updateModal,
	};
}
