import React, { useState } from 'react';
import { FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet } from '../types';
import { FEATS, FeatDefinition, Feat, FeatInfo } from '../../../commons/src/feats';
import { FeatOrSlot, FeatsSection } from '../types/feats-section';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedSlot, setSelectedSlot] = useState<FeatOrSlot | null>(null);
	const [selectedBaseFeat, setSelectedBaseFeat] = useState<FeatDefinition<any> | null>(null);
	const [parameter, setParameter] = useState<string | null>(null);
	const [parameterError, setParameterError] = useState<string | null>(null);

	// State for nested parameterization
	const [nestedParameterFeat, setNestedParameterFeat] = useState<{
		parameterId: string;
		featId: string;
		feat: FeatDefinition<any>;
	} | null>(null);
	const [nestedParameters, setNestedParameters] = useState<Record<string, string>>({});
	const [nestedParameterErrors, setNestedParameterErrors] = useState<Set<string>>(new Set());

	const sheet = CharacterSheet.from(character.props);

	const featsSection = FeatsSection.create(sheet);

	// Initialize collapsed levels - start complete levels collapsed, keep incomplete levels open
	const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(() => {
		return new Set(featsSection.featsOrSlotsByLevel.filter(e => e.hasMissingSlots).map(e => e.level));
	});

	// Handle feat selection
	const handleFeatSelect = (featOrSlot: FeatOrSlot, feat: Feat | null) => {
		const slot = featOrSlot.slot;
		if (!slot) {
			return;
		}
		const slotKey = slot.toProp();

		if (!feat) {
			// Clear slot
			updateCharacterProp(character, slotKey, undefined);
			setSelectedSlot(null);
			return;
		}

		const featDef = FEATS[feat];
		if (featDef?.parameter) {
			// This feat requires parameters - show parameter selection
			setSelectedBaseFeat(featDef);
			setParameter(null);
			setParameterError(null);
			// Don't close the modal yet - wait for parameter selection
		} else {
			const info = FeatInfo.hydrateFeatDefinition(featDef, {});
			const [key, value] = info.toProp()!;
			updateCharacterProp(character, key, value);
			setSelectedSlot(null);
		}
	};

	// Handle parameterized feat confirmation
	const handleParameterizedFeatConfirm = () => {
		if (!selectedBaseFeat || !selectedSlot) return;

		// Validate all required parameters are filled
		const missingParameter = !selectedBaseFeat.parameter;

		if (missingParameter) {
			// Set error state for missing parameters
			setParameterError(`Missing required parameters for ${selectedBaseFeat.name}`);
			return;
		}

		// Clear any previous errors
		setParameterError(undefined);

		// Create the parameterized feat instance
		const info = FeatInfo.hydrateFeatDefinition(
			selectedBaseFeat,
			{
				[selectedBaseFeat.parameter!.id]: parameter,
			},
		);

		// Update the slot with the parameterized feat ID
		const [key, value] = info.toProp()!;
		updateCharacterProp(character, key, value);

		// Close modals
		setSelectedSlot(null);
		setSelectedBaseFeat(null);
		setParameter(null);
		setParameterError(null);
	};

	// Handle parameter value change
	const handleParameterChange = (value: string) => {
		setParameter(value);
		setParameterError(null);

		// Check if this parameter is a feat that needs further configuration
		const feat = FEATS[value];
		if (feat && feat.parameters && feat.parameters.length > 0) {
			// This is a parameterized feat - show nested configuration
			setNestedParameterFeat({
				parameterId,
				featId: value,
				feat,
			});
			setNestedParameters({});
			setNestedParameterErrors(new Set());
		}
	};

	// Handle nested parameter change
	const handleNestedParameterChange = (parameterId: string, value: string) => {
		setNestedParameters(prev => ({
			...prev,
			[parameterId]: value,
		}));

		// Clear error for this parameter when user starts typing/selecting
		if (nestedParameterErrors.has(parameterId)) {
			setNestedParameterErrors(prev => {
				const newErrors = new Set(prev);
				newErrors.delete(parameterId);
				return newErrors;
			});
		}
	};

	// Handle nested parameter confirmation
	const handleNestedParameterConfirm = () => {
		if (!nestedParameterFeat) return;

		// Validate nested parameters
		const missingNestedParameters = nestedParameterFeat.feat.parameters?.filter(
			param => param.required && !nestedParameters[param.id],
		);

		if (missingNestedParameters && missingNestedParameters.length > 0) {
			// Set error state for missing nested parameters
			const newErrors = new Set(missingNestedParameters.map(param => param.id));
			setNestedParameterErrors(newErrors);
			return;
		}

		// Clear any previous errors
		setNestedParameterErrors(new Set());

		// Create the parameterized feat instance
		const parameterizedFeat = createParameterizedFeat(nestedParameterFeat.featId, nestedParameters);

		// Update the main parameter with the parameterized feat ID
		setParameters(prev => ({
			...prev,
			[nestedParameterFeat.parameterId]: parameterizedFeat.fullId,
		}));

		// Close nested parameter modal
		setNestedParameterFeat(null);
		setNestedParameters({});
		setNestedParameterErrors(new Set());
	};

	// Get feat definition with proper handling of dynamic upbringing modifiers and parameterized feats
	const getFeatDefinition = (featId: string): FeatDefinition | null => {
		if (featId.startsWith('upbringing-')) {
			return getUpbringingModifierFeat(
				sheet.race.upbringing,
				sheet.race.upbringingPlusModifier,
				sheet.race.upbringingMinusModifier,
			);
		}

		// Handle parameterized feats
		if (isParameterizedFeat(featId)) {
			return getParameterizedFeatDefinition(featId);
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
												const feat = displaySlot.featId ? getFeatDefinition(displaySlot.featId) : null;
												const hasSlot = displaySlot.featId !== null;
												const isEmpty = !hasSlot && !displaySlot.isCore;

												// Allow clicking on core slots if they contain parameterized feats
												const isClickable =
													!displaySlot.isCore || (feat && feat.parameters && feat.parameters.length > 0);

												return (
													<div
														key={index}
														style={{
															padding: '8px',
															border: `1px solid ${isEmpty ? 'orange' : 'var(--text)'}`,
															borderRadius: '4px',
															backgroundColor: displaySlot.isCore ? 'var(--background-alt)' : 'var(--background)',
															cursor: isClickable ? 'pointer' : 'default',
															minHeight: '80px',
															display: 'flex',
															flexDirection: 'column',
															boxSizing: 'border-box',
														}}
														onClick={() => {
															if (isClickable) {
																// For parameterized core feats, directly open parameter modal
																if (displaySlot.isCore && feat && feat.parameters && feat.parameters.length > 0) {
																	setSelectedBaseFeat(feat);

																	// If it's already parameterized, extract existing parameters
																	if (displaySlot.featId && isParameterizedFeat(displaySlot.featId)) {
																		const { parameters: existingParams } = parseParameterizedFeatId(displaySlot.featId);
																		setParameters(existingParams);
																	} else {
																		setParameters({});
																	}
																	setParameterErrors(new Set());
																	setSelectedSlot(displaySlot); // Set slot for parameter assignment
																} else {
																	// For non-core feats, open feat selection modal
																	setSelectedSlot(displaySlot);
																}
															}
														}}
														onKeyDown={e => {
															if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
																// For parameterized core feats, directly open parameter modal
																if (displaySlot.isCore && feat && feat.parameters && feat.parameters.length > 0) {
																	setSelectedBaseFeat(feat);

																	// If it's already parameterized, extract existing parameters
																	if (displaySlot.featId && isParameterizedFeat(displaySlot.featId)) {
																		const { parameters: existingParams } = parseParameterizedFeatId(displaySlot.featId);
																		setParameters(existingParams);
																	} else {
																		setParameters({});
																	}
																	setParameterErrors(new Set());
																	setSelectedSlot(displaySlot); // Set slot for parameter assignment
																} else {
																	// For non-core feats, open feat selection modal
																	setSelectedSlot(displaySlot);
																}
															}
														}}
														tabIndex={isClickable ? 0 : -1}
														role={isClickable ? 'button' : undefined}
														aria-label={isClickable ? 'Select feat slot' : undefined}
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
																{displaySlot.slot.id.includes('specialized')
																	? displaySlot.slot.name
																	: `${displaySlot.slot.type} Feat`}
															</div>
															{isEmpty && (
																<FaExclamationTriangle size={10} style={{ color: 'orange' }} title='Empty feat slot' />
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
									<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{feat.description}</div>
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

			{/* Parameter Selection Modal */}
			{selectedBaseFeat && (
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
						zIndex: 1001,
					}}
				>
					<div
						style={{
							backgroundColor: 'var(--background)',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							padding: '20px',
							width: 'fit-content',
							maxWidth: 'min(500px, calc(100vw - 40px))',
							maxHeight: '70vh',
							overflow: 'auto',
							boxSizing: 'border-box',
						}}
					>
						<h4 style={{ margin: '0 0 16px 0' }}>Configure {selectedBaseFeat.name}</h4>

						<div style={{ marginBottom: '16px' }}>
							<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
								{selectedBaseFeat.description}
							</div>

							{selectedBaseFeat.parameters?.map(param => {
								const hasError = parameterErrors.has(param.id);
								return (
									<div key={param.id} style={{ marginBottom: '12px' }}>
										<label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
											{param.name} {param.required && <span style={{ color: 'red' }}>*</span>}
										</label>
										{param.type === 'choice' ? (
											<select
												value={parameters[param.id] || ''}
												onChange={e => handleParameterChange(param.id, e.target.value)}
												style={{
													width: '100%',
													padding: '6px',
													border: `1px solid ${hasError ? 'red' : 'var(--text)'}`,
													borderRadius: '4px',
													backgroundColor: 'var(--background)',
													color: 'var(--text)',
												}}
											>
												<option value=''>Select {param.name}...</option>
												{param.options?.map(option => (
													<option key={option} value={option}>
														{option}
													</option>
												))}
											</select>
										) : (
											<input
												type='text'
												value={parameters[param.id] || ''}
												onChange={e => handleParameterChange(param.id, e.target.value)}
												placeholder={param.placeholder}
												style={{
													width: '100%',
													padding: '6px',
													border: `1px solid ${hasError ? 'red' : 'var(--text)'}`,
													borderRadius: '4px',
													backgroundColor: 'var(--background)',
													color: 'var(--text)',
													boxSizing: 'border-box',
												}}
											/>
										)}
										{hasError && (
											<div
												style={{
													fontSize: '0.8em',
													color: 'red',
													marginTop: '4px',
												}}
											>
												This field is required
											</div>
										)}
									</div>
								);
							})}
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
							<button
								onClick={() => {
									setSelectedBaseFeat(null);
									setParameters({});
									setParameterErrors(new Set());
								}}
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
							<button
								onClick={handleParameterizedFeatConfirm}
								style={{
									padding: '8px 16px',
									backgroundColor: '#4CAF50',
									border: '1px solid #2E7D32',
									borderRadius: '4px',
									color: 'white',
									cursor: 'pointer',
								}}
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Nested Parameter Selection Modal */}
			{nestedParameterFeat && (
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
						zIndex: 1002,
					}}
				>
					<div
						style={{
							backgroundColor: 'var(--background)',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							padding: '20px',
							width: 'fit-content',
							maxWidth: 'min(500px, calc(100vw - 40px))',
							maxHeight: '70vh',
							overflow: 'auto',
							boxSizing: 'border-box',
						}}
					>
						<h4 style={{ margin: '0 0 16px 0' }}>Configure {nestedParameterFeat.feat.name}</h4>

						<div style={{ marginBottom: '16px' }}>
							<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
								{nestedParameterFeat.feat.description}
							</div>

							{nestedParameterFeat.feat.parameters?.map(param => {
								const hasError = nestedParameterErrors.has(param.id); // Use nestedParameterErrors
								return (
									<div key={param.id} style={{ marginBottom: '12px' }}>
										<label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
											{param.name} {param.required && <span style={{ color: 'red' }}>*</span>}
										</label>
										{param.type === 'choice' ? (
											<select
												value={nestedParameters[param.id] || ''}
												onChange={e => handleNestedParameterChange(param.id, e.target.value)}
												style={{
													width: '100%',
													padding: '6px',
													border: `1px solid ${hasError ? 'red' : 'var(--text)'}`,
													borderRadius: '4px',
													backgroundColor: 'var(--background)',
													color: 'var(--text)',
												}}
											>
												<option value=''>Select {param.name}...</option>
												{param.options?.map(option => (
													<option key={option} value={option}>
														{option}
													</option>
												))}
											</select>
										) : (
											<input
												type='text'
												value={nestedParameters[param.id] || ''}
												onChange={e => handleNestedParameterChange(param.id, e.target.value)}
												placeholder={param.placeholder}
												style={{
													width: '100%',
													padding: '6px',
													border: `1px solid ${hasError ? 'red' : 'var(--text)'}`,
													borderRadius: '4px',
													backgroundColor: 'var(--background)',
													color: 'var(--text)',
													boxSizing: 'border-box',
												}}
											/>
										)}
										{hasError && (
											<div
												style={{
													fontSize: '0.8em',
													color: 'red',
													marginTop: '4px',
												}}
											>
												This field is required
											</div>
										)}
									</div>
								);
							})}
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
							<button
								onClick={() => {
									setNestedParameterFeat(null);
									setNestedParameters({});
									setNestedParameterErrors(new Set());
								}}
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
							<button
								onClick={handleNestedParameterConfirm}
								style={{
									padding: '8px 16px',
									backgroundColor: '#4CAF50',
									border: '1px solid #2E7D32',
									borderRadius: '4px',
									color: 'white',
									cursor: 'pointer',
								}}
							>
								Confirm
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
