import React, { useEffect, useMemo } from 'react';
import { FaBatteryFull, FaExclamationTriangle, FaMinus, FaPlus } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet, DefenseType, DerivedStat, Equipment, Point, Size, SizeModifiers } from '../types';
import { findNextWindowPosition } from '../utils';

import { EquipmentSection } from './EquipmentSection';
import { StatTreeToggleComponent } from './stat-tree/StatTreeToggleComponent';
import { FeatsSection } from '../types/feats-section';

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
					modifier: attack.check.modifier,
					attributeName: `${attack.name} (${attack.check.attribute.name})`,
					characterId: character.id,
					initialRollType: 'Contested (Active)',
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
				modifier: basicDefense.value,
				attributeName: 'Basic Defense',
				characterId: character.id,
				initialRollType: 'Contested (Resisted)',
			});
		}
	};

	const handlePointChange = (pointType: string, delta: number) => {
		const maxValue = (sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as DerivedStat<number>)
			.value;
		const currentValue = parseInt(character.props[`current${pointType}`] ?? maxValue.toString());
		const newValue = Math.max(0, Math.min(maxValue, currentValue + delta));
		updateCharacterProp(character, `current${pointType}`, newValue.toString());
	};

	const handleUpdateEquipment = (equipment: Equipment) => {
		updateCharacterProp(character, 'equipment', equipment.toProp());
	};

	const handleRefillPoints = () => {
		const pointTypes = ['Heroism', 'Vitality', 'Focus', 'Spirit'];
		pointTypes.forEach(pointType => {
			const maxValue = (sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as DerivedStat<number>)
				.value;
			updateCharacterProp(character, `current${pointType}`, maxValue.toString());
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

	// Map size enum to display value
	const getSizeDisplay = (size: Size): string => {
		const modifier = SizeModifiers[size];
		const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
		return `${size} (${modifierStr})`;
	};

	const { hasMissingFeats } = FeatsSection.create(sheet);

	// Create reactive basic attacks and defense that update when sheet changes
	const basicAttacks = useMemo(() => sheet.getBasicAttacks(), [sheet]);
	const basicDefense = useMemo(() => sheet.getBasicDefense(DefenseType.Basic), [sheet]);

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
							<button
								id='character-feats'
								onClick={editMode ? handleOpenFeatsSetup : undefined}
								disabled={!editMode}
								style={{
									...inputStyle,
									cursor: editMode ? 'pointer' : 'default',
									backgroundColor: 'var(--background)',
									border: editMode ? '1px solid var(--text)' : 'none',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '2px 4px',
									width: '100%',
								}}
								title={editMode ? 'Click to manage feats' : 'Feats (Edit mode required)'}
							>
								<span>Feats</span>
								{editMode && hasMissingFeats && (
									<FaExclamationTriangle
										size={12}
										style={{ color: 'orange', marginLeft: '4px' }}
										title='Missing feat slots'
									/>
								)}
							</button>
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
								title={sheet.derivedStats.size.description}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{getSizeDisplay(sheet.derivedStats.size.value)}
							</div>
						</div>

						{/* Movement */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-movement' style={labelStyle}>
								Movement:
							</label>
							<div
								id='character-movement'
								title={sheet.derivedStats.movement.description}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{sheet.derivedStats.movement.value}
							</div>
						</div>

						{/* Initiative */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-initiative' style={labelStyle}>
								Initiative:
							</label>
							<div
								id='character-initiative'
								title={sheet.derivedStats.initiative.description}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{sheet.derivedStats.initiative.value}
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
								{basicDefense.value}
							</div>
						</div>
					</div>

					{/* Points Row */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
						{/* Heroism Points */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-heroism' style={labelStyle}>
								Heroism:
							</label>
							<div style={{ display: 'flex', gap: '4px', flex: 1 }}>
								<div
									id='character-heroism'
									title={sheet.derivedStats.maxHeroism.description}
									style={{
										...inputStyle,
										display: 'flex',
										alignItems: 'center',
										backgroundColor: 'var(--background)',
										cursor: 'help',
										flex: 1,
									}}
								>
									{sheet.currentValues.currentHeroism}/{sheet.derivedStats.maxHeroism.value}
								</div>
								<button
									onClick={() => handlePointChange('Heroism', -1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaMinus size={10} />
								</button>
								<button
									onClick={() => handlePointChange('Heroism', 1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaPlus size={10} />
								</button>
							</div>
						</div>

						{/* Vitality Points */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-vitality' style={labelStyle}>
								Vitality:
							</label>
							<div style={{ display: 'flex', gap: '4px', flex: 1 }}>
								<div
									id='character-vitality'
									title={sheet.derivedStats.maxVitality.description}
									style={{
										...inputStyle,
										display: 'flex',
										alignItems: 'center',
										backgroundColor: 'var(--background)',
										cursor: 'help',
										flex: 1,
									}}
								>
									{sheet.currentValues.currentVitality}/{sheet.derivedStats.maxVitality.value}
								</div>
								<button
									onClick={() => handlePointChange('Vitality', -1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaMinus size={10} />
								</button>
								<button
									onClick={() => handlePointChange('Vitality', 1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaPlus size={10} />
								</button>
							</div>
						</div>

						{/* Focus Points */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-focus' style={labelStyle}>
								Focus:
							</label>
							<div style={{ display: 'flex', gap: '4px', flex: 1 }}>
								<div
									id='character-focus'
									title={sheet.derivedStats.maxFocus.description}
									style={{
										...inputStyle,
										display: 'flex',
										alignItems: 'center',
										backgroundColor: 'var(--background)',
										cursor: 'help',
										flex: 1,
									}}
								>
									{sheet.currentValues.currentFocus}/{sheet.derivedStats.maxFocus.value}
								</div>
								<button
									onClick={() => handlePointChange('Focus', -1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaMinus size={10} />
								</button>
								<button
									onClick={() => handlePointChange('Focus', 1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaPlus size={10} />
								</button>
							</div>
						</div>

						{/* Spirit Points */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-spirit' style={labelStyle}>
								Spirit:
							</label>
							<div style={{ display: 'flex', gap: '4px', flex: 1 }}>
								<div
									id='character-spirit'
									title={sheet.derivedStats.maxSpirit.description}
									style={{
										...inputStyle,
										display: 'flex',
										alignItems: 'center',
										backgroundColor: 'var(--background)',
										cursor: 'help',
										flex: 1,
									}}
								>
									{sheet.currentValues.currentSpirit}/{sheet.derivedStats.maxSpirit.value}
								</div>
								<button
									onClick={() => handlePointChange('Spirit', -1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaMinus size={10} />
								</button>
								<button
									onClick={() => handlePointChange('Spirit', 1)}
									style={{
										padding: '2px 4px',
										backgroundColor: 'var(--background-alt)',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<FaPlus size={10} />
								</button>
							</div>
						</div>
					</div>

					{/* Refill Points Button Row */}
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
						<button
							onClick={handleRefillPoints}
							style={{
								background: 'none',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								padding: '4px 8px',
								color: 'var(--text)',
							}}
							title='Refill all points to maximum'
						>
							<FaBatteryFull />
							<span>Refill Points</span>
						</button>
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
