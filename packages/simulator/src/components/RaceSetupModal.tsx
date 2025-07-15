import React from 'react';

import { useStore } from '../store';
import { CharacterSheet, Race, Size, StatType, RaceInfo } from '../types';
import { Upbringing, FEATS, getUpbringingModifierFeat } from '../types/feats';

import DropdownSelect from './DropdownSelect';

interface RaceSetupModalProps {
	characterId: string;
	onClose: () => void;
}

const RaceSetupModal: React.FC<RaceSetupModalProps> = ({ characterId, onClose }) => {
	const characters = useStore(state => state.characters);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	// Find the character by ID
	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return null;
	}

	const sheet = CharacterSheet.from(character.props);

	// Get current values directly from character props
	const currentRace = sheet.race;

	// Get modifiers for the preview using current values
	const coreFeats = currentRace.getCoreFeats();
	const coreFeatDefinitions = coreFeats
		.map(featId => {
			// Handle dynamic upbringing modifiers for preview
			if (featId.startsWith('upbringing-')) {
				return getUpbringingModifierFeat(
					currentRace.upbringing,
					currentRace.upbringingPlusModifier,
					currentRace.upbringingMinusModifier
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

	// Handle immediate updates
	const handlePrimaryRaceChange = (value: Race) => {
		updateCharacterProp(character, 'race', value);

		// If half breed is the same as the new primary race, change it to something else
		if (currentRace.halfRace === value) {
			const alternativeRace = Object.values(Race).find(r => r !== value);
			if (alternativeRace) {
				updateCharacterProp(character, 'race.half', alternativeRace);
			}
		}

		// Update core feats immediately
		updateCoreFeats(
			value,
			currentRace.upbringing,
			currentRace.halfRace,
			currentRace.combineHalfRaceStats,
			currentRace.upbringingPlusModifier,
			currentRace.upbringingMinusModifier
		);
	};

	const handleHalfRaceToggle = (showHalfRace: boolean) => {
		if (showHalfRace) {
			// Enable half race with first available option
			const alternativeRace = Object.values(Race).find(r => r !== currentRace.primaryRace);
			if (alternativeRace) {
				updateCharacterProp(character, 'race.half', alternativeRace);
			}
		} else {
			// Clear half race
			updateCharacterProp(character, 'race.half', '');
		}
	};

	const handleHalfRaceChange = (value: Race) => {
		updateCharacterProp(character, 'race.half', value);
		updateCoreFeats(
			currentRace.primaryRace,
			currentRace.upbringing,
			value,
			currentRace.combineHalfRaceStats,
			currentRace.upbringingPlusModifier,
			currentRace.upbringingMinusModifier
		);
	};

	const handleCombineStatsChange = (combineStats: boolean) => {
		updateCharacterProp(character, 'race.half.combined-stats', combineStats ? 'true' : 'false');
		updateCoreFeats(
			currentRace.primaryRace,
			currentRace.upbringing,
			currentRace.halfRace,
			combineStats,
			currentRace.upbringingPlusModifier,
			currentRace.upbringingMinusModifier
		);
	};

	const handleUpbringingChange = (value: Upbringing) => {
		updateCharacterProp(character, 'upbringing', value);

		// Clear specialized training slots if changing away from Urban upbringing
		if (value !== Upbringing.Urban) {
			updateCharacterProp(character, 'feat-lv1-specialized-1', '');
			updateCharacterProp(character, 'feat-lv1-specialized-2', '');
		}

		updateCoreFeats(
			currentRace.primaryRace,
			value,
			currentRace.halfRace,
			currentRace.combineHalfRaceStats,
			currentRace.upbringingPlusModifier,
			currentRace.upbringingMinusModifier
		);
	};

	const handleUpbringingPlusChange = (value: string) => {
		const attributeType = Object.values(StatType).find(type => type.name === value);
		if (attributeType) {
			updateCharacterProp(character, 'upbringing.plus', attributeType.name);
			updateCoreFeats(
				currentRace.primaryRace,
				currentRace.upbringing,
				currentRace.halfRace,
				currentRace.combineHalfRaceStats,
				attributeType,
				currentRace.upbringingMinusModifier
			);
		}
	};

	const handleUpbringingMinusChange = (value: string) => {
		const attributeType = Object.values(StatType).find(type => type.name === value);
		if (attributeType) {
			updateCharacterProp(character, 'upbringing.minus', attributeType.name);
			updateCoreFeats(
				currentRace.primaryRace,
				currentRace.upbringing,
				currentRace.halfRace,
				currentRace.combineHalfRaceStats,
				currentRace.upbringingPlusModifier,
				attributeType
			);
		}
	};

	// Helper function to update core feats
	const updateCoreFeats = (
		primaryRace: Race,
		upbringing: Upbringing,
		halfRace: Race | null,
		combineStats: boolean,
		upbringingPlusModifier: StatType,
		upbringingMinusModifier: StatType
	) => {
		// Clear existing core race feat slots
		updateCharacterProp(character, 'feat-core-race-1', '');
		updateCharacterProp(character, 'feat-core-upbringing-1', '');
		updateCharacterProp(character, 'feat-core-upbringing-2', '');
		updateCharacterProp(character, 'feat-core-upbringing-3', '');

		// Create new RaceInfo to get updated core feats
		const newRaceInfo = new RaceInfo(
			primaryRace,
			upbringing,
			halfRace,
			combineStats,
			upbringingPlusModifier,
			upbringingMinusModifier
		);
		const newCoreFeats = newRaceInfo.getCoreFeats();

		// Assign feats to their proper slots
		if (newCoreFeats[0]) {
			updateCharacterProp(character, 'feat-core-race-1', newCoreFeats[0]);
		}
		if (newCoreFeats[2]) {
			updateCharacterProp(character, 'feat-core-upbringing-2', newCoreFeats[2]);
		}
		if (newCoreFeats[3]) {
			updateCharacterProp(character, 'feat-core-upbringing-3', newCoreFeats[3]);
		}
		// Always update the upbringing modifier feat
		updateCharacterProp(
			character,
			'feat-core-upbringing-1',
			`upbringing-${upbringing.toLowerCase()}`
		);
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
						value={currentRace.primaryRace}
						onChange={handlePrimaryRaceChange}
						label='Primary Race'
					/>
				</div>

				{/* Half Breed section - 50% width */}
				<div style={{ flex: 1 }}>
					<div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
						<input
							type='checkbox'
							id='half-race-toggle'
							checked={currentRace.halfRace !== null}
							onChange={() => handleHalfRaceToggle(currentRace.halfRace === null)}
							style={{ marginRight: '5px' }}
						/>
						<label htmlFor='half-race-toggle'>Half Breed</label>
					</div>

					{currentRace.halfRace !== null && (
						<DropdownSelect
							id='half-race'
							options={Object.entries(Race).reduce(
								(filtered, [key, value]) => {
									// Filter out the primary race from options
									if (value !== currentRace.primaryRace) {
										filtered[key] = value;
									}
									return filtered;
								},
								{} as Record<string, Race>
							)}
							value={currentRace.halfRace}
							onChange={handleHalfRaceChange}
						/>
					)}
				</div>
			</div>

			{/* Combine racial stats toggle */}
			{currentRace.halfRace !== null && (
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
							checked={currentRace.combineHalfRaceStats}
							onChange={() => handleCombineStatsChange(!currentRace.combineHalfRaceStats)}
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
					value={currentRace.upbringing}
					onChange={handleUpbringingChange}
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
						value={currentRace.upbringingPlusModifier.name}
						onChange={handleUpbringingPlusChange}
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
						value={currentRace.upbringingMinusModifier.name}
						onChange={handleUpbringingMinusChange}
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
					Close
				</button>
			</div>
		</div>
	);
};

export default RaceSetupModal;
