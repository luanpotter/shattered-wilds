import { CharacterSheet } from '@shattered-wilds/d12';
import React from 'react';
import { FaCopy, FaExpand } from 'react-icons/fa';

import { useStore } from '../store';
import { getBasicAttacksFor } from '../types/grid-actions';
import { Modal as ModalType } from '../types/ui';
import { copyCharacterDataToClipboard } from '../utils/clipboard';
import { Navigator, Route } from '../utils/routes';

import { CharacterSheetModal } from './CharacterSheet';
import {
	AddConditionModal,
	AddConsequenceModal,
	AddItemModal,
	AttackActionModal,
	BasicAttacksModal,
	CharacterCreationModal,
	ClassSetupModal,
	ColorPickerModal,
	ConfirmationModal,
	ConsumeResourceModal,
	DiceRollModal,
	EncounterConfigModal,
	FeatParameterSetupModal,
	FeatSelectionModal,
	FeatsModal,
	IconSelectionModal,
	MeasureModal,
	ModalWrapper,
	RaceSetupModal,
	TurnTrackerModal,
} from './modals';
import { CharacterListModal } from './modals/CharacterListModal';
import { ErrorModal } from './modals/ErrorModal';
import { LexiconModal } from './modals/LexiconModal';
import { OmniBoxModal } from './modals/OmniBoxModal';
import { Button } from './shared/Button';

interface ModalRendererProps {
	modal: ModalType;
	onStartDrag: (e: React.MouseEvent) => void;
}

export const ModalRenderer: React.FC<ModalRendererProps> = ({ modal, onStartDrag }) => {
	const characters = useStore(state => state.characters);
	const removeModal = useStore(state => state.removeModal);

	const handleCopyCharacterSheet = (characterId: string) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) return;
		copyCharacterDataToClipboard(character);
	};

	const handleExpandCharacterList = () => {
		// Close the character list modal
		removeModal(modal.id);
		// Navigate to the full character sheets page
		Navigator.to(Route.Characters);
	};

	const handleExpandCharacterSheet = (characterId: string) => {
		// Close the character sheet modal
		removeModal(modal.id);
		// Navigate to the specific character sheet page
		Navigator.to(Route.Character, { characterId });
	};

	const generateTitleBarButtons = () => {
		switch (modal.type) {
			case 'character-list':
				return (
					<Button
						onClick={handleExpandCharacterList}
						icon={FaExpand}
						tooltip='Open full character sheets page'
						variant='inline'
					/>
				);
			case 'character-sheet':
				return (
					<>
						<Button
							onClick={() => handleCopyCharacterSheet(modal.characterId)}
							icon={FaCopy}
							tooltip='Copy character sheet'
							variant='inline'
						/>
						<Button
							onClick={() => handleExpandCharacterSheet(modal.characterId)}
							icon={FaExpand}
							tooltip='Open character sheet full page'
							variant='inline'
						/>
					</>
				);
			case 'lexicon':
				return (
					<Button
						onClick={() => Navigator.toWiki(modal.entry.slug)}
						icon={FaExpand}
						tooltip='Open on Site'
						variant='inline'
					/>
				);
			default:
				return null;
		}
	};

	const renderCharacterNotFound = (characterId: string) => {
		return <div>Character not found: {characterId}</div>;
	};

	const renderContent = () => {
		const onClose = () => removeModal(modal.id);

		switch (modal.type) {
			case 'character-list':
				return <CharacterListModal />;
			case 'character-creation':
				return <CharacterCreationModal hexPosition={modal.hexPosition} onClose={onClose} />;
			case 'character-sheet': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <CharacterSheetModal character={character} />;
			}
			case 'race-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <RaceSetupModal characterId={character.id} onClose={onClose} />;
			}
			case 'class-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <ClassSetupModal character={character} onClose={onClose} />;
			}
			case 'feats-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <FeatsModal character={character} onClose={onClose} />;
			}
			case 'basic-attacks': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				const characterSheet = CharacterSheet.from(character.props);
				return (
					<BasicAttacksModal
						attacks={getBasicAttacksFor(characterSheet)}
						characterSheet={characterSheet}
						onClose={onClose}
					/>
				);
			}
			case 'dice-roll': {
				return (
					<DiceRollModal
						characterId={modal.characterId}
						check={modal.check}
						onClose={onClose}
						onDiceRollComplete={modal.onDiceRollComplete}
						{...(modal.initialTargetDC !== undefined && { initialTargetDC: modal.initialTargetDC })}
					/>
				);
			}
			case 'attack-action':
				return (
					<AttackActionModal
						attackerId={modal.attackerId}
						defenderId={modal.defenderId}
						attackIndex={modal.attackIndex}
						onClose={() => {
							onClose();
							modal.onClose();
						}}
					/>
				);
			case 'measure': {
				const fromCharacter = characters.find(c => c.id === modal.fromCharacterId);
				if (!fromCharacter) {
					return renderCharacterNotFound(modal.fromCharacterId);
				}
				return (
					<MeasureModal
						fromCharacter={fromCharacter}
						toPosition={modal.toPosition}
						distance={modal.distance}
						onClose={() => {
							onClose();
							modal.onClose();
						}}
						onMove={modal.onMove}
					/>
				);
			}
			case 'consume-resource': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <ConsumeResourceModal character={character} costs={modal.costs} onClose={onClose} />;
			}
			case 'feat-selection': {
				return <FeatSelectionModal characterId={modal.characterId} slot={modal.slot} onClose={onClose} />;
			}
			case 'feat-parameter-setup': {
				return (
					<FeatParameterSetupModal
						characterId={modal.characterId}
						slot={modal.slot}
						baseFeat={modal.baseFeat}
						onClose={onClose}
					/>
				);
			}
			case 'item': {
				return <AddItemModal characterId={modal.characterId} itemIndex={modal.itemIndex} onClose={onClose} />;
			}
			case 'add-condition': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <AddConditionModal characterId={modal.characterId} onClose={onClose} onConfirm={modal.onConfirm} />;
			}
			case 'add-consequence': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <AddConsequenceModal characterId={modal.characterId} onClose={onClose} onConfirm={modal.onConfirm} />;
			}
			case 'confirmation': {
				return (
					<ConfirmationModal
						message={modal.message}
						{...(modal.confirmText && { confirmText: modal.confirmText })}
						{...(modal.cancelText && { cancelText: modal.cancelText })}
						onConfirm={() => {
							modal.onConfirm();
							onClose();
						}}
						onCancel={() => {
							modal.onCancel();
							onClose();
						}}
					/>
				);
			}
			case 'error': {
				return <ErrorModal message={modal.message} onClose={onClose} />;
			}
			case 'encounter-config': {
				return <EncounterConfigModal encounterId={modal.encounterId} onClose={onClose} />;
			}
			case 'turn-tracker': {
				return <TurnTrackerModal encounterId={modal.encounterId} />;
			}
			case 'color-picker': {
				return <ColorPickerModal currentColor={modal.currentColor} onSelect={modal.onColorChange} onClose={onClose} />;
			}
			case 'icon-selection': {
				return <IconSelectionModal currentIcon={modal.currentIcon} onSelect={modal.onSelect} onClose={onClose} />;
			}
			case 'omni-box': {
				return <OmniBoxModal context={modal.context} onClose={onClose} />;
			}
			case 'lexicon': {
				return <LexiconModal entry={modal.entry} onClose={onClose} />;
			}
		}
	};

	return (
		<ModalWrapper modal={modal} onStartDrag={onStartDrag} titleBarButtons={generateTitleBarButtons()}>
			{renderContent()}
		</ModalWrapper>
	);
};
