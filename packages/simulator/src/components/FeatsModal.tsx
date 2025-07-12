import React, { useState } from 'react';

import { FEATS, FeatDefinition, FeatType, FeatCategory, getFeatsByType } from '../feats';
import { useStore } from '../store';
import { Character, CharacterSheet, AttributeType } from '../types';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedTab, setSelectedTab] = useState<'current' | 'available'>('current');

	const sheet = CharacterSheet.from(character.props);
	const characterLevel = sheet.attributes.getNode(AttributeType.Level)?.baseValue || 1;

	// Get all current feats
	const currentFeats = sheet.getFeats();
	const currentFeatDefinitions = currentFeats.map(featId => FEATS[featId]).filter(Boolean);

	// Group feats by category for display
	const groupedCurrentFeats = currentFeatDefinitions.reduce(
		(groups, feat) => {
			const category = feat.category;
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(feat);
			return groups;
		},
		{} as Record<FeatCategory, FeatDefinition[]>
	);

	// Calculate available feat slots
	const getAvailableFeatSlots = (level: number) => {
		const slots = {
			minorFeats: 0,
			majorFeats: 0,
		};

		for (let i = 1; i <= level; i++) {
			if (i % 2 === 1) {
				// Odd levels: Minor Feats
				slots.minorFeats++;
			} else {
				// Even levels: Major Feats
				slots.majorFeats++;
			}
		}

		return slots;
	};

	const availableSlots = getAvailableFeatSlots(characterLevel);

	// Count used non-core feats
	const usedNonCoreFeats = currentFeatDefinitions.filter(
		feat =>
			feat.category !== FeatCategory.Racial &&
			feat.category !== FeatCategory.Upbringing &&
			feat.category !== FeatCategory.ClassModifier &&
			feat.category !== FeatCategory.ClassRole &&
			feat.category !== FeatCategory.ClassFlavor
	);

	const usedMinorFeats = usedNonCoreFeats.filter(feat => feat.type === FeatType.Minor).length;
	const usedMajorFeats = usedNonCoreFeats.filter(feat => feat.type === FeatType.Major).length;

	const remainingMinorSlots = availableSlots.minorFeats - usedMinorFeats;
	const remainingMajorSlots = availableSlots.majorFeats - usedMajorFeats;

	// Get available feats for selection
	const availableMinorFeats = getFeatsByType(FeatType.Minor).filter(
		feat => !currentFeats.includes(feat.id) && (!feat.level || feat.level <= characterLevel)
	);

	const availableMajorFeats = getFeatsByType(FeatType.Major).filter(
		feat => !currentFeats.includes(feat.id) && (!feat.level || feat.level <= characterLevel)
	);

	// Handle feat selection
	const handleFeatToggle = (featId: string, isSelected: boolean) => {
		updateCharacterProp(character, `feat:${featId}`, isSelected ? 'true' : '');
	};

	const renderCurrentFeats = () => {
		return (
			<div>
				<div style={{ marginBottom: '16px' }}>
					<h4>Feat Slots (Level {characterLevel})</h4>
					<div style={{ display: 'flex', gap: '16px', fontSize: '0.9em' }}>
						<div>
							<strong>Minor Feats:</strong> {usedMinorFeats} / {availableSlots.minorFeats} used
						</div>
						<div>
							<strong>Major Feats:</strong> {usedMajorFeats} / {availableSlots.majorFeats} used
						</div>
					</div>
				</div>

				{Object.entries(groupedCurrentFeats).map(([category, feats]) => (
					<div key={category} style={{ marginBottom: '16px' }}>
						<h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
							{category} ({feats.length})
						</h4>
						{feats.map(feat => (
							<div
								key={feat.id}
								style={{
									marginBottom: '8px',
									padding: '8px',
									backgroundColor: 'var(--background-alt)',
									borderRadius: '4px',
									border: '1px solid var(--text)',
								}}
							>
								<div
									style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
								>
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{feat.name}</div>
										<div
											style={{
												fontSize: '0.8em',
												color: 'var(--text-secondary)',
												marginBottom: '4px',
											}}
										>
											{feat.type} • Level {feat.level || 0}
										</div>
										<div style={{ fontSize: '0.9em' }}>{feat.description}</div>
									</div>
									{feat.category === FeatCategory.General && (
										<button
											onClick={() => handleFeatToggle(feat.id, false)}
											style={{
												marginLeft: '8px',
												padding: '4px 8px',
												backgroundColor: 'var(--background)',
												border: '1px solid var(--text)',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '0.8em',
											}}
										>
											Remove
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		);
	};

	const renderAvailableFeats = () => {
		return (
			<div>
				<div style={{ marginBottom: '16px' }}>
					<h4>Available Feat Slots</h4>
					<div style={{ display: 'flex', gap: '16px', fontSize: '0.9em' }}>
						<div>
							<strong>Minor Feats:</strong> {remainingMinorSlots} remaining
						</div>
						<div>
							<strong>Major Feats:</strong> {remainingMajorSlots} remaining
						</div>
					</div>
				</div>

				{remainingMinorSlots > 0 && (
					<div style={{ marginBottom: '16px' }}>
						<h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
							Available Minor Feats
						</h4>
						<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
							{availableMinorFeats.map(feat => (
								<div
									key={feat.id}
									style={{
										marginBottom: '8px',
										padding: '8px',
										backgroundColor: 'var(--background-alt)',
										borderRadius: '4px',
										border: '1px solid var(--text)',
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'start',
										}}
									>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{feat.name}</div>
											<div
												style={{
													fontSize: '0.8em',
													color: 'var(--text-secondary)',
													marginBottom: '4px',
												}}
											>
												{feat.type} • Level {feat.level || 0}
											</div>
											<div style={{ fontSize: '0.9em' }}>{feat.description}</div>
										</div>
										<button
											onClick={() => handleFeatToggle(feat.id, true)}
											style={{
												marginLeft: '8px',
												padding: '4px 8px',
												backgroundColor: 'var(--background)',
												border: '1px solid var(--text)',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '0.8em',
											}}
										>
											Add
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{remainingMajorSlots > 0 && (
					<div style={{ marginBottom: '16px' }}>
						<h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
							Available Major Feats
						</h4>
						<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
							{availableMajorFeats.map(feat => (
								<div
									key={feat.id}
									style={{
										marginBottom: '8px',
										padding: '8px',
										backgroundColor: 'var(--background-alt)',
										borderRadius: '4px',
										border: '1px solid var(--text)',
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'start',
										}}
									>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{feat.name}</div>
											<div
												style={{
													fontSize: '0.8em',
													color: 'var(--text-secondary)',
													marginBottom: '4px',
												}}
											>
												{feat.type} • Level {feat.level || 0}
											</div>
											<div style={{ fontSize: '0.9em' }}>{feat.description}</div>
										</div>
										<button
											onClick={() => handleFeatToggle(feat.id, true)}
											style={{
												marginLeft: '8px',
												padding: '4px 8px',
												backgroundColor: 'var(--background)',
												border: '1px solid var(--text)',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '0.8em',
											}}
										>
											Add
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{remainingMinorSlots === 0 && remainingMajorSlots === 0 && (
					<div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
						No available feat slots. All feats for level {characterLevel} have been selected.
					</div>
				)}
			</div>
		);
	};

	return (
		<div style={{ padding: '16px', minWidth: '600px', minHeight: '400px' }}>
			<h3 style={{ margin: '0 0 16px 0' }}>Manage Feats for {character.props.name}</h3>

			{/* Tab Navigation */}
			<div style={{ display: 'flex', marginBottom: '16px' }}>
				{(['current', 'available'] as const).map(tab => (
					<button
						key={tab}
						onClick={() => setSelectedTab(tab)}
						style={{
							padding: '8px 16px',
							backgroundColor: selectedTab === tab ? '#2196F3' : 'var(--background-alt)',
							border: selectedTab === tab ? '2px solid #1976D2' : '1px solid var(--text)',
							borderRadius: selectedTab === tab ? '4px 4px 0 0' : '4px',
							color: selectedTab === tab ? 'white' : 'var(--text)',
							cursor: 'pointer',
							marginRight: '4px',
							fontWeight: selectedTab === tab ? 'bold' : 'normal',
							fontSize: selectedTab === tab ? '1em' : '0.9em',
							boxShadow: selectedTab === tab ? '0 2px 4px rgba(33, 150, 243, 0.3)' : 'none',
							transform: selectedTab === tab ? 'translateY(-2px)' : 'none',
						}}
					>
						{tab === 'current' ? 'Current Feats' : 'Available Feats'}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div
				style={{
					border: '1px solid var(--text)',
					borderRadius: '0 4px 4px 4px',
					padding: '16px',
					backgroundColor: 'var(--background)',
					minHeight: '400px',
					maxHeight: '600px',
					overflowY: 'auto',
				}}
			>
				{selectedTab === 'current' && renderCurrentFeats()}
				{selectedTab === 'available' && renderAvailableFeats()}
			</div>

			{/* Action Buttons */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
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
