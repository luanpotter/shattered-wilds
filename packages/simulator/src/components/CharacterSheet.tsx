import React, { useEffect } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

import { useStore } from '../store';
import {
	Character,
	CharacterClass,
	CharacterSheet,
	DerivedStat,
	Size,
	SizeModifiers,
} from '../types';
import { findNextWindowPosition } from '../utils';

import { AttributeTreeComponent } from './AttributeTreeComponent';
import DropdownSelect from './DropdownSelect';

interface CharacterSheetModalProps {
	character: Character;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ character }) => {
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const windows = useStore(state => state.windows);
	const updateWindow = useStore(state => state.updateWindow);
	const addWindow = useStore(state => state.addWindow);
	const editMode = useStore(state => state.editMode);

	// Update window title when character name changes
	useEffect(() => {
		// Find the window for this character
		const characterWindow = windows.find(
			w => w.type === 'character-sheet' && w.characterId === character.id
		);

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

	const handleOpenRaceSetup = () => {
		// Check if a race setup window is already open for this character
		const raceSetupWindow = windows.find(
			w => w.type === 'race-setup' && w.characterId === character.id
		);

		// If not, open a new race setup window
		if (!raceSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}'s Race Setup`,
				type: 'race-setup',
				characterId: character.id,
				position: findNextWindowPosition(windows),
			});
		}
	};

	const handleOpenBasicAttacks = () => {
		// Check if a basic attacks window is already open for this character
		const basicAttacksWindow = windows.find(
			w => w.type === 'basic-attacks' && w.characterId === character.id
		);

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

	const handleClassChange = (characterClass: CharacterClass) => {
		updateCharacterProp(character, 'class', characterClass);
	};

	const handlePointChange = (pointType: string, delta: number) => {
		const maxValue = (
			sheet.derivedStats[
				`max${pointType}` as keyof typeof sheet.derivedStats
			] as DerivedStat<number>
		).value;
		const currentValue = parseInt(character.props[`current${pointType}`] ?? maxValue.toString());
		const newValue = Math.max(0, Math.min(maxValue, currentValue + delta));
		updateCharacterProp(character, `current${pointType}`, newValue.toString());
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

	const sheet = CharacterSheet.from(character.props);

	// Map size enum to display value
	const getSizeDisplay = (size: Size): string => {
		const modifier = SizeModifiers[size];
		const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
		return `${size} (${modifierStr})`;
	};

	const formatAttackDisplay = (attacks: CharacterSheet['derivedStats']['basicAttacks']) => {
		const formatValue = (value: number) => (value > 0 ? `+${value}` : value);
		return `Light Melee (${formatValue(attacks.lightMelee.value)}) / Heavy Melee (${formatValue(attacks.heavyMelee.value)}) / Ranged (${formatValue(attacks.ranged.value)}) / Thrown (${formatValue(attacks.thrown.value)})`;
	};

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
						style={inputStyle}
					/>
				</div>

				<div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
					{/* Race/Class Row */}
					<div style={{ ...formRowStyle, marginBottom: 0 }}>
						<div style={halfRowStyle}>
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

						<div style={halfRowStyle}>
							<label htmlFor='character-class' style={labelStyle}>
								Class:
							</label>
							<DropdownSelect
								id='character-class'
								options={CharacterClass}
								value={sheet.characterClass}
								onChange={handleClassChange}
								disabled={!editMode}
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
								title={sheet.derivedStats.basicAttacks.lightMelee.description}
								onClick={handleOpenBasicAttacks}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										handleOpenBasicAttacks();
									}
								}}
								tabIndex={0}
								role='button'
								aria-label='Show basic attacks details'
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
								{formatAttackDisplay(sheet.derivedStats.basicAttacks)}
							</div>
						</div>

						{/* Basic Defense */}
						<div style={{ ...halfRowStyle, flex: 1 }}>
							<label htmlFor='character-defense' style={labelStyle}>
								Basic Defense:
							</label>
							<div
								id='character-defense'
								title={sheet.derivedStats.basicDefense.description}
								style={{
									...inputStyle,
									display: 'flex',
									alignItems: 'center',
									backgroundColor: 'var(--background)',
									cursor: 'help',
								}}
							>
								{sheet.derivedStats.basicDefense.value}
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
				</div>
			</div>

			{/* Attribute Tree */}
			<AttributeTreeComponent
				tree={sheet.getAttributeTree()}
				onUpdateCharacterProp={(key, value) =>
					editMode && updateCharacterProp(character, key, value)
				}
				disabled={!editMode}
				characterSheet={sheet}
			/>
		</div>
	);
};
