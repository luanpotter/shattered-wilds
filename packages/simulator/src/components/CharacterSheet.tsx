import { Check, CheckMode, CheckNature, DerivedStatType, Resource, RESOURCES } from '@shattered-wilds/commons';
import React, { useEffect, useMemo } from 'react';
import { FaBatteryFull, FaCog, FaMinus, FaPlus } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet, CurrentResources, DefenseType, Equipment, Point } from '../types';
import { FeatsSection } from '../types/feats-section';
import { findNextWindowPosition } from '../utils';

import { EquipmentSection } from './EquipmentSection';
import { Button } from './shared/Button';
import { StatTreeToggleComponent } from './stat-tree/StatTreeToggleComponent';

interface CharacterSheetModalProps {
	character: Character;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ character }) => {
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const updateCharacterAutomaticMode = useStore(state => state.updateCharacterAutomaticMode);
	const windows = useStore(state => state.windows);
	const updateWindow = useStore(state => state.updateWindow);
	const addWindow = useStore(state => state.addWindow);
	const editMode = useStore(state => state.editMode);

	// Update window title when character name changes
	useEffect(() => {
		// Find the window for this character
		const characterWindow = windows.find(w => w.type === 'character-sheet' && w.characterId === character.id);

		if (characterWindow) {
			// Only update if the title doesn't match the current character name
			const expectedTitle = `${character.props.name}'s Sheet`;
			if (characterWindow.title !== expectedTitle) {
				updateWindow({
					...characterWindow,
					title: expectedTitle,
				});
			}
		}
	}, [character.props.name, character.id, windows, updateWindow]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterName(character, e.target.value);
	};

	const handleAutomaticModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterAutomaticMode(character, e.target.checked);
	};

	const handleOpenRaceSetup = () => {
		// Check if a race setup window is already open for this character
		const raceSetupWindow = windows.find(w => w.type === 'race-setup' && w.characterId === character.id);

		// If not, open a new race setup window
		if (!raceSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}'s Race Setup`,
				type: 'race-setup',
				characterId: character.id,
				position: findNextWindowPosition(windows),
				width: '500px',
			});
		}
	};

	const handleOpenClassSetup = () => {
		// Check if a class setup window is already open for this character
		const classSetupWindow = windows.find(w => w.type === 'class-setup' && w.characterId === character.id);

		// If not, open a new class setup window
		if (!classSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}'s Class Setup`,
				type: 'class-setup',
				characterId: character.id,
				position: findNextWindowPosition(windows),
				width: '700px',
			});
		}
	};

	const handleOpenFeatsSetup = () => {
		// Check if a feats setup window is already open for this character
		const featsSetupWindow = windows.find(w => w.type === 'feats-setup' && w.characterId === character.id);

		// If not, open a new feats setup window
		if (!featsSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}'s Feats`,
				type: 'feats-setup',
				characterId: character.id,
				position: findNextWindowPosition(windows),
				width: '700px',
			});
		}
	};

	const handleOpenBasicAttacks = () => {
		// Check if a basic attacks window is already open for this character
		const basicAttacksWindow = windows.find(w => w.type === 'basic-attacks' && w.characterId === character.id);

		// If not, open a new basic attacks window
		if (!basicAttacksWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}'s Basic Attacks`,
				type: 'basic-attacks',
				characterId: character.id,
				position: findNextWindowPosition(windows),
			});
		}
	};

	const handleBasicAttackClick = (position?: Point) => {
		if (editMode) {
			handleOpenBasicAttacks();
		} else {
			// In play mode, behavior depends on number of attacks
			if (basicAttacks.length === 1) {
				// Only one attack - roll dice directly
				const attack = basicAttacks[0];
				addWindow({
					id: window.crypto.randomUUID(),
					title: `Roll ${attack.name} Attack`,
					type: 'dice-roll',
					// TODO(luan): make position optional for addWindow
					position: position ?? { x: 0, y: 0 },
					check: attack.check,
					characterId: character.id,
				});
			} else if (basicAttacks.length > 1) {
				// Multiple attacks - show Basic Attacks modal for selection
				handleOpenBasicAttacks();
			}
			// If no attacks (basicAttacks.length === 0), do nothing
		}
	};

	const handleBasicDefenseClick = (position?: Point) => {
		if (!editMode) {
			// In play mode, roll a defense check
			addWindow({
				id: window.crypto.randomUUID(),
				title: `Roll Defense Check`,
				type: 'dice-roll',
				// TODO(luan): make position optional for addWindow
				position: position ?? { x: 0, y: 0 },
				check: new Check({
					mode: CheckMode.Contested,
					nature: CheckNature.Resisted,
					statModifier: basicDefense,
				}),
				characterId: character.id,
			});
		}
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

	// Create a reactive sheet that updates when character props change
	const sheet = useMemo(() => CharacterSheet.from(character.props), [character.props]);

	const { hasWarnings } = FeatsSection.create(sheet);

	// Create reactive basic attacks and defense that update when sheet changes
	const basicAttacks = useMemo(() => sheet.getBasicAttacks(), [sheet]);
	const basicDefense = useMemo(() => sheet.getBasicDefense(DefenseType.BasicBody), [sheet]);

	const statTree = useMemo(() => sheet.getStatTree(), [sheet]);
	const movement = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Movement), [statTree]);
	const initiative = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Initiative), [statTree]);

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
								type='inline-full'
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
					<div style={{ display: 'flex', gap: '8px' }}>
						{/* Size */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-size' style={labelStyle}>
								Size:
							</label>
							<div
								id='character-size'
								title={sheet.size}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{sheet.size}
							</div>
						</div>

						{/* Movement */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-movement' style={labelStyle}>
								Movement:
							</label>
							<div
								id='character-movement'
								title={movement.tooltip}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{movement.value}
							</div>
						</div>

						{/* Initiative */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-initiative' style={labelStyle}>
								Initiative:
							</label>
							<div
								id='character-initiative'
								title={initiative.tooltip}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{initiative.value}
							</div>
						</div>
					</div>

					{/* Combat Stats Row */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
						{/* Basic Attacks */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-attacks' style={labelStyle}>
								Basic Attacks:
							</label>
							<div
								id='character-attacks'
								title={basicAttacks.map(attack => attack.description).join(' / ')}
								onClick={e => {
									e.preventDefault();
									handleBasicAttackClick({ x: e.clientX, y: e.clientY });
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										handleBasicAttackClick();
									}
								}}
								tabIndex={0}
								role='button'
								aria-label={editMode ? 'Show basic attacks details' : 'Roll basic attack'}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'pointer',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}
							>
								{basicAttacks.map(attack => attack.description).join(' / ')}
							</div>
						</div>

						{/* Basic Defense */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-defense' style={labelStyle}>
								Basic Defense:
							</label>
							<div
								id='character-defense'
								title={basicDefense.description}
								onClick={e => {
									e.preventDefault();
									handleBasicDefenseClick({ x: e.clientX, y: e.clientY });
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleBasicDefenseClick();
									}
								}}
								tabIndex={editMode ? -1 : 0}
								role={editMode ? undefined : 'button'}
								aria-label={editMode ? undefined : 'Roll defense check'}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: editMode ? 'help' : 'pointer',
								}}
							>
								{basicDefense.value.description}
							</div>
						</div>
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
											type='inline'
										/>
										<Button
											onClick={() => handlePointChange(resource, 1)}
											icon={FaPlus}
											tooltip={`Increase ${displayName}`}
											type='inline'
										/>
									</div>
								</div>
							);
						})}
						<Button type='inline' title='Refill points' icon={FaBatteryFull} onClick={handleRefillPoints} />
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
