import React, { useState } from 'react';

import { useStore } from '../store';
import { Race, RaceInfo } from '../types';

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

	// Find the character by ID
	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return null;
	}

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
