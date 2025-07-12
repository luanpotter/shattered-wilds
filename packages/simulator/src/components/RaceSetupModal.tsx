import React, { useState } from 'react';

import { Upbringing, FEATS } from '../feats';
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
	const [upbringing, setUpbringing] = useState<Upbringing>(currentRace.upbringing);

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
		upbringing: upbringing,
	});
	const raceModifiers = sheet.race.getModifiers();

	// Get core feats for preview
	const coreFeats = sheet.race.getCoreFeats();
	const coreFeatDefinitions = coreFeats.map(featId => FEATS[featId]).filter(Boolean);

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

		// Clear existing core race/upbringing feats
		const existingCoreFeats = new RaceInfo(
			currentRace.primaryRace,
			currentRace.upbringing,
			currentRace.halfRace,
			currentRace.combineHalfRaceStats
		).getCoreFeats();
		existingCoreFeats.forEach(featId => {
			updateCharacterProp(character, `feat:${featId}`, '');
		});

		// Update primary race
		updateCharacterProp(character, 'race', primaryRace);

		// Update upbringing
		updateCharacterProp(character, 'upbringing', upbringing);

		// Update half race or clear it
		if (showHalfRace && halfRace) {
			updateCharacterProp(character, 'race.half', halfRace);
		} else if (character.props['race.half']) {
			// Clear the half race if it was previously set but is now disabled
			updateCharacterProp(character, 'race.half', '');
		}

		// Update combine stats setting
		updateCharacterProp(character, 'race.half.combined-stats', combineStats ? 'true' : 'false');

		// Add new core feats
		const newCoreFeats = new RaceInfo(
			primaryRace,
			upbringing,
			showHalfRace ? halfRace : null,
			combineStats
		).getCoreFeats();
		newCoreFeats.forEach(featId => {
			updateCharacterProp(character, `feat:${featId}`, 'true');
		});

		onClose();
	};

	return (
		<div style={{ padding: '10px' }}>
			<h3 style={{ margin: '0 0 15px 0' }}>Race Setup</h3>

			<div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
				{/* Primary Race - 33% width */}
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

				{/* Upbringing - 33% width */}
				<div style={{ flex: 1 }}>
					<DropdownSelect
						id='upbringing'
						options={Upbringing}
						value={upbringing}
						onChange={value => setUpbringing(value)}
						label='Upbringing'
					/>
				</div>

				{/* Half Breed section - 33% width */}
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
						{getSizeDisplay(sheet.derivedStats.size.value)}
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

			{/* Core Feats Display */}
			<div
				style={{
					marginBottom: '15px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Core Feats (Level 0-1)</h3>
				<div style={{ maxHeight: '200px', overflowY: 'auto' }}>
					{coreFeatDefinitions.length > 0 ? (
						coreFeatDefinitions.map((feat, index) => (
							<div
								key={index}
								style={{
									marginBottom: '8px',
									padding: '6px',
									backgroundColor: 'var(--background)',
									borderRadius: '4px',
									border: '1px solid var(--text)',
								}}
							>
								<div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.9em' }}>
									{feat.name}
								</div>
								<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
									{feat.description}
								</div>
							</div>
						))
					) : (
						<div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9em' }}>
							No core feats
						</div>
					)}
				</div>
			</div>

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
