import React, { useEffect } from 'react';

import { useStore } from '../store';
import { Character, CharacterClass, CharacterSheet, Size, SizeModifiers } from '../types';
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

	const handleClassChange = (characterClass: CharacterClass) => {
		updateCharacterProp(character, 'class', characterClass);
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
									onClick={handleOpenRaceSetup}
									style={{
										...inputStyle,
										cursor: 'pointer',
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
					</div>

					{/* Initiative */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
				</div>
			</div>

			{/* Attribute Tree */}
			<AttributeTreeComponent
				tree={sheet.getAttributeTree()}
				onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
			/>
		</div>
	);
};
