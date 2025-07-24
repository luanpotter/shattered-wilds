import { FeatDefinition, FeatInfo, FeatParameter, FeatSlot, FeatType } from '@shattered-wilds/commons';
import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet } from '../types';
import { FeatsSection } from '../types/feats-section';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedSlot, setSelectedSlot] = useState<FeatSlot | null>(null);
	const [selectedBaseFeat, setSelectedBaseFeat] = useState<FeatDefinition<string | void> | null>(null);
	const [parameter, setParameter] = useState<string | null>(null);
	const [parameterError, setParameterError] = useState<string | null>(null);

	const sheet = CharacterSheet.from(character.props);

	const featsSection = FeatsSection.create(sheet);

	// Initialize collapsed levels - start complete levels collapsed, keep incomplete levels open
	const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(() => {
		return new Set(featsSection.featsOrSlotsByLevel.filter(e => e.hasMissingSlots).map(e => e.level));
	});

	// Handle feat selection
	const handleFeatSelect = (slot: FeatSlot, feat: FeatDefinition<string | void> | null) => {
		const slotKey = slot.toProp();

		if (!feat) {
			// Clear slot
			updateCharacterProp(character, slotKey, undefined);
			setSelectedSlot(null);
			return;
		}

		if (feat?.parameter) {
			// This feat requires parameters - show parameter selection
			setSelectedBaseFeat(feat);
			setParameter(null);
			setParameterError(null);
			// Don't close the modal yet - wait for parameter selection
		} else {
			const info = FeatInfo.hydrateFeatDefinition(feat, {});
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
		setParameterError(null);

		// Create the parameterized feat instance
		const info = FeatInfo.hydrateFeatDefinition(
			selectedBaseFeat,
			parameter ? { [selectedBaseFeat.parameter!.id]: parameter } : {},
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

	const renderFeatParameterPicker = () => {
		const param = selectedBaseFeat?.parameter as FeatParameter<string>;
		if (!param) {
			return <></>;
		}
		const hasError = parameterError!;
		return (
			<div key={param.id} style={{ marginBottom: '12px' }}>
				<label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{param.name}</label>
				<select
					value={parameter ?? ''}
					onChange={e => handleParameterChange(e.target.value)}
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
					{param.values?.map(option => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
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
				{featsSection.featsOrSlotsByLevel.map(({ level, featsOrSlots, hasMissingSlots }) => {
					const isCollapsed = collapsedLevels.has(level);

					return (
						<div
							key={level}
							style={{
								borderBottom: '1px solid var(--text)',
								backgroundColor: level === 0 ? 'var(--background-alt)' : 'var(--background)',
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
								onClick={() => toggleLevelCollapse(level)}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										toggleLevelCollapse(level);
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
										<FaExclamationTriangle size={12} style={{ color: 'orange' }} title='Level has missing feat slots' />
									)}
								</div>
								<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
									{featsOrSlots.length} feat{featsOrSlots.length !== 1 ? 's' : ''}
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
										{featsOrSlots.map(featOrSlot => {
											const info = featOrSlot.info;
											const slot = featOrSlot.slot;

											const hasParameter = info?.parameter !== undefined;
											const slotType = info?.feat?.type ?? slot?.type;
											const isCore = slotType === FeatType.Core;

											const hasSlot = slot !== undefined;
											const isEmpty = !hasSlot && !isCore;
											const isClickable = !isCore && hasParameter;

											const key = slot?.toProp() || info?.feat?.key;

											const handleOpen = () => {
												if (featOrSlot.slot && isClickable) {
													setSelectedSlot(featOrSlot.slot);
												}
											};

											return (
												<div
													key={key}
													style={{
														padding: '8px',
														border: `1px solid ${isEmpty ? 'orange' : 'var(--text)'}`,
														borderRadius: '4px',
														backgroundColor: isCore ? 'var(--background-alt)' : 'var(--background)',
														cursor: isClickable ? 'pointer' : 'default',
														minHeight: '80px',
														display: 'flex',
														flexDirection: 'column',
														boxSizing: 'border-box',
													}}
													onClick={handleOpen}
													onKeyDown={e => {
														if (e.key === 'Enter' || e.key === ' ') {
															handleOpen();
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
															{slot?.name ?? `Core ${info?.feat?.category} Feat`}
														</div>
														{isEmpty && (
															<FaExclamationTriangle size={10} style={{ color: 'orange' }} title='Empty feat slot' />
														)}
													</div>

													{info ? (
														<div style={{ flex: 1 }}>
															<div
																style={{
																	fontWeight: 'bold',
																	marginBottom: '3px',
																	fontSize: '0.9em',
																	lineHeight: '1.2',
																}}
															>
																{info.name}
															</div>
															<div
																style={{
																	fontSize: '0.8em',
																	color: 'var(--text-secondary)',
																	lineHeight: '1.3',
																}}
															>
																{info.description}
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
															Click to assign feat
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
							{featsSection.availableFeatsForSlot(selectedSlot).map(feat => (
								<div
									key={feat.key}
									style={{
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										cursor: 'pointer',
										backgroundColor: 'var(--background-alt)',
									}}
									onClick={() => handleFeatSelect(selectedSlot, feat)}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleFeatSelect(selectedSlot, feat);
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
							{renderFeatParameterPicker()}
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
							<button
								onClick={() => {
									setSelectedBaseFeat(null);
									setParameter(null);
									setParameterError(null);
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
