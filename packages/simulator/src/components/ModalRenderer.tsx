import React from 'react';
import { FaCopy, FaExpand } from 'react-icons/fa';

import { useStore } from '../store';
import { Modal as ModalType, CharacterSheet } from '../types';
import { copyCharacterDataToClipboard } from '../utils/clipboard';
import { Navigator } from '../utils/routes';

import { CharacterList } from './CharacterList';
import { CharacterSheetModal } from './CharacterSheet';
import {
	ModalWrapper,
	CharacterCreationModal,
	BasicAttacksModal,
	MeasureModal,
	FeatsModal,
	FeatSelectionModal,
	FeatParameterSetupModal,
	DiceRollModal,
	ClassSetupModal,
	ConsumeResourceModal,
	RaceSetupModal,
	AttackActionModal,
} from './modals';
import { Button } from './shared/Button';

interface ModalRendererProps {
	modal: ModalType;
	onStartDrag: (e: React.MouseEvent) => void;
}

export const ModalRenderer: React.FC<ModalRendererProps> = ({ modal, onStartDrag }) => {
	const characters = useStore(state => state.characters);
	const removeModal = useStore(state => state.removeModal);
	const updateCharacterPos = useStore(state => state.updateCharacterPos);

	const handleCopyCharacterSheet = (characterId: string) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) return;
		copyCharacterDataToClipboard(character);
	};

	const handleExpandCharacterList = () => {
		// Close the character list modal
		removeModal(modal.id);
		// Navigate to the full character sheets page
		Navigator.toCharacterSheets();
	};

	const handleExpandCharacterSheet = (characterId: string) => {
		// Close the character sheet modal
		removeModal(modal.id);
		// Navigate to the specific character sheet page
		Navigator.toCharacterSheet(characterId);
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
				return <CharacterList />;
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
						attacks={characterSheet.getBasicAttacks()}
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
						onClose={onClose}
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
						onClose={onClose}
						onMove={() => {
							updateCharacterPos(fromCharacter, modal.toPosition);
							onClose();
						}}
					/>
				);
			}
			case 'consume-resource': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return renderCharacterNotFound(modal.characterId);
				}
				return <ConsumeResourceModal character={character} costs={modal.actionCosts} onClose={onClose} />;
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
			default:
				return <div>Unknown modal type</div>;
		}
	};

	return (
		<ModalWrapper modal={modal} onStartDrag={onStartDrag} titleBarButtons={generateTitleBarButtons()}>
			{renderContent()}
		</ModalWrapper>
	);
};
