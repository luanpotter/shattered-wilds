import React, { useEffect } from 'react';
import { FaCog } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character, CharacterSheet } from '../types';
import { FeatsSection } from '../types/feats-section';

import { DerivedStatsRowComponent } from './DerivedStatsRowComponent';
import { ResourcesRowComponent } from './ResourcesRowComponent';
import { Button } from './shared/Button';
import { LabeledCheckbox } from './shared/LabeledCheckbox';
import LabeledInput from './shared/LabeledInput';
import { StatTreeToggleComponent } from './stat-tree/StatTreeToggleComponent';

interface CharacterSheetModalProps {
	character: Character;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ character }) => {
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const updateCharacterAutomaticMode = useStore(state => state.updateCharacterAutomaticMode);
	const editMode = useStore(state => state.editMode);
	const modals = useStore(state => state.modals);
	const { updateModal, openRaceSetupModal, openClassSetupModal, openFeatsSetupModal } = useModals();

	const characterId = character.id;
	useEffect(() => {
		const characterModal = modals.find(modal => modal.type === 'character-sheet' && modal.characterId === characterId);

		if (characterModal) {
			// Only update if the title doesn't match the current character name
			const expectedTitle = `${character.props.name}'s Sheet`;
			if (characterModal.title !== expectedTitle) {
				updateModal({
					...characterModal,
					title: expectedTitle,
				});
			}
		}
	}, [character.props.name, characterId, modals, updateModal]);

	const handleOpenFeatsSetup = () => {
		openFeatsSetupModal({ characterId });
	};

	const Row = ({ children }: { children: React.ReactNode }) => {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					marginBottom: '4px',
					gap: '4px',
					width: '100%',
				}}
			>
				{children}
			</div>
		);
	};

	const sheet = CharacterSheet.from(character.props);
	const { hasWarnings } = FeatsSection.create(sheet);

	return (
		<div style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflowY: 'scroll' }}>
			<div style={{ padding: '8px' }}>
				<Row>
					<LabeledInput
						variant='inline'
						label='Name'
						value={character.props.name}
						onBlur={value => updateCharacterName(character, value)}
						disabled={!editMode}
					/>

					<LabeledCheckbox
						label='Auto Mode'
						checked={character.automaticMode ?? false}
						onChange={checked => updateCharacterAutomaticMode(character, checked)}
					/>
				</Row>

				<Row>
					<LabeledInput
						variant='inline'
						label='Race'
						value={sheet.race.toString()}
						disabled
						onClick={() => openRaceSetupModal({ characterId })}
					/>
					<LabeledInput
						variant='inline'
						label='Class'
						value={sheet.characterClass.characterClass}
						disabled
						onClick={() => openClassSetupModal({ characterId })}
					/>

					<Button
						variant='inline'
						title='Feats'
						icon={FaCog}
						onClick={handleOpenFeatsSetup}
						warning={editMode && hasWarnings ? 'Feats have warnings' : undefined}
					/>
				</Row>

				<Row>
					<DerivedStatsRowComponent variant='inline' characterId={characterId} />
				</Row>

				<Row>
					<ResourcesRowComponent variant='inline' characterId={characterId} />
				</Row>
			</div>

			<StatTreeToggleComponent
				tree={sheet.getStatTree()}
				onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
				characterId={characterId}
			/>
		</div>
	);
};
