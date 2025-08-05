import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

import { Character, CharacterSheet } from '../../types';
import { FeatsSection } from '../../types/feats-section';
import { FeatBox } from '../FeatBox';
import { Button } from '../shared/Button';

interface FeatsModalProps {
	character: Character;
	onClose: () => void;
}

export const FeatsModal: React.FC<FeatsModalProps> = ({ character, onClose }) => {
	const sheet = CharacterSheet.from(character.props);

	const featsSection = FeatsSection.create(sheet);

	// Initialize collapsed levels - start complete levels collapsed, keep incomplete levels open
	const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(() => {
		const lastLevel = Math.max(...featsSection.featsOrSlotsByLevel.map(e => e.level));
		return new Set(
			featsSection.featsOrSlotsByLevel.filter(e => !e.hasWarnings && e.level !== lastLevel).map(e => e.level),
		);
	});

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
				{featsSection.featsOrSlotsByLevel.map(({ level, featsOrSlots, warnings }) => {
					const isCollapsed = collapsedLevels.has(level);

					return (
						<div
							key={level}
							style={{
								borderBottom: '1px solid var(--text)',
								backgroundColor: isCollapsed ? 'var(--background-alt)' : 'var(--background)',
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
									{warnings.length > 0 && (
										<FaExclamationTriangle
											size={12}
											style={{ color: 'orange' }}
											title={`Level has ${warnings.length} warnings.`}
										/>
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
											return (
												<FeatBox
													key={featOrSlot.slot?.toProp() ?? featOrSlot.info?.feat.key}
													featOrSlot={featOrSlot}
													character={character}
												/>
											);
										})}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Action Buttons */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
