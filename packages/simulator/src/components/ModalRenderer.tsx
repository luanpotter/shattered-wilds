import React from 'react';
import { FaCopy, FaExpand } from 'react-icons/fa';

import { useStore } from '../store';
import { Modal as ModalType, CharacterSheet } from '../types';

import { CharacterList } from './CharacterList';
import { CharacterSheetModal } from './CharacterSheet';
import {
	ModalWrapper,
	CharacterCreationModal,
	BasicAttacksModal,
	MeasureModal,
	FeatsModal,
	DiceRollModal,
	ClassSetupModal,
	ConsumeResourceModal,
	RaceSetupModal,
	AttackActionModal,
} from './modals';
import { Button } from './shared/Button';

const navigator = window.navigator;

interface ModalRendererProps {
	modal: ModalType;
	onStartDrag: (e: React.MouseEvent) => void;
	onNavigateToCharacterSheets?: () => void;
	onNavigateToCharacterSheet?: (characterId: string) => void;
}

export const ModalRenderer: React.FC<ModalRendererProps> = ({
	modal,
	onStartDrag,
	onNavigateToCharacterSheets,
	onNavigateToCharacterSheet,
}) => {
	const characters = useStore(state => state.characters);
	const removeModal = useStore(state => state.removeModal);
	const updateCharacterPos = useStore(state => state.updateCharacterPos);

	const handleCopyCharacterSheet = (characterId: string) => {
		const character = characters.find(c => c.id === characterId);
		if (!character) return;
		const keyValuePairs = Object.entries(character.props)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
		void navigator.clipboard.writeText(keyValuePairs);
	};

	const handleExpandCharacterList = () => {
		// Close the character list modal
		removeModal(modal.id);
		// Navigate to the full character sheets page
		if (onNavigateToCharacterSheets) {
			onNavigateToCharacterSheets();
		}
	};

	const handleExpandCharacterSheet = (characterId: string) => {
		// Close the character sheet modal
		removeModal(modal.id);
		// Navigate to the specific character sheet page
		if (onNavigateToCharacterSheet) {
			onNavigateToCharacterSheet(characterId);
		}
	};

	const generateTitleBarButtons = () => {
		switch (modal.type) {
			case 'character-list':
				return (
					<Button
						onClick={handleExpandCharacterList}
						icon={FaExpand}
						tooltip='Open full character sheets page'
						type='inline'
					/>
				);
			case 'character-sheet':
				if (modal.characterId) {
					return (
						<>
							<Button
								onClick={() => handleCopyCharacterSheet(modal.characterId!)}
								icon={FaCopy}
								tooltip='Copy character sheet'
								type='inline'
							/>
							<Button
								onClick={() => handleExpandCharacterSheet(modal.characterId!)}
								icon={FaExpand}
								tooltip='Open character sheet full page'
								type='inline'
							/>
						</>
					);
				}
				break;
			default:
				return null;
		}
		return null;
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
