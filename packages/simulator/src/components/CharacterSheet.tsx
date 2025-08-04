import { Check, CheckMode, CheckNature, DerivedStatType, Resource } from '@shattered-wilds/commons';
import React, { useEffect, useMemo } from 'react';
import { FaBatteryFull, FaCog } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character, CharacterSheet, CurrentResources } from '../types';
import { FeatsSection } from '../types/feats-section';

import { ResourceInputComponent } from './ResourceInputComponent';
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
	const { updateModal, openRaceSetupModal, openClassSetupModal, openFeatsSetupModal, openDiceRollModal } = useModals();

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

	const handleRefillPoints = () => {
		Object.values(Resource).forEach(resource => {
			updateCharacterProp(character, resource, CurrentResources.MAX_VALUE.toString());
		});
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

	const sheet = useMemo(() => CharacterSheet.from(character.props), [character.props]);

	const { hasWarnings } = FeatsSection.create(sheet);

	const statTree = useMemo(() => sheet.getStatTree(), [sheet]);
	const movement = useMemo(() => statTree.getModifier(DerivedStatType.Movement), [statTree]);
	const initiative = useMemo(() => statTree.getModifier(DerivedStatType.Initiative), [statTree]);
	const influenceRange = useMemo(() => statTree.getModifier(DerivedStatType.InfluenceRange), [statTree]);

	return (
		<div style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflowY: 'scroll' }}>
			<div
				style={{
					marginBottom: '12px',
					padding: '8px',
					borderRadius: '4px',
				}}
			>
				<Row>
					<LabeledInput
						variant='inline'
						label='Name'
						value={character.props.name}
						onChange={value => updateCharacterName(character, value)}
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
					<LabeledInput variant='inline' label='Size' value={sheet.size} disabled />
					<LabeledInput
						variant='inline'
						label='Movement'
						value={movement.value.description}
						tooltip={movement.description}
						disabled
					/>
					<LabeledInput
						variant='inline'
						label='Initiative'
						value={initiative.value.description}
						tooltip={initiative.description}
						onClick={() =>
							openDiceRollModal({
								characterId,
								check: new Check({
									mode: CheckMode.Static,
									nature: CheckNature.Active,
									statModifier: initiative,
								}),
							})
						}
						disabled
					/>
					<LabeledInput
						variant='inline'
						label='Influence Range'
						value={influenceRange.value.description}
						tooltip={influenceRange.description}
						disabled
					/>
				</Row>

				<Row>
					{Object.values(Resource).map(resource => (
						<ResourceInputComponent
							key={resource}
							variant='inline'
							character={character}
							sheet={sheet}
							resource={resource}
						/>
					))}
					<Button variant='inline' title='Refill points' icon={FaBatteryFull} onClick={handleRefillPoints} />
				</Row>
			</div>

			{/* Attribute Tree */}
			<StatTreeToggleComponent
				tree={sheet.getStatTree()}
				onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
				characterId={characterId}
			/>
		</div>
	);
};
