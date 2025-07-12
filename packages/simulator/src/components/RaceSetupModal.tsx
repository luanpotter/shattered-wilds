import React, { useState } from 'react';

import { useStore } from '../store';
import { CharacterSheet, Race, RaceInfo, Size, AttributeType } from '../types';
import { Upbringing, FEATS, getUpbringingModifierFeat } from '../types/feats';

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

	// Upbringing modifier state
	const [upbringingPlusModifier, setUpbringingPlusModifier] = useState<AttributeType>(
		currentRace.upbringingPlusModifier
	);
	const [upbringingMinusModifier, setUpbringingMinusModifier] = useState<AttributeType>(
		currentRace.upbringingMinusModifier
	);

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
		'upbringing.plus': upbringingPlusModifier.name,
		'upbringing.minus': upbringingMinusModifier.name,
	});
	// Remove unused raceModifiers variable since we removed the racial modifiers display

	// Get core feats for preview
	const coreFeats = sheet.race.getCoreFeats();
	const coreFeatDefinitions = coreFeats
		.map(featId => {
			// Handle dynamic upbringing modifiers for preview
			if (featId.startsWith('upbringing-')) {
				return getUpbringingModifierFeat(
					upbringing,
					upbringingPlusModifier,
					upbringingMinusModifier
				);
			}
			return FEATS[featId];
		})
		.filter(Boolean);

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

		// Update upbringing
		updateCharacterProp(character, 'upbringing', upbringing);

		// Update upbringing modifiers
		updateCharacterProp(character, 'upbringing.plus', upbringingPlusModifier.name);
		updateCharacterProp(character, 'upbringing.minus', upbringingMinusModifier.name);

		// Update half race or clear it
		if (showHalfRace && halfRace) {
			updateCharacterProp(character, 'race.half', halfRace);
		} else if (character.props['race.half']) {
			// Clear the half race if it was previously set but is now disabled
			updateCharacterProp(character, 'race.half', '');
		}

		// Update combine stats setting
		updateCharacterProp(character, 'race.half.combined-stats', combineStats ? 'true' : 'false');

		// Clear existing core race feat slots
		updateCharacterProp(character, 'feat-core-race-1', '');
		updateCharacterProp(character, 'feat-core-upbringing-1', '');
		updateCharacterProp(character, 'feat-core-upbringing-2', '');
		updateCharacterProp(character, 'feat-core-upbringing-3', '');

		// Clear specialized training slots if changing away from Urban upbringing
		if (upbringing !== Upbringing.Urban) {
			updateCharacterProp(character, 'feat-lv1-specialized-1', '');
			updateCharacterProp(character, 'feat-lv1-specialized-2', '');
		}

		// Update core race feat slots with new feats
		const newRaceInfo = new RaceInfo(
			primaryRace,
			upbringing,
			showHalfRace ? halfRace : null,
			combineStats,
			upbringingPlusModifier,
			upbringingMinusModifier
		);
		const newCoreFeats = newRaceInfo.getCoreFeats();

		// Assign feats to their proper slots
		if (newCoreFeats[0]) {
			updateCharacterProp(character, 'feat-core-race-1', newCoreFeats[0]); // racial-fey
		}
		if (newCoreFeats[2]) {
			updateCharacterProp(character, 'feat-core-upbringing-2', newCoreFeats[2]); // specialized-knowledge-sylvan
		}
		if (newCoreFeats[3]) {
			updateCharacterProp(character, 'feat-core-upbringing-3', newCoreFeats[3]); // light-feet
		}
		// Always update the upbringing modifier feat (skip newCoreFeats[1] since we handle it manually)
		updateCharacterProp(
			character,
			'feat-core-upbringing-1',
			`upbringing-${upbringing.toLowerCase()}`
		);

		onClose();
	};

	return (
		<div style={{ padding: '10px' }}>
			<h3 style={{ margin: '0 0 15px 0' }}>Race Setup</h3>

			{/* Race Selection - First Row */}
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

			{/* Upbringing Selection - Second Row */}
			<div style={{ marginBottom: '15px' }}>
				<DropdownSelect
					id='upbringing'
					options={Upbringing}
					value={upbringing}
					onChange={value => setUpbringing(value)}
					label='Upbringing'
				/>
			</div>

			{/* Upbringing Modifiers - Third Row */}
			<div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<DropdownSelect
						id='upbringing-plus'
						options={{
							INT: 'INT',
							WIS: 'WIS',
							CHA: 'CHA',
							DIV: 'DIV',
							FOW: 'FOW',
							LCK: 'LCK',
						}}
						value={upbringingPlusModifier.name}
						onChange={value => {
							const attributeType = Object.values(AttributeType).find(type => type.name === value);
							if (attributeType) setUpbringingPlusModifier(attributeType);
						}}
						label='Upbringing +1 Modifier'
					/>
				</div>
				<div style={{ flex: 1 }}>
					<DropdownSelect
						id='upbringing-minus'
						options={{
							INT: 'INT',
							WIS: 'WIS',
							CHA: 'CHA',
							DIV: 'DIV',
							FOW: 'FOW',
							LCK: 'LCK',
						}}
						value={upbringingMinusModifier.name}
						onChange={value => {
							const attributeType = Object.values(AttributeType).find(type => type.name === value);
							if (attributeType) setUpbringingMinusModifier(attributeType);
						}}
						label='Upbringing -1 Modifier'
					/>
				</div>
			</div>

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

			{/* Core Feats Display */}
			<div
				style={{
					marginBottom: '15px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Core Feats (Level 0)</h3>
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
