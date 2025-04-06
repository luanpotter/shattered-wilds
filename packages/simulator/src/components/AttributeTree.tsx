import React, { useState } from 'react';
import { FaUndo, FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { Attribute, AttributeHierarchy, AttributeType } from '../types';

interface AttributeTreeComponentProps {
	tree: Attribute;
	onUpdateCharacterProp: (key: string, value: string) => void;
}

// Value display with a colored background based on the value
const AttributeValue: React.FC<{
	baseValue: number;
	finalModifier: number;
	level: number;
	onClick?: () => void;
	onRightClick?: () => void;
	canAllocate?: boolean;
	canDeallocate?: boolean;
}> = ({
	baseValue,
	finalModifier,
	level,
	onClick,
	onRightClick,
	canAllocate = false,
	canDeallocate = false,
}) => {
	const handleContextMenu = (e: React.MouseEvent) => {
		// Always prevent default context menu
		e.preventDefault();
		if (canDeallocate && onRightClick) {
			onRightClick();
		}
	};

	const isCapped = finalModifier > level;
	const displayModifier = isCapped ? level : finalModifier;

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '24px',
					height: '24px',
					borderRadius: '50%',
					backgroundColor: canAllocate || canDeallocate ? 'var(--background-alt)' : 'transparent',
					border: '1px solid var(--text)',
					cursor: canAllocate || canDeallocate ? 'pointer' : 'default',
					fontSize: '0.9em',
					fontWeight: 'bold',
				}}
				onClick={canAllocate ? onClick : undefined}
				onContextMenu={handleContextMenu}
				onKeyDown={canAllocate ? e => e.key === 'Enter' && onClick?.() : undefined}
				tabIndex={canAllocate ? 0 : undefined}
				role={canAllocate ? 'button' : undefined}
				aria-label={
					canAllocate ? `Allocate point to attribute (current value: ${baseValue})` : undefined
				}
			>
				{baseValue}
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '24px',
					height: '24px',
					borderRadius: '4px',
					backgroundColor: 'var(--background-alt)',
					fontSize: '0.9em',
					fontWeight: displayModifier >= 0 ? 'bold' : 'normal',
					position: 'relative',
				}}
			>
				{displayModifier >= 0 ? `+${displayModifier}` : displayModifier}
				{isCapped && (
					<FaExclamationTriangle
						style={{
							position: 'absolute',
							bottom: '-2px',
							right: '-2px',
							width: '10px',
							height: '10px',
							color: 'orange',
							cursor: 'default',
						}}
						title={`Actual modifier: +${finalModifier} (capped to +${level} due to level)`}
					/>
				)}
			</div>
		</div>
	);
};

export const AttributeTreeComponent: React.FC<AttributeTreeComponentProps> = ({
	tree,
	onUpdateCharacterProp,
}) => {
	if (!tree.grouped) {
		return <div>Loading...</div>;
	}

	// State for tracking expanded tabs
	const [selectedRealm, setSelectedRealm] = useState<string | null>(null);
	const [selectedBasicAttribute, setSelectedBasicAttribute] = useState<string | null>(null);

	const canAllocatePoint = (node: Attribute) => {
		const parent = tree.getNode(node.type.parent);
		return parent?.canChildrenAllocatePoint ?? true;
	};

	const handleAllocatePoint = (node: Attribute) => {
		if (canAllocatePoint(node)) {
			onUpdateCharacterProp(node.type.name, (node.baseValue + 1).toString());
		}
	};

	const handleDeallocatePoint = (node: Attribute) => {
		if (node.canDeallocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.baseValue - 1).toString());
		}
	};

	const PointsAllocation: React.FC<{ node: Attribute }> = ({ node }) => {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
					{node.childrenAllocatedPoints}/{node.totalPointsToPropagate} points
					{node.childrenAllocatedPoints < node.totalPointsToPropagate &&
						node.totalPointsToPropagate > 0 && (
							<FaExclamationTriangle
								style={{ marginLeft: '6px', color: 'orange' }}
								title='You have unallocated points'
							/>
						)}
				</span>
			</div>
		);
	};

	const AttributeValueNode = ({ node }: { node: Attribute }) => {
		const modifier = tree.modifierOf(node);
		const level = tree.baseValue; // Get level from root node
		return (
			<AttributeValue
				baseValue={node.baseValue}
				finalModifier={modifier}
				level={level}
				canAllocate={canAllocatePoint(node)}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => handleAllocatePoint(node)}
				onRightClick={() => handleDeallocatePoint(node)}
			/>
		);
	};

	// Check if any children of a node have unallocated points
	const hasUnallocatedPoints = (node: Attribute): boolean => {
		if (node.childrenAllocatedPoints < node.totalPointsToPropagate && node.totalPointsToPropagate > 0) {
			return true;
		}
		
		return node.children.some(child => hasUnallocatedPoints(child));
	};

	// Get the background color for a realm
	const getRealmBackgroundColor = (realmType: AttributeType) => {
		return realmType === AttributeType.Body
			? 'rgba(255, 100, 100, 0.1)'
			: realmType === AttributeType.Mind
				? 'rgba(100, 100, 255, 0.1)'
				: 'rgba(100, 255, 100, 0.1)';
	};

	return (
		<div style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
			{/* Level Section */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '12px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{ fontWeight: 'bold' }}>Level:</span>
					<AttributeValueNode node={tree} />
				</div>
				<PointsAllocation node={tree} />
			</div>

			{/* Realms Section */}
			<div
				style={{
					marginBottom: '12px',
					borderRadius: '4px',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '8px',
					}}
				>
					{tree.children.map(realm => {
						const isSelected = selectedRealm === realm.type.name;
						const backgroundColor = getRealmBackgroundColor(realm.type);
						const hasUnallocated = hasUnallocatedPoints(realm);
						
						return (
							<div
								key={realm.type.name}
								style={{
									padding: '8px',
									border: '1px solid var(--text)',
									borderRadius: isSelected ? '4px 4px 0 0' : '4px',
									backgroundColor,
									position: 'relative',
									cursor: 'pointer',
									borderBottom: isSelected ? 'none' : '1px solid var(--text)',
								}}
								onClick={() => setSelectedRealm(isSelected ? null : realm.type.name)}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '4px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
										{isSelected ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
										<span style={{ fontWeight: 'bold' }}>{realm.type.name}</span>
										{hasUnallocated && (
											<FaExclamationTriangle
												style={{ color: 'orange', marginLeft: '4px' }}
												title='Contains unallocated points'
											/>
										)}
									</div>
									<AttributeValueNode node={realm} />
								</div>
								<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{realm.type.description}</div>
							</div>
						);
					})}
				</div>
				
				{/* Basic Attributes for Selected Realm */}
				{selectedRealm && (
					<div
						style={{
							border: '1px solid var(--text)',
							borderTop: 'none',
							borderRadius: '0 0 4px 4px',
							padding: '8px',
							marginBottom: '12px',
							backgroundColor: getRealmBackgroundColor(
								tree.children.find(r => r.type.name === selectedRealm)?.type || AttributeType.Body
							),
						}}
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(3, 1fr)',
								gap: '8px',
							}}
						>
							{tree.children
								.find(realm => realm.type.name === selectedRealm)
								?.children.map(attr => {
									const isSelected = selectedBasicAttribute === attr.type.name;
									const hasUnallocated = hasUnallocatedPoints(attr);

									return (
										<div
											key={attr.type.name}
											style={{
												padding: '8px',
												border: '1px solid var(--text)',
												borderRadius: isSelected ? '4px 4px 0 0' : '4px',
												backgroundColor: 'rgba(255, 255, 255, 0.1)',
												cursor: 'pointer',
												borderBottom: isSelected ? 'none' : '1px solid var(--text)',
											}}
											onClick={() => setSelectedBasicAttribute(isSelected ? null : attr.type.name)}
										>
											<div
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													marginBottom: '4px',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
													{isSelected ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
													<span style={{ fontWeight: 'bold' }}>{attr.type.name}</span>
													{hasUnallocated && (
														<FaExclamationTriangle
															style={{ color: 'orange', marginLeft: '4px' }}
															title='Contains unallocated points'
														/>
													)}
												</div>
												<AttributeValueNode node={attr} />
											</div>
											<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attr.type.description}</div>
										</div>
									);
								})}
						</div>

						{/* Skills for Selected Basic Attribute */}
						{selectedBasicAttribute && (
							<div
								style={{
									border: '1px solid var(--text)',
									borderTop: 'none',
									borderRadius: '0 0 4px 4px',
									padding: '8px',
									backgroundColor: 'rgba(255, 255, 255, 0.05)',
								}}
							>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '8px',
									}}
								>
									{tree.children
										.find(realm => realm.type.name === selectedRealm)
										?.children.find(attr => attr.type.name === selectedBasicAttribute)
										?.children.map(skill => (
											<div
												key={skill.type.name}
												style={{
													padding: '8px',
													border: '1px solid var(--text)',
													borderRadius: '4px',
													backgroundColor: 'rgba(255, 255, 255, 0.1)',
												}}
											>
												<div
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														marginBottom: '4px',
													}}
												>
													<span>{skill.type.name}</span>
													<AttributeValueNode node={skill} />
												</div>
												<div style={{ fontSize: '0.8em', opacity: 0.8 }}>
													{skill.type.description}
												</div>
											</div>
										))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Reset Points Button */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
				<button
					onClick={() => {
						const updates = tree.children.flatMap(child => child.reset());
						for (const update of updates) {
							onUpdateCharacterProp(update.key, update.value);
						}
					}}
					style={{
						background: 'none',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						padding: '4px 8px',
						color: 'var(--text)',
					}}
					title='Reset all points'
				>
					<FaUndo />
					<span>Reset All Points</span>
				</button>
			</div>
		</div>
	);
};
