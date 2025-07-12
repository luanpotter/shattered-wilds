import React, { useState } from 'react';
import { FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet, AttributeType } from '../types';
import {
	FEATS,
	FeatDefinition,
	FeatType,
	FeatCategory,
	getFeatsByType,
	getUpbringingModifierFeat,
	getClassSpecificFeats,
	getAllFeatSlots,
	FeatSlot,
} from '../types/feats';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

interface DisplaySlot {
	slot: FeatSlot;
	featId: string | null;
	isCore: boolean;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedSlot, setSelectedSlot] = useState<DisplaySlot | null>(null);

	const sheet = CharacterSheet.from(character.props);
	const characterLevel = sheet.attributes.getNode(AttributeType.Level)?.baseValue || 1;

	// Get all feat slots for this character level
	const allFeatSlots = getAllFeatSlots(characterLevel);

	// Get current assigned feats for each slot
	const currentFeatSlots = sheet.getFeatSlots();

	// Generate display slots with current feat assignments
	const generateDisplaySlots = (): DisplaySlot[] => {
		const displaySlots: DisplaySlot[] = [];

		allFeatSlots.forEach(slot => {
			const featId = currentFeatSlots[slot.id] || null;
			const isCore = slot.type === FeatType.Core;

			// For core slots, auto-assign if not already assigned
			if (isCore && !featId) {
				const autoAssignedFeat = getAutoAssignedCoreFeat(slot, sheet);
				if (autoAssignedFeat) {
					// Auto-assign core feat
					updateCharacterProp(character, slot.id, autoAssignedFeat);
				}
			}

			displaySlots.push({
				slot,
				featId: featId || (isCore ? getAutoAssignedCoreFeat(slot, sheet) : null),
				isCore,
			});
		});

		return displaySlots;
	};

	// Auto-assign core feats based on slot type
	const getAutoAssignedCoreFeat = (slot: FeatSlot, sheet: CharacterSheet): string | null => {
		const raceCoreFeats = sheet.race.getCoreFeats();
		const classCoreFeats = sheet.characterClass.getCoreClassFeats();

		switch (slot.id) {
			case 'feat-core-race-1':
				return raceCoreFeats[0] || null;
			case 'feat-core-upbringing-1':
				return `upbringing-${sheet.race.upbringing.toLowerCase()}`;
			case 'feat-core-upbringing-2':
				return raceCoreFeats[1] || null; // Specialized knowledge
			case 'feat-core-upbringing-3':
				return raceCoreFeats[2] || null; // Upbringing specific feat
			case 'feat-core-class-1':
				return classCoreFeats[0] || null; // Class modifier
			case 'feat-core-class-2':
				return classCoreFeats[1] || null; // Role feat
			case 'feat-core-class-3':
				return classCoreFeats[2] || null; // Flavor feat
			default:
				return null;
		}
	};

	const displaySlots = generateDisplaySlots();

	// Check if a level has missing slots (for collapsed view)
	const levelHasMissingSlots = (levelSlots: DisplaySlot[]): boolean => {
		return levelSlots.some(slot => !slot.isCore && slot.featId === null);
	};

	// Group slots by level
	const slotsByLevel = displaySlots.reduce(
		(acc, displaySlot) => {
			const level = displaySlot.slot.level;
			if (!acc[level]) {
				acc[level] = [];
			}
			acc[level].push(displaySlot);
			return acc;
		},
		{} as Record<number, DisplaySlot[]>
	);

	// Initialize collapsed levels - start complete levels collapsed, keep incomplete levels open
	const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(() => {
		const initialCollapsed = new Set<number>();
		Object.entries(slotsByLevel).forEach(([level, slots]) => {
			if (!levelHasMissingSlots(slots)) {
				initialCollapsed.add(parseInt(level));
			}
		});
		return initialCollapsed;
	});

	// Get available feats for selection
	const getAvailableFeats = (slotType: FeatType): FeatDefinition[] => {
		if (slotType === FeatType.Core) return [];

		// For Major feat slots, include both Major and Minor feats
		// For Minor feat slots, only include Minor feats
		const allowedTypes =
			slotType === FeatType.Major ? [FeatType.Major, FeatType.Minor] : [FeatType.Minor];

		const availableFeats: FeatDefinition[] = [];

		// Get currently assigned feats to avoid duplicates
		const currentlyAssignedFeats = Object.values(currentFeatSlots);

		// Get class-specific feat IDs available for this character
		const classSpecificFeatIds = getClassSpecificFeats(sheet.characterClass.characterClass);

		// Add feats of allowed types
		allowedTypes.forEach(type => {
			const featsOfType = getFeatsByType(type).filter(feat => {
				// Include if it's a general feat OR a class-specific feat for this character
				const isGeneralFeat = feat.category === FeatCategory.General;
				const isClassSpecificFeat = classSpecificFeatIds.includes(feat.id);

				return (
					(isGeneralFeat || isClassSpecificFeat) &&
					!currentlyAssignedFeats.includes(feat.id) &&
					(!feat.level || feat.level <= characterLevel)
				);
			});
			availableFeats.push(...featsOfType);
		});

		return availableFeats;
	};

	// Handle feat selection
	const handleFeatSelect = (displaySlot: DisplaySlot, featId: string | null) => {
		if (displaySlot.isCore) return; // Can't change core feats

		// Update the slot with the new feat (or remove if null)
		if (featId) {
			updateCharacterProp(character, displaySlot.slot.id, featId);
		} else {
			updateCharacterProp(character, displaySlot.slot.id, '');
		}

		setSelectedSlot(null);
	};

	// Get feat definition with proper handling of dynamic upbringing modifiers
	const getFeatDefinition = (featId: string): FeatDefinition | null => {
		if (featId.startsWith('upbringing-')) {
			return getUpbringingModifierFeat(
				sheet.race.upbringing,
				sheet.race.upbringingPlusModifier,
				sheet.race.upbringingMinusModifier
			);
		}
		return FEATS[featId] || null;
	};

	// Toggle level collapse
	const toggleLevelCollapse = (level: number) => {
		const newCollapsedLevels = new Set(collapsedLevels);
		if (newCollapsedLevels.has(level)) {
			newCollapsedLevels.delete(level);
		} else {
			newCollapsedLevels.add(level);
		}
		setCollapsedLevels(newCollapsedLevels);
	};

	return (
		<div
			style={{
				padding: '16px',
				boxSizing: 'border-box',
				width: 'fit-content',
				maxWidth: 'calc(100vw - 32px)',
				minHeight: '500px',
			}}
		>
			{/* Level-based Feat Display */}
			<div
				style={{
					maxHeight: '600px',
					overflowY: 'auto',
					overflowX: 'hidden',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					boxSizing: 'border-box',
					width: '650px',
				}}
			>
				{Object.entries(slotsByLevel)
					.sort(([a], [b]) => parseInt(a) - parseInt(b))
					.map(([level, slots]) => {
						const isCollapsed = collapsedLevels.has(parseInt(level));
						const hasMissingSlots = levelHasMissingSlots(slots);

						return (
							<div
								key={level}
								style={{
									borderBottom: '1px solid var(--text)',
									backgroundColor: level === '0' ? 'var(--background-alt)' : 'var(--background)',
								}}
							>
								{/* Level Header - Clickable */}
								<div
									style={{
										padding: '12px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										borderBottom: isCollapsed ? 'none' : '1px solid var(--text-secondary)',
									}}
									onClick={() => toggleLevelCollapse(parseInt(level))}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											toggleLevelCollapse(parseInt(level));
										}
									}}
									tabIndex={0}
									role='button'
									aria-label={`Toggle Level ${level} ${isCollapsed ? 'expand' : 'collapse'}`}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										{isCollapsed ? <FaChevronRight size={12} /> : <FaChevronDown size={12} />}
										<h4 style={{ margin: 0, color: 'var(--text)' }}>Level {level}</h4>
										{isCollapsed && hasMissingSlots && (
											<FaExclamationTriangle
												size={12}
												style={{ color: 'orange' }}
												title='Level has missing feat slots'
											/>
										)}
									</div>
									<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
										{slots.length} feat{slots.length !== 1 ? 's' : ''}
									</div>
								</div>

								{/* Level Content - Collapsible */}
								{!isCollapsed && (
									<div style={{ padding: '12px', boxSizing: 'border-box' }}>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
												gap: '8px',
												width: '100%',
												boxSizing: 'border-box',
											}}
										>
											{slots.map((displaySlot, index) => {
												const feat = displaySlot.featId
													? getFeatDefinition(displaySlot.featId)
													: null;
												const hasSlot = displaySlot.featId !== null;
												const isEmpty = !hasSlot && !displaySlot.isCore;

												return (
													<div
														key={index}
														style={{
															padding: '8px',
															border: `1px solid ${isEmpty ? 'orange' : 'var(--text)'}`,
															borderRadius: '4px',
															backgroundColor: displaySlot.isCore
																? 'var(--background-alt)'
																: 'var(--background)',
															cursor: displaySlot.isCore ? 'default' : 'pointer',
															minHeight: '80px',
															display: 'flex',
															flexDirection: 'column',
															boxSizing: 'border-box',
														}}
														onClick={() => !displaySlot.isCore && setSelectedSlot(displaySlot)}
														onKeyDown={e => {
															if ((e.key === 'Enter' || e.key === ' ') && !displaySlot.isCore) {
																setSelectedSlot(displaySlot);
															}
														}}
														tabIndex={displaySlot.isCore ? -1 : 0}
														role={displaySlot.isCore ? undefined : 'button'}
														aria-label={displaySlot.isCore ? undefined : 'Select feat slot'}
													>
														<div
															style={{
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'space-between',
																marginBottom: '4px',
															}}
														>
															<div style={{ fontSize: '0.75em', color: 'var(--text-secondary)' }}>
																{displaySlot.slot.type} Feat
															</div>
															{isEmpty && (
																<FaExclamationTriangle
																	size={10}
																	style={{ color: 'orange' }}
																	title='Empty feat slot'
																/>
															)}
														</div>

														{feat ? (
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		fontWeight: 'bold',
																		marginBottom: '3px',
																		fontSize: '0.9em',
																		lineHeight: '1.2',
																	}}
																>
																	{feat.name}
																</div>
																<div
																	style={{
																		fontSize: '0.8em',
																		color: 'var(--text-secondary)',
																		lineHeight: '1.3',
																	}}
																>
																	{feat.description}
																</div>
															</div>
														) : (
															<div
																style={{
																	fontStyle: 'italic',
																	color: 'var(--text-secondary)',
																	fontSize: '0.8em',
																}}
															>
																{displaySlot.isCore ? 'No feat assigned' : 'Click to assign feat'}
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>
						);
					})}
			</div>

			{/* Feat Selection Modal */}
			{selectedSlot && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: 'var(--background)',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							padding: '20px',
							width: 'fit-content',
							maxWidth: 'min(600px, calc(100vw - 40px))',
							maxHeight: '70vh',
							overflow: 'auto',
							boxSizing: 'border-box',
						}}
					>
						<h4 style={{ margin: '0 0 16px 0' }}>
							Select {selectedSlot.slot.type} Feat for Level {selectedSlot.slot.level}
						</h4>

						<div style={{ marginBottom: '16px' }}>
							<button
								onClick={() => handleFeatSelect(selectedSlot, null)}
								style={{
									padding: '8px 16px',
									backgroundColor: 'var(--background-alt)',
									border: '1px solid var(--text)',
									borderRadius: '4px',
									cursor: 'pointer',
									marginRight: '8px',
								}}
							>
								Clear Slot
							</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{getAvailableFeats(selectedSlot.slot.type).map(feat => (
								<div
									key={feat.id}
									style={{
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										backgroundColor: 'var(--background-alt)',
									}}
									onClick={() => handleFeatSelect(selectedSlot, feat.id)}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleFeatSelect(selectedSlot, feat.id);
										}
									}}
									tabIndex={0}
									role='button'
									aria-label={`Select ${feat.name} feat`}
								>
									<div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{feat.name}</div>
									<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
										{feat.description}
									</div>
								</div>
							))}
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
							<button
								onClick={() => setSelectedSlot(null)}
								style={{
									padding: '8px 16px',
									backgroundColor: 'var(--background-alt)',
									border: '1px solid var(--text)',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

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
