import { CharacterSheet } from '@shattered-wilds/commons';
import { StatType, Race, Upbringing } from '@shattered-wilds/commons';
import React from 'react';

import { useStore } from '../../store';
import { FeatOrSlot } from '../../types/feats-section';
import { FeatBox } from '../FeatBox';
import { Button } from '../shared/Button';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';

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
	};

	const handleCombineStatsChange = (combineStats: boolean) => {
		updateCharacterProp(character, 'race.half.combined-stats', combineStats ? 'true' : 'false');
	};

	const handleUpbringingChange = (value: Upbringing) => {
		updateCharacterProp(character, 'upbringing', value);
	};

	const handleUpbringingPlusChange = (value: string) => {
		const attributeType = Object.values(StatType).find(type => type.name === value);
		if (attributeType) {
			updateCharacterProp(character, 'upbringing.plus', attributeType.name);
		}
	};

	const handleUpbringingMinusChange = (value: string) => {
		const attributeType = Object.values(StatType).find(type => type.name === value);
		if (attributeType) {
			updateCharacterProp(character, 'upbringing.minus', attributeType.name);
		}
	};

	return (
		<div style={{ padding: '10px' }}>
			<h3 style={{ margin: '0 0 15px 0' }}>Race Setup</h3>

			{/* Race Selection - First Row */}
			<div style={{ display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<LabeledDropdown
						variant='normal'
						label='Primary Race'
						options={Object.values(Race)}
						value={currentRace.primaryRace}
						onChange={handlePrimaryRaceChange}
					/>
				</div>
				<div style={{ flex: 1, display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
					<LabeledCheckbox
						label='Half Breed'
						checked={currentRace.halfRace !== null}
						onChange={() => handleHalfRaceToggle(currentRace.halfRace === null)}
					/>
					{currentRace.halfRace !== null && (
						<LabeledDropdown
							variant='normal'
							options={Object.values(Race).filter(r => r !== currentRace.primaryRace)}
							value={currentRace.halfRace}
							onChange={handleHalfRaceChange}
						/>
					)}
				</div>
			</div>

			{/* Combine racial stats toggle */}
			{currentRace.halfRace !== null && (
				<LabeledCheckbox
					label='Combine racial attribute bonuses from both races'
					checked={currentRace.combineHalfRaceStats}
					onChange={() => handleCombineStatsChange(!currentRace.combineHalfRaceStats)}
				/>
			)}

			{/* Upbringing Selection - Second Row */}
			<div style={{ marginBottom: '15px' }}>
				<LabeledDropdown
					variant='normal'
					label='Upbringing'
					options={Object.values(Upbringing)}
					value={currentRace.upbringing}
					onChange={handleUpbringingChange}
				/>
			</div>

			{/* Upbringing Modifiers - Third Row */}
			<div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
				<div style={{ flex: 1 }}>
					<LabeledDropdown
						variant='normal'
						options={StatType.mindOrSoulAttributes}
						value={currentRace.upbringingPlusModifier.name}
						onChange={handleUpbringingPlusChange}
						label='Upbringing +1 Modifier'
					/>
				</div>
				<div style={{ flex: 1 }}>
					<LabeledDropdown
						variant='normal'
						options={StatType.mindOrSoulAttributes}
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
					<span style={{ fontWeight: 'bold' }}>{sheet.size}</span>
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
				<h3 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Core Feats (Level 0) [{coreFeats.length} feats]</h3>
				<div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{coreFeats.map(feat => (
						<FeatBox key={feat.name} featOrSlot={new FeatOrSlot({ info: feat })} character={character} />
					))}
				</div>
			</div>

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};

export default RaceSetupModal;
