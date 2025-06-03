import React from 'react';

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
import RaceSetupModal from './RaceSetupModal';

interface WindowComponentProps {
	window: Window;
	onStartDrag: (e: React.MouseEvent) => void;
}

export const WindowComponent: React.FC<WindowComponentProps> = ({ window, onStartDrag }) => {
	const characters = useStore(state => state.characters);
	const removeWindow = useStore(state => state.removeWindow);

	const renderContent = () => {
		switch (window.type) {
			case 'character-list':
				return <CharacterList />;
			case 'character-creation':
				return <CharacterCreationModal hexPosition={window.hexPosition} />;
			case 'character-sheet': {
				const character = characters.find(c => c.id === window.characterId);
				return character ? (
					<CharacterSheetModal character={character} />
				) : (
					<div>Character not found</div>
				);
			}
			case 'race-setup': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) return <div>Character not found</div>;
				const characterSheet = CharacterSheet.from(character.props);
				return (
					<RaceSetupModal
						characterId={character.id}
						currentRace={characterSheet.race}
						onClose={() => removeWindow(window.id)}
					/>
				);
			}
			case 'class-setup': {
				const character = characters.find(c => c.id === window.characterId);
				if (!character) {
					return <div>Character not found</div>;
				}
				return <ClassSetupModal character={character} onClose={() => removeWindow(window.id)} />;
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
				const props: any = {
					modifier: window.modifier ?? 0,
					onClose: () => removeWindow(window.id),
					attributeName: window.attributeName ?? '',
					characterSheet: window.characterSheet,
					initialRollType: window.initialRollType ?? 'Static',
				};

				if (window.onDiceRollComplete) {
					props.onDiceRollComplete = window.onDiceRollComplete;
				}

				return <DiceRollModal {...props} />;
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
			default:
				return <div>Unknown window type</div>;
		}
	};

	return (
		<DraggableWindow window={window} onStartDrag={onStartDrag}>
			{renderContent()}
		</DraggableWindow>
	);
};
