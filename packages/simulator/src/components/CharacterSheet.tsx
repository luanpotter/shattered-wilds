import { DerivedStatType, Resource, RESOURCES } from '@shattered-wilds/commons';
import React, { useEffect, useMemo } from 'react';
import { FaBatteryFull, FaCog, FaMinus, FaPlus } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character, CharacterSheet, CurrentResources, Equipment } from '../types';
import { FeatsSection } from '../types/feats-section';

import { EquipmentSection } from './EquipmentSection';
import { Button } from './shared/Button';
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

	useEffect(() => {
		const characterModal = modals.find(modal => modal.type === 'character-sheet' && modal.characterId === character.id);

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
	}, [character.props.name, character.id, modals, updateModal]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterName(character, e.target.value);
	};

	const handleAutomaticModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterAutomaticMode(character, e.target.checked);
	};

	const handleOpenRaceSetup = () => {
		openRaceSetupModal({ characterId: character.id });
	};

	const handleOpenClassSetup = () => {
		openClassSetupModal({ characterId: character.id });
	};

	const handleOpenFeatsSetup = () => {
		openFeatsSetupModal({ characterId: character.id });
	};

	const handlePointChange = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResource(resource, delta);
		updateCharacterProp(character, resource, newValue.toString());
	};

	const handleUpdateEquipment = (equipment: Equipment) => {
		updateCharacterProp(character, 'equipment', equipment.toProp());
	};

	const handleRefillPoints = () => {
		Object.values(Resource).forEach(resource => {
			updateCharacterProp(character, resource, CurrentResources.MAX_VALUE.toString());
		});
	};

	// Common styles for form rows - reduced margins for compactness
	const formRowStyle = {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '4px', // Reduced from 12px
		gap: '4px', // Reduced from 8px
		width: '100%',
	};

	const labelStyle = {
		fontSize: '0.9em',
		whiteSpace: 'nowrap' as const,
		flexShrink: 0,
		paddingRight: '4px',
	};

	const inputStyle = {
		flex: 1,
		boxSizing: 'border-box' as const,
		fontSize: '0.9em',
		padding: '2px 4px', // More compact padding
		margin: 0, // Remove any default margins
		height: '24px', // Fixed height for compactness
		width: '100%', // Ensure full width
	};

	// Style for grouped form elements
	const halfRowStyle = {
		display: 'flex',
		flex: 1,
		alignItems: 'center',
		gap: '4px', // Maintain consistent gap
	};

	const sheet = useMemo(() => CharacterSheet.from(character.props), [character.props]);

	const { hasWarnings } = FeatsSection.create(sheet);

	const statTree = useMemo(() => sheet.getStatTree(), [sheet]);
	const movement = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Movement), [statTree]);
	const initiative = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Initiative), [statTree]);
	const influenceRange = useMemo(() => statTree.computeDerivedStat(DerivedStatType.InfluenceRange), [statTree]);

	return (
		<div style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflowY: 'scroll' }}>
			{/* Basic Info Section */}
			<div
				style={{
					marginBottom: '12px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<div style={formRowStyle}>
					<label htmlFor='character-name' style={labelStyle}>
						Name:
					</label>
					<input
						id='character-name'
						type='text'
						value={character.props.name}
						onChange={handleNameChange}
						disabled={!editMode}
						style={{ ...inputStyle, flex: 1 }}
					/>
					<div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
						<input
							id='automatic-mode'
							type='checkbox'
							checked={character.automaticMode ?? false}
							onChange={handleAutomaticModeChange}
							style={{ margin: 0 }}
						/>
						<label htmlFor='automatic-mode' style={{ ...labelStyle, fontSize: '0.8em' }}>
							Auto Mode
						</label>
					</div>
				</div>

				<div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
					{/* Race/Class/Feats Row */}
					<div style={{ ...formRowStyle, marginBottom: 0 }}>
						<div style={{ ...halfRowStyle, flex: 2 }}>
							<label htmlFor='character-race' style={labelStyle}>
								Race:
							</label>
							<div style={{ position: 'relative', flex: 1 }}>
								<input
									id='character-race'
									type='text'
									value={sheet.race.toString()}
									readOnly
									onClick={editMode ? handleOpenRaceSetup : undefined}
									style={{
										...inputStyle,
										cursor: editMode ? 'pointer' : 'default',
										backgroundColor: 'var(--background)',
									}}
								/>
							</div>
						</div>

						<div style={{ ...halfRowStyle, flex: 2 }}>
							<label htmlFor='character-class' style={labelStyle}>
								Class:
							</label>
							<input
								id='character-class'
								type='text'
								value={sheet.characterClass.characterClass}
								onClick={editMode ? handleOpenClassSetup : undefined}
								readOnly
								style={{
									...inputStyle,
									cursor: editMode ? 'pointer' : 'default',
									backgroundColor: 'var(--background)',
								}}
							/>
						</div>

						<div style={{ ...halfRowStyle, flex: '0 0 auto', minWidth: '120px' }}>
							<Button
								variant='inline-full'
								title='Feats'
								icon={FaCog}
								onClick={handleOpenFeatsSetup}
								warning={editMode && hasWarnings ? 'Feats have warnings' : undefined}
							/>
						</div>
					</div>
				</div>

				{/* Derived Stats Section */}
				<div style={{ marginTop: '8px' }}>
					<div style={{ display: 'flex', gap: '8px', justifyContent: 'stretch' }}>
						<LabeledInput variant='inline' label='Size' value={sheet.size} disabled />
						<LabeledInput
							variant='inline'
							label='Movement'
							value={movement.value.toString()}
							tooltip={movement.tooltip}
							disabled
						/>
						<LabeledInput
							variant='inline'
							label='Initiative'
							value={initiative.value.toString()}
							tooltip={initiative.tooltip}
							disabled
						/>
						<LabeledInput
							variant='inline'
							label='Influence Range'
							value={influenceRange.value.toString()}
							tooltip={influenceRange.tooltip}
							disabled
						/>
					</div>

					{/* Points Row */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
						{Object.values(Resource).map(resource => {
							const resourceData = sheet.getResource(resource);
							const displayName = RESOURCES[resource].name.replace(' Point', '');
							const kebabName = displayName.toLowerCase();

							return (
								<div key={resource} style={{ ...halfRowStyle, flex: 1 }}>
									<label htmlFor={`character-${kebabName}`} style={labelStyle}>
										{displayName}:
									</label>
									<div style={{ display: 'flex', gap: '4px', flex: 1 }}>
										<div
											id={`character-${kebabName}`}
											title={resourceData.max.toString()}
											style={{
												...inputStyle,
												display: 'flex',
												alignItems: 'center',
												backgroundColor: 'var(--background)',
												cursor: 'help',
												flex: 1,
											}}
										>
											{resourceData.current}/{resourceData.max}
										</div>
										<Button
											onClick={() => handlePointChange(resource, -1)}
											icon={FaMinus}
											tooltip={`Decrease ${displayName}`}
											variant='inline'
										/>
										<Button
											onClick={() => handlePointChange(resource, 1)}
											icon={FaPlus}
											tooltip={`Increase ${displayName}`}
											variant='inline'
										/>
									</div>
								</div>
							);
						})}
						<Button variant='inline' title='Refill points' icon={FaBatteryFull} onClick={handleRefillPoints} />
					</div>
				</div>
			</div>

			{/* Attribute Tree */}
			<StatTreeToggleComponent
				tree={sheet.getStatTree()}
				onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
				characterId={character.id}
			/>

			{/* Equipment Section */}
			<EquipmentSection character={character} onUpdateEquipment={handleUpdateEquipment} editMode={editMode} />
		</div>
	);
};
