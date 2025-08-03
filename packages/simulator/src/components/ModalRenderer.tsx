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

	const renderContent = () => {
		switch (modal.type) {
			case 'character-list':
				return <CharacterList />;
			case 'character-creation':
				return <CharacterCreationModal hexPosition={modal.hexPosition} onClose={() => removeModal(modal.id)} />;
			case 'character-sheet': {
				const character = characters.find(c => c.id === modal.characterId);
				return character ? <CharacterSheetModal character={character} /> : <div>Character not found</div>;
			}
			case 'race-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) return <div>Character not found</div>;
				return <RaceSetupModal characterId={character.id} onClose={() => removeModal(modal.id)} />;
			}
			case 'class-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return <div>Character not found</div>;
				}
				return <ClassSetupModal character={character} onClose={() => removeModal(modal.id)} />;
			}
			case 'feats-setup': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) {
					return <div>Character not found</div>;
				}
				return <FeatsModal character={character} onClose={() => removeModal(modal.id)} />;
			}
			case 'basic-attacks': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character) return <div>Character not found</div>;
				const characterSheet = CharacterSheet.from(character.props);
				return (
					<BasicAttacksModal
						attacks={characterSheet.getBasicAttacks()}
						characterSheet={characterSheet}
						onClose={() => removeModal(modal.id)}
					/>
				);
			}
			case 'dice-roll': {
				return (
					<DiceRollModal
						characterId={modal.characterId!}
						check={modal.check!}
						onClose={() => removeModal(modal.id)}
						onDiceRollComplete={modal.onDiceRollComplete}
					/>
				);
			}
			case 'attack-action':
				return (
					<AttackActionModal
						attackerId={modal.attackerId ?? ''}
						defenderId={modal.defenderId ?? ''}
						attackIndex={modal.attackIndex ?? 0}
						onClose={() => removeModal(modal.id)}
					/>
				);
			case 'measure': {
				const fromCharacter = characters.find(c => c.id === modal.fromCharacterId);
				if (!fromCharacter || !modal.toPosition) {
					return <div>Missing measure data</div>;
				}
				return (
					<MeasureModal
						fromCharacter={fromCharacter}
						toPosition={modal.toPosition}
						distance={modal.distance ?? 0}
						onClose={() => removeModal(modal.id)}
						onMove={() => {
							const updateCharacterPos = useStore.getState().updateCharacterPos;
							updateCharacterPos(fromCharacter, modal.toPosition!);
							removeModal(modal.id);
						}}
					/>
				);
			}
			case 'consume-resource': {
				const character = characters.find(c => c.id === modal.characterId);
				if (!character || !modal.actionCosts) {
					return <div>Missing consume resource data</div>;
				}
				return (
					<ConsumeResourceModal character={character} costs={modal.actionCosts} onClose={() => removeModal(modal.id)} />
				);
			}
			default:
				return <div>Unknown modal type</div>;
		}
	};

	// All modals now use the unified ModalWrapper system
	return (
		<ModalWrapper modal={modal} onStartDrag={onStartDrag} titleBarButtons={generateTitleBarButtons()}>
			{renderContent()}
		</ModalWrapper>
	);
};
