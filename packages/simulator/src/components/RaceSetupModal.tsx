import React, { useState } from 'react';

import { useStore } from '../store';
import { CharacterSheet, Race, RaceInfo, Size } from '../types';

import DropdownSelect from './DropdownSelect';

interface RaceSetupModalProps {
	characterId: string;
	currentRace: RaceInfo;
	onClose: () => void;
}

const RaceSetupModal: React.FC<RaceSetupModalProps> = ({ characterId, currentRace, onClose }) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	// Set initial states from RaceInfo
	const [primaryRace, setPrimaryRace] = useState<Race>(currentRace.primaryRace);
	const [halfRace, setHalfRace] = useState<Race | null>(currentRace.halfRace);
	const [showHalfRace, setShowHalfRace] = useState<boolean>(currentRace.halfRace !== null);
	const [combineStats, setCombineStats] = useState<boolean>(currentRace.combineHalfRaceStats);

	// Find the character by ID
	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return null;
	}

	// Get modifiers for the preview
	const sheet = CharacterSheet.from({
		...character.props,
		race: primaryRace,
		'race.half': showHalfRace && halfRace ? halfRace : '',
		'race.half.combined-stats': combineStats ? 'true' : 'false',
	});
	const raceModifiers = sheet.race.getModifiers();

	// Map size enum to display value
	const getSizeDisplay = (size: Size): string => {
		switch (size) {
			case Size.S:
				return 'Small';
			case Size.M:
				return 'Medium';
			case Size.L:
				return 'Large';
			default:
				return 'Unknown';
		}
	};

	// Handle saving changes
	const handleSave = () => {
		if (!character) return;

		// Update primary race
		updateCharacterProp(character, 'race', primaryRace);

		// Update half race or clear it
		if (showHalfRace && halfRace) {
			updateCharacterProp(character, 'race.half', halfRace);
		} else if (character.props['race.half']) {
			// Clear the half race if it was previously set but is now disabled
			updateCharacterProp(character, 'race.half', '');
		}

		// Update combine stats setting
		updateCharacterProp(
			character,
			'race.half.combined-stats',
			combineStats ? 'true' : 'false'
		);

		onClose();
	};

	return (
		<div style={{ padding: '10px' }}>
			<h3 style={{ margin: '0 0 15px 0' }}>Race Setup</h3>

			<div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
				{/* Primary Race - 50% width */}
				<div style={{ flex: 1 }}>
					<DropdownSelect
						id='primary-race'
						options={Race}
						value={primaryRace}
						onChange={value => {
							setPrimaryRace(value);
							// If half breed is the same as the new primary race, change it to something else
							if (halfRace === value) {
								const alternativeRace = Object.values(Race).find(r => r !== value);
								if (alternativeRace) {
									setHalfRace(alternativeRace);
								}
							}
						}}
						label='Primary Race'
					/>
				</div>

				{/* Half Breed section - 50% width */}
				<div style={{ flex: 1 }}>
					<div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
						<input
							type='checkbox'
							id='half-race-toggle'
							checked={showHalfRace}
							onChange={() => setShowHalfRace(!showHalfRace)}
							style={{ marginRight: '5px' }}
						/>
						<label htmlFor='half-race-toggle'>Half Breed</label>
					</div>

					{showHalfRace && (
						<DropdownSelect
							id='half-race'
							options={Object.entries(Race).reduce(
								(filtered, [key, value]) => {
									// Filter out the primary race from options
									if (value !== primaryRace) {
										filtered[key] = value;
									}
									return filtered;
								},
								{} as Record<string, Race>
							)}
							value={
								halfRace === primaryRace
									? Object.values(Race).find(r => r !== primaryRace) || Object.values(Race)[0]
									: halfRace || Object.values(Race)[0]
							}
							onChange={value => setHalfRace(value)}
						/>
					)}
				</div>
			</div>

			{/* Combine racial stats toggle */}
			{showHalfRace && halfRace && (
				<div style={{ marginBottom: '15px' }}>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							cursor: 'pointer',
							userSelect: 'none',
						}}
					>
						<input
							type='checkbox'
							checked={combineStats}
							onChange={() => setCombineStats(!combineStats)}
							style={{ marginRight: '6px' }}
						/>
						Combine racial attribute bonuses from both races
					</label>
				</div>
			)}

			{/* Character Size Display */}
			<div
				style={{
					marginBottom: '15px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Character Size</h3>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						fontSize: '0.9em',
						padding: '2px 0',
					}}
				>
					<span>Size is determined by your primary race</span>
					<span style={{ fontWeight: 'bold' }}>
						{getSizeDisplay(sheet.derivedStats.size)}
					</span>
				</div>
			</div>

			{/* Race Modifiers Display */}
			{raceModifiers.length > 0 && (
				<div
					style={{
						marginBottom: '15px',
						padding: '8px',
						backgroundColor: 'var(--background-alt)',
						borderRadius: '4px',
					}}
				>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Racial Modifiers</h3>
					<div>
						{raceModifiers.map((mod, index) => (
							<div
								key={index}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: '0.9em',
									padding: '2px 0',
								}}
							>
								<span>{mod.source}</span>
								<span>
									{mod.attributeType?.name}: {mod.value > 0 ? `+${mod.value}` : mod.value}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
				<button
					onClick={onClose}
					style={{
						padding: '6px 12px',
						border: '1px solid var(--text)',
						backgroundColor: 'var(--background-alt)',
						color: 'var(--text)',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Cancel
				</button>
				<button
					onClick={handleSave}
					style={{
						padding: '6px 12px',
						border: '1px solid var(--text)',
						backgroundColor: 'var(--background-alt)',
						color: 'var(--text)',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Save
				</button>
			</div>
		</div>
	);
};

export default RaceSetupModal;
