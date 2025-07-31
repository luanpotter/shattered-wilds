import React from 'react';
import { FaCopy, FaExpand } from 'react-icons/fa';

import { useStore } from '../store';
import { Window, CharacterSheet } from '../types';

import { AttackActionModal } from './AttackActionModal';
import { BasicAttacksModal } from './BasicAttacksModal';
import { CharacterCreationModal } from './CharacterCreation';
import { CharacterList } from './CharacterList';
import { CharacterSheetModal } from './CharacterSheet';
import { ClassSetupModal } from './ClassSetupModal';
import { DiceRollModal } from './DiceRollModal';
import { DraggableWindow } from './DraggableWindow';
import { FeatsModal } from './FeatsModal';
import { MeasureModal } from './MeasureModal';
import RaceSetupModal from './RaceSetupModal';
import { Button } from './shared/Button';

const navigator = window.navigator;

interface WindowComponentProps {
	window: Window;
	onStartDrag: (e: React.MouseEvent) => void;
	onNavigateToCharacterSheets?: () => void;
	onNavigateToCharacterSheet?: (characterId: string) => void;
}

export const WindowComponent: React.FC<WindowComponentProps> = ({
	window,
	onStartDrag,
	onNavigateToCharacterSheets,
	onNavigateToCharacterSheet,
}) => {
	const characters = useStore(state => state.characters);
	const removeWindow = useStore(state => state.removeWindow);

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
		removeWindow(window.id);
		// Navigate to the full character sheets page
		if (onNavigateToCharacterSheets) {
			onNavigateToCharacterSheets();
		}
	};

	const handleExpandCharacterSheet = (characterId: string) => {
		// Close the character sheet modal
		removeWindow(window.id);
		// Navigate to the specific character sheet page
		if (onNavigateToCharacterSheet) {
			onNavigateToCharacterSheet(characterId);
		}
	};

	const generateTitleBarButtons = () => {
		switch (window.type) {
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
				if (window.characterId) {
					return (
						<>
							<Button
								onClick={() => handleCopyCharacterSheet(window.characterId!)}
								icon={FaCopy}
								tooltip='Copy character sheet'
								type='inline'
							/>
							<Button
								onClick={() => handleExpandCharacterSheet(window.characterId!)}
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
		switch (window.type) {
			case 'character-list':
				return <CharacterList />;
			case 'character-creation':
				return <CharacterCreationModal hexPosition={window.hexPosition} />;
			case 'character-sheet': {
				const character = characters.find(c => c.id === window.characterId);
				return character ? <CharacterSheetModal character={character} /> : <div>Character not found</div>;
			}
			case 'race-setup': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) return <div>Character not found</div>;
				return <RaceSetupModal characterId={character.id} onClose={() => removeWindow(window.id)} />;
			}
			case 'class-setup': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) {
					return <div>Character not found</div>;
				}
				return <ClassSetupModal character={character} onClose={() => removeWindow(window.id)} />;
			}
			case 'feats-setup': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) {
					return <div>Character not found</div>;
				}
				return <FeatsModal character={character} onClose={() => removeWindow(window.id)} />;
			}
			case 'basic-attacks': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) return <div>Character not found</div>;
				const characterSheet = CharacterSheet.from(character.props);
				return (
					<BasicAttacksModal
						attacks={characterSheet.getBasicAttacks()}
						characterSheet={characterSheet}
						onClose={() => removeWindow(window.id)}
					/>
				);
			}
			case 'dice-roll': {
				return (
					<DiceRollModal
						characterId={window.characterId!}
						check={window.check!}
						onClose={() => removeWindow(window.id)}
						onDiceRollComplete={window.onDiceRollComplete}
					/>
				);
			}
			case 'attack-action':
				return (
					<AttackActionModal
						attackerId={window.attackerId ?? ''}
						defenderId={window.defenderId ?? ''}
						attackIndex={window.attackIndex ?? 0}
						onClose={() => removeWindow(window.id)}
					/>
				);
			case 'measure': {
				const fromCharacter = characters.find(c => c.id === window.fromCharacterId);
				if (!fromCharacter || !window.toPosition) {
					return <div>Missing measure data</div>;
				}
				return (
					<MeasureModal
						fromCharacter={fromCharacter}
						toPosition={window.toPosition}
						distance={window.distance ?? 0}
						onClose={() => removeWindow(window.id)}
						onMove={() => {
							const updateCharacterPos = useStore.getState().updateCharacterPos;
							updateCharacterPos(fromCharacter, window.toPosition!);
							removeWindow(window.id);
						}}
					/>
				);
			}
			default:
				return <div>Unknown window type</div>;
		}
	};

	return (
		<DraggableWindow window={window} onStartDrag={onStartDrag} titleBarButtons={generateTitleBarButtons()}>
			{renderContent()}
		</DraggableWindow>
	);
};
