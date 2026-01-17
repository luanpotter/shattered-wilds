import { HexCoord } from '@shattered-wilds/commons';
import { Check, FeatDefinition, FeatSlot, Condition, Consequence, ResourceCost, WikiDatum } from '@shattered-wilds/d12';
import { ReactNode } from 'react';

import { OmniBoxContext } from '../components/omni/OmniBoxContext';
import { Button } from '../components/shared/Button';
import { RichText } from '../components/shared/RichText';
import { useStore } from '../store';
import { AttackActionInitialConfig, Modal, ModalPositionType } from '../types/ui';
import { Mouse } from '../utils/mouse';
import { DistributiveOmit } from '../utils/types';

import { calculateModalPosition, useTempModals } from './useTempModals';

// Types for displayModal
export interface DisplayModalOptions {
	ownerModalId?: string | null;
	title: string;
	content: ReactNode;
	widthPixels?: number;
	heightPixels?: number;
	positionType?: ModalPositionType;
}

export interface DisplayConfirmationOptions {
	ownerModalId?: string | null;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	widthPixels?: number;
}

export const useModals = () => {
	const modals = useStore(state => state.modals);
	const addModalStore = useStore(state => state.addModal);
	const updateModal = useStore(state => state.updateModal);
	const removeModal = useStore(state => state.removeModal);
	const characters = useStore(state => state.characters);

	// Temp modal context for temporary modals
	const { addTempModal, removeTempModal, closeTempModalsOwnedBy, updateTempModal } = useTempModals();

	const generateModalId = () => window.crypto.randomUUID();

	const addModal = (params: DistributiveOmit<Modal, 'id' | 'position'>) => {
		const positionType = params.positionType ?? ModalPositionType.MousePosition;
		const position = (() => {
			if (positionType === ModalPositionType.ScreenCenter) {
				const screenWidth = window.innerWidth;
				const screenHeight = window.innerHeight;
				const modalWidth = params.widthPixels ?? 600;
				const modalHeight = params.heightPixels ?? 400;

				const yOffset = -150; // prop it up a bit from exact center (entirely feelings based)
				return {
					x: (screenWidth - modalWidth) / 2,
					y: (screenHeight - modalHeight) / 2 + yOffset,
				};
			} else if (positionType === ModalPositionType.MousePosition) {
				const mousePosition = Mouse.getPosition();
				// Use adjusted position to prevent modals from opening off-screen
				return Mouse.getAdjustedPosition(
					mousePosition,
					params.widthPixels && params.heightPixels
						? { width: params.widthPixels, height: params.heightPixels }
						: undefined,
				);
			} else {
				throw new Error(`Unsupported modal position type: ${positionType}`);
			}
		})();

		addModalStore({
			id: generateModalId(),
			position,
			...params,
		});
	};

	// ============================================
	// Temporary Modal System (displayX methods)
	// ============================================

	/**
	 * Display a temporary modal with arbitrary React content.
	 * Returns a promise that resolves when the modal is dismissed.
	 * The modal is NOT persisted to Zustand and will disappear on refresh.
	 *
	 * @param options - Modal configuration including content and optional owner modal ID
	 * @returns Promise that resolves with the value passed to the resolve callback, or undefined if closed
	 */
	const displayModal = <T = void,>(options: DisplayModalOptions): Promise<T | undefined> => {
		const { ownerModalId = null, title, content, widthPixels, heightPixels, positionType } = options;

		const position = calculateModalPosition(positionType, widthPixels, heightPixels);

		return new Promise<T | undefined>(resolve => {
			addTempModal<T | undefined>({
				ownerModalId,
				title,
				position,
				widthPixels,
				heightPixels,
				content,
				resolve,
			});
		});
	};

	/**
	 * Display a confirmation modal as a temporary modal.
	 * Returns a promise that resolves to true if confirmed, false if cancelled,
	 * or undefined if the modal was closed some other way.
	 */
	const displayConfirmationModal = (options: DisplayConfirmationOptions): Promise<boolean> => {
		const {
			ownerModalId = null,
			title = 'Confirm',
			message,
			confirmText = 'Confirm',
			cancelText = 'Cancel',
			widthPixels = 400,
		} = options;

		const position = calculateModalPosition(ModalPositionType.MousePosition, widthPixels, undefined);

		// We need a mutable ref to store the modalId for the handlers
		const modalIdRef = { current: '' };

		const handleConfirm = (resolve: (value: boolean) => void) => {
			resolve(true);
			removeTempModal(modalIdRef.current);
		};

		const handleCancel = (resolve: (value: boolean) => void) => {
			resolve(false);
			removeTempModal(modalIdRef.current);
		};

		return new Promise<boolean>(resolve => {
			const content = (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						gap: '16px',
						height: '100%',
					}}
				>
					<div>
						<RichText>{message}</RichText>
					</div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
						<Button variant='inline' onClick={() => handleCancel(resolve)} title={cancelText} />
						<Button variant='inline' onClick={() => handleConfirm(resolve)} title={confirmText} />
					</div>
				</div>
			);

			modalIdRef.current = addTempModal<boolean>({
				ownerModalId,
				title,
				position,
				widthPixels,
				content,
				resolve,
			});
		});
	};

	/**
	 * Close a temporary modal by ID
	 */
	const closeTempModal = (modalId: string) => {
		removeTempModal(modalId);
	};

	const openCharacterListModal = () => {
		addModal({
			title: 'Characters',
			type: 'character-list',
		});
	};

	const openCharacterCreationModal = ({ hexPosition }: { hexPosition?: HexCoord }) => {
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
			openErrorModal({ message: `Character not found: ${characterId}` });
			return;
		}

		// Check if modal is already open - if so, close it
		const existingModal = modals.find(modal => modal.type === 'character-sheet' && modal.characterId === characterId);
		if (existingModal) {
			return;
		}

		addModal({
			positionType: ModalPositionType.ScreenCenter,
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId,
			widthPixels: 750,
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
			widthPixels: 500,
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
			widthPixels: 700,
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
			widthPixels: 700,
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
		initialConfig,
		onClose,
	}: {
		attackerId: string;
		defenderId: string;
		initialConfig: AttackActionInitialConfig;
		onClose: () => void;
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
			initialConfig,
			onClose,
			widthPixels: 900,
		});
	};

	const openMeasureModal = ({
		fromCharacterId,
		toPosition,
		distance,
		onMove,
		onClose,
	}: {
		fromCharacterId: string;
		toPosition: HexCoord;
		distance: number;
		onMove: () => void;
		onClose: () => void;
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
			onMove,
			onClose,
		});
	};

	const openConsumeResourceModal = ({
		characterId,
		costs,
		title,
	}: {
		characterId: string;
		costs: ResourceCost[];
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
			costs,
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
			widthPixels: 600,
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
			widthPixels: 500,
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

	const openAddConditionModal = ({
		characterId,
		onConfirm,
	}: {
		characterId: string;
		onConfirm: (condition: Condition, rank: number) => void;
	}) => {
		addModal({
			title: 'Add Condition',
			type: 'add-condition',
			characterId,
			onConfirm,
			widthPixels: 500,
		});
	};

	const openAddConsequenceModal = ({
		characterId,
		onConfirm,
	}: {
		characterId: string;
		onConfirm: (consequence: Consequence, rank: number) => void;
	}) => {
		addModal({
			title: 'Add Consequence',
			type: 'add-consequence',
			characterId,
			onConfirm,
			widthPixels: 500,
		});
	};

	const openErrorModal = ({ message }: { message: string }) => {
		addModal({
			title: 'Unexpected Error',
			type: 'error',
			message,
			widthPixels: 400,
		});
	};

	const closeModal = (modalId: string) => {
		// Close any temporary modals owned by this modal
		closeTempModalsOwnedBy(modalId);
		// Then close the modal itself
		removeModal(modalId);
	};

	const closeAllModals = () => {
		modals.forEach(modal => {
			// Close any temporary modals owned by each modal
			closeTempModalsOwnedBy(modal.id);
			removeModal(modal.id);
		});
	};

	const openEncounterConfigModal = ({ encounterId }: { encounterId: string }) => {
		addModal({
			title: 'Encounter Config',
			type: 'encounter-config',
			encounterId,
		});
	};

	const openTurnTrackerModal = ({ encounterId }: { encounterId: string }) => {
		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'turn-tracker' && modal.encounterId === encounterId);
		if (existingModal) return;

		addModal({
			title: 'Turn Tracker',
			type: 'turn-tracker',
			encounterId,
		});
	};

	const openColorPickerModal = ({
		currentColor,
		onColorChange,
	}: {
		currentColor: string;
		onColorChange: (color: string) => void;
	}) => {
		addModal({
			title: 'Pick Color',
			type: 'color-picker',
			currentColor,
			onColorChange,
		});
	};

	const openIconSelectionModal = ({
		currentIcon,
		onSelect,
	}: {
		currentIcon: string | null;
		onSelect: (icon: string) => void;
	}) => {
		addModal({
			title: 'Pick Icon',
			type: 'icon-selection',
			currentIcon,
			onSelect,
		});
	};

	const openOmniBoxModal = ({ context }: { context: OmniBoxContext }) => {
		// Check if modal is already open
		const existingModal = modals.find(modal => modal.type === 'omni-box');
		if (existingModal) {
			removeModal(existingModal.id);
			return;
		}

		addModal({
			positionType: ModalPositionType.ScreenCenter,
			title: 'Omni Box',
			type: 'omni-box',
			context,
			widthPixels: 400,
		});
	};

	const openLexiconModal = ({ entry }: { entry: WikiDatum }) => {
		addModal({
			title: `Lexicon: ${entry.title}`,
			type: 'lexicon',
			entry,
			widthPixels: 600,
		});
	};

	return {
		openCharacterListModal,
		openCharacterCreationModal,
		openCharacterSheetModal,
		openRaceSetupModal,
		openClassSetupModal,
		openFeatsSetupModal,
		openDiceRollModal,
		openAttackActionModal,
		openMeasureModal,
		openConsumeResourceModal,
		openFeatSelectionModal,
		openFeatParameterSetupModal,
		openAddItemModal,
		openViewItemModal,
		openAddConditionModal,
		openAddConsequenceModal,
		openErrorModal,
		openEncounterConfigModal,
		openTurnTrackerModal,
		openColorPickerModal,
		openIconSelectionModal,
		openOmniBoxModal,
		openLexiconModal,
		closeModal,
		closeAllModals,
		updateModal,
		// Temporary modal methods
		displayModal,
		displayConfirmationModal,
		closeTempModal,
		updateTempModal,
	};
};
