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
} from '../types/feats';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

interface FeatSlot {
	level: number;
	type: FeatType;
	featId: string | null;
	isCore: boolean;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedSlot, setSelectedSlot] = useState<FeatSlot | null>(null);

	const sheet = CharacterSheet.from(character.props);
	const characterLevel = sheet.attributes.getNode(AttributeType.Level)?.baseValue || 1;

	// Get all current feats
	const currentFeats = sheet.getFeats();
	const coreFeats = sheet.race.getCoreFeats().concat(sheet.characterClass.getCoreClassFeats());

	// Generate feat slots for all levels
	const generateFeatSlots = (): FeatSlot[] => {
		const slots: FeatSlot[] = [];

		// Level 0 - Core feats from race/upbringing
		const raceCoreFeats = sheet.race.getCoreFeats();
		raceCoreFeats.forEach(featId => {
			slots.push({
				level: 0,
				type: FeatType.Core,
				featId,
				isCore: true,
			});
		});

		// Level 1+ - Class core feats and general feats
		for (let level = 1; level <= characterLevel; level++) {
			if (level === 1) {
				// Add class core feats
				const classCoreFeats = sheet.characterClass.getCoreClassFeats();
				classCoreFeats.forEach(featId => {
					slots.push({
						level: 1,
						type: FeatType.Core,
						featId,
						isCore: true,
					});
				});
			}

			// Add general feat slots
			if (level % 2 === 1) {
				// Odd levels: Minor Feats
				const nonCoreFeats = currentFeats.filter(feat => !coreFeats.includes(feat));
				const minorFeatForLevel = nonCoreFeats.find(feat => {
					const featDef = FEATS[feat];
					return featDef && featDef.type === FeatType.Minor;
				});

				slots.push({
					level,
					type: FeatType.Minor,
					featId: minorFeatForLevel || null,
					isCore: false,
				});
			} else {
				// Even levels: Major Feats
				const nonCoreFeats = currentFeats.filter(feat => !coreFeats.includes(feat));
				const majorFeatForLevel = nonCoreFeats.find(feat => {
					const featDef = FEATS[feat];
					return featDef && featDef.type === FeatType.Major;
				});

				slots.push({
					level,
					type: FeatType.Major,
					featId: majorFeatForLevel || null,
					isCore: false,
				});
			}
		}

		return slots;
	};

	const featSlots = generateFeatSlots();

	// Check if a level has missing slots (for collapsed view)
	const levelHasMissingSlots = (levelSlots: FeatSlot[]): boolean => {
		return levelSlots.some(slot => !slot.isCore && slot.featId === null);
	};

	// Group slots by level
	const slotsByLevel = featSlots.reduce(
		(acc, slot) => {
			if (!acc[slot.level]) {
				acc[slot.level] = [];
			}
			acc[slot.level].push(slot);
			return acc;
		},
		{} as Record<number, FeatSlot[]>
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

		// Add feats of allowed types
		allowedTypes.forEach(type => {
			const featsOfType = getFeatsByType(type).filter(
				feat =>
					(feat.category === FeatCategory.General ||
						feat.category === FeatCategory.ClassRole ||
						feat.category === FeatCategory.ClassFlavor) &&
					!currentFeats.includes(feat.id) &&
					(!feat.level || feat.level <= characterLevel)
			);
			availableFeats.push(...featsOfType);
		});

		return availableFeats;
	};

	// Handle feat selection
	const handleFeatSelect = (slot: FeatSlot, featId: string | null) => {
		if (slot.isCore) return; // Can't change core feats

		// Remove old feat if it exists
		if (slot.featId) {
			updateCharacterProp(character, `feat:${slot.featId}`, '');
		}

		// Add new feat if selected
		if (featId) {
			updateCharacterProp(character, `feat:${featId}`, 'true');
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
											{slots.map((slot, index) => {
												const feat = slot.featId ? getFeatDefinition(slot.featId) : null;
												const hasSlot = slot.featId !== null;
												const isEmpty = !hasSlot && !slot.isCore;

												return (
													<div
														key={index}
														style={{
															padding: '8px',
															border: `1px solid ${isEmpty ? 'orange' : 'var(--text)'}`,
															borderRadius: '4px',
															backgroundColor: slot.isCore
																? 'var(--background-alt)'
																: 'var(--background)',
															cursor: slot.isCore ? 'default' : 'pointer',
															minHeight: '80px',
															display: 'flex',
															flexDirection: 'column',
															boxSizing: 'border-box',
														}}
														onClick={() => !slot.isCore && setSelectedSlot(slot)}
														onKeyDown={e => {
															if ((e.key === 'Enter' || e.key === ' ') && !slot.isCore) {
																setSelectedSlot(slot);
															}
														}}
														tabIndex={slot.isCore ? -1 : 0}
														role={slot.isCore ? undefined : 'button'}
														aria-label={slot.isCore ? undefined : 'Select feat slot'}
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
																{slot.type} Feat
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
																{slot.isCore ? 'No feat assigned' : 'Click to assign feat'}
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
							Select {selectedSlot.type} Feat for Level {selectedSlot.level}
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
							{getAvailableFeats(selectedSlot.type).map(feat => (
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
