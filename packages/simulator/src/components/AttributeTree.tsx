import React from 'react';
import { FaUndo } from 'react-icons/fa';

import { AttributeMap, AttributeType, RealmType, BasicAttributeType, SkillType } from '../types';
import {
	REALM_TO_BASIC_ATTRIBUTES,
	BASIC_ATTRIBUTE_TO_SKILLS,
	canAllocatePoint,
	allocatePoint,
	canDeallocatePoint,
	deallocatePoint,
	getUnallocatedPoints,
	calculateModifiers,
} from '../utils';

interface AttributeTreeProps {
	attributes: AttributeMap;
	onAttributeUpdate: (newAttributes: AttributeMap) => void;
}

// Value display with a colored background based on the value
const AttributeValue: React.FC<{
	baseValue: number;
	finalModifier: number;
	onClick?: () => void;
	onRightClick?: () => void;
	canAllocate?: boolean;
	canDeallocate?: boolean;
}> = ({
	baseValue,
	finalModifier,
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
					fontWeight: finalModifier >= 0 ? 'bold' : 'normal',
				}}
			>
				{finalModifier >= 0 ? `+${finalModifier}` : finalModifier}
			</div>
		</div>
	);
};

// Calculate allocated points for a specific realm
const getRealmAllocatedPoints = (attributes: AttributeMap, realmType: RealmType): number => {
	const realm =
		realmType === RealmType.Body
			? attributes.body
			: realmType === RealmType.Mind
				? attributes.mind
				: attributes.soul;

	return realm.baseValue;
};

// Calculate allocated points for a specific basic attribute
const getBasicAttributeAllocatedPoints = (
	attributes: AttributeMap,
	basicAttrType: BasicAttributeType
): number => {
	return attributes.basicAttributes[basicAttrType].baseValue;
};

// Calculate total allocated points in a group of attributes
const getGroupAllocatedPoints = (
	attributes: AttributeMap,
	group: BasicAttributeType[] | SkillType[]
): number => {
	if (!group.length) return 0;

	// If it's a basic attribute group
	if (Object.values(BasicAttributeType).includes(group[0] as BasicAttributeType)) {
		return (group as BasicAttributeType[]).reduce(
			(sum, attrType) => sum + attributes.basicAttributes[attrType].baseValue,
			0
		);
	}

	// If it's a skill group
	return (group as SkillType[]).reduce(
		(sum, skillType) => sum + attributes.skills[skillType].baseValue,
		0
	);
};

export const AttributeTree: React.FC<AttributeTreeProps> = ({ attributes, onAttributeUpdate }) => {
	const unallocatedPoints = getUnallocatedPoints(attributes);
	const totalPoints = attributes.level.baseValue;
	const allocatedPoints = totalPoints - unallocatedPoints;

	const handleAllocatePoint = (type: AttributeType, id: string) => {
		if (canAllocatePoint(attributes, type, id)) {
			const newAttributes = allocatePoint(attributes, type, id);
			onAttributeUpdate(newAttributes);
		}
	};

	const handleDeallocatePoint = (type: AttributeType, id: string) => {
		if (canDeallocatePoint(attributes, type, id)) {
			const newAttributes = deallocatePoint(attributes, type, id);
			onAttributeUpdate(newAttributes);
		}
	};

	const handleLevelIncrease = () => {
		if (attributes.level.baseValue < 20) {
			const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
			newAttributes.level.baseValue += 1;
			calculateModifiers(newAttributes);
			onAttributeUpdate(newAttributes);
		}
	};

	const handleLevelDecrease = () => {
		if (attributes.level.baseValue > 0) {
			// Check if all points from this level are unallocated
			const allocatedAtCurrentLevel = allocatedPoints - (attributes.level.baseValue - 1);
			
			if (allocatedAtCurrentLevel <= 0) {
				// Can decrease level if no points from this level are allocated
				const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
				newAttributes.level.baseValue -= 1;
				calculateModifiers(newAttributes);
				onAttributeUpdate(newAttributes);
			}
		}
	};

	return (
		<div style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
			{/* Level and Points Allocation */}
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
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: '24px',
							height: '24px',
							borderRadius: '50%',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							cursor: 'pointer',
							fontSize: '0.9em',
							fontWeight: 'bold',
						}}
						onClick={handleLevelIncrease}
						onContextMenu={e => {
							e.preventDefault();
							handleLevelDecrease();
						}}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleLevelIncrease();
							}
						}}
						tabIndex={0}
						role='button'
						aria-label={`Level ${attributes.level.baseValue}. Left-click to increase, right-click to decrease.`}
						title='Left-click to increase level, right-click to decrease'
					>
						{attributes.level.baseValue}
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
							fontWeight: 'bold',
						}}
					>
						{attributes.level.finalModifier >= 0
							? `+${attributes.level.finalModifier}`
							: attributes.level.finalModifier}
					</div>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
						{allocatedPoints}/{totalPoints} points
					</span>
				</div>
			</div>

			{/* Realms Section */}
			<div
				style={{
					marginBottom: '12px',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: '4px 8px',
						backgroundColor: 'var(--background-alt)',
						borderBottom: '1px solid var(--text)',
						fontWeight: 'bold',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>Realms</span>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontSize: '0.9em' }}>
							{getRealmAllocatedPoints(attributes, RealmType.Body) +
								getRealmAllocatedPoints(attributes, RealmType.Mind) +
								getRealmAllocatedPoints(attributes, RealmType.Soul)}
							/{totalPoints} points
						</span>
						<button
							onClick={() => {
								// Reset all realms
								const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
								newAttributes.body.baseValue = 0;
								newAttributes.mind.baseValue = 0;
								newAttributes.soul.baseValue = 0;

								// Reset all basic attributes and skills
								Object.values(BasicAttributeType).forEach(attrType => {
									newAttributes.basicAttributes[attrType].baseValue = 0;
									BASIC_ATTRIBUTE_TO_SKILLS[attrType].forEach(skillType => {
										newAttributes.skills[skillType].baseValue = 0;
									});
								});

								calculateModifiers(newAttributes);
								onAttributeUpdate(newAttributes);
							}}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.9em',
								padding: '2px',
								color: 'var(--text)',
							}}
							title='Reset all realm points'
						>
							<FaUndo />
						</button>
					</div>
				</div>
				<div style={{ padding: '8px' }}>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: '8px',
						}}
					>
						{/* Body Realm */}
						<div
							style={{
								padding: '8px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'rgba(255, 100, 100, 0.1)',
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
								<span style={{ fontWeight: 'bold' }}>{RealmType.Body}</span>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<AttributeValue
										baseValue={attributes.body.baseValue}
										finalModifier={attributes.body.finalModifier}
										canAllocate={canAllocatePoint(attributes, AttributeType.Realm, 'body')}
										canDeallocate={canDeallocatePoint(attributes, AttributeType.Realm, 'body')}
										onClick={() => handleAllocatePoint(AttributeType.Realm, 'body')}
										onRightClick={() => handleDeallocatePoint(AttributeType.Realm, 'body')}
									/>
								</div>
							</div>
							<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attributes.body.description}</div>
						</div>

						{/* Mind Realm */}
						<div
							style={{
								padding: '8px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'rgba(100, 100, 255, 0.1)',
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
								<span style={{ fontWeight: 'bold' }}>{RealmType.Mind}</span>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<AttributeValue
										baseValue={attributes.mind.baseValue}
										finalModifier={attributes.mind.finalModifier}
										canAllocate={canAllocatePoint(attributes, AttributeType.Realm, 'mind')}
										canDeallocate={canDeallocatePoint(attributes, AttributeType.Realm, 'mind')}
										onClick={() => handleAllocatePoint(AttributeType.Realm, 'mind')}
										onRightClick={() => handleDeallocatePoint(AttributeType.Realm, 'mind')}
									/>
								</div>
							</div>
							<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attributes.mind.description}</div>
						</div>

						{/* Soul Realm */}
						<div
							style={{
								padding: '8px',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								backgroundColor: 'rgba(100, 255, 100, 0.1)',
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
								<span style={{ fontWeight: 'bold' }}>{RealmType.Soul}</span>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<AttributeValue
										baseValue={attributes.soul.baseValue}
										finalModifier={attributes.soul.finalModifier}
										canAllocate={canAllocatePoint(attributes, AttributeType.Realm, 'soul')}
										canDeallocate={canDeallocatePoint(attributes, AttributeType.Realm, 'soul')}
										onClick={() => handleAllocatePoint(AttributeType.Realm, 'soul')}
										onRightClick={() => handleDeallocatePoint(AttributeType.Realm, 'soul')}
									/>
								</div>
							</div>
							<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attributes.soul.description}</div>
						</div>
					</div>
				</div>
			</div>

			{/* Basic Attributes Section */}
			<div
				style={{
					marginBottom: '12px',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: '4px 8px',
						backgroundColor: 'var(--background-alt)',
						borderBottom: '1px solid var(--text)',
						fontWeight: 'bold',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>Basic Attributes</span>
					<button
						onClick={() => {
							// Reset all basic attributes and skills
							const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
							Object.values(BasicAttributeType).forEach(attrType => {
								newAttributes.basicAttributes[attrType].baseValue = 0;
								BASIC_ATTRIBUTE_TO_SKILLS[attrType].forEach(skillType => {
									newAttributes.skills[skillType].baseValue = 0;
								});
							});

							calculateModifiers(newAttributes);
							onAttributeUpdate(newAttributes);
						}}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '0.9em',
							padding: '2px',
							color: 'var(--text)',
						}}
						title='Reset all basic attributes'
					>
						<FaUndo />
					</button>
				</div>
				<div style={{ padding: '8px' }}>
					{/* Group by Realm */}
					{Object.values(RealmType).map(realm => {
						const basicAttrs = REALM_TO_BASIC_ATTRIBUTES[realm];
						const allocatedPoints = getGroupAllocatedPoints(attributes, basicAttrs);
						const realmPoints = getRealmAllocatedPoints(attributes, realm);

						return (
							<div key={realm} style={{ marginBottom: '12px' }}>
								<div
									style={{
										padding: '4px 8px',
										fontSize: '0.9em',
										fontWeight: 'bold',
										backgroundColor:
											realm === RealmType.Body
												? 'rgba(255, 100, 100, 0.1)'
												: realm === RealmType.Mind
													? 'rgba(100, 100, 255, 0.1)'
													: 'rgba(100, 255, 100, 0.1)',
										borderRadius: '4px',
										marginBottom: '4px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span>{realm} Attributes</span>
									<span style={{ fontSize: '0.8em' }}>
										{allocatedPoints}/{realmPoints} points
									</span>
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '8px',
									}}
								>
									{REALM_TO_BASIC_ATTRIBUTES[realm].map(attrType => {
										const attr = attributes.basicAttributes[attrType];
										return (
											<div
												key={attrType}
												style={{
													padding: '8px',
													border: '1px solid var(--text)',
													borderRadius: '4px',
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
													<span style={{ fontWeight: 'bold' }}>{attrType}</span>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
														<span style={{ fontSize: '0.8em' }}>
															{getBasicAttributeAllocatedPoints(attributes, attrType)} points
														</span>
														<AttributeValue
															baseValue={attr.baseValue}
															finalModifier={attr.finalModifier}
															canAllocate={canAllocatePoint(
																attributes,
																AttributeType.BasicAttribute,
																attr.id
															)}
															canDeallocate={canDeallocatePoint(
																attributes,
																AttributeType.BasicAttribute,
																attr.id
															)}
															onClick={() =>
																handleAllocatePoint(AttributeType.BasicAttribute, attr.id)
															}
															onRightClick={() =>
																handleDeallocatePoint(AttributeType.BasicAttribute, attr.id)
															}
														/>
													</div>
												</div>
												<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attr.description}</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Skills Section */}
			<div
				style={{
					border: '1px solid var(--text)',
					borderRadius: '4px',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: '4px 8px',
						backgroundColor: 'var(--background-alt)',
						borderBottom: '1px solid var(--text)',
						fontWeight: 'bold',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>Skills</span>
					<button
						onClick={() => {
							// Reset all skills
							const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
							Object.values(SkillType).forEach(skillType => {
								newAttributes.skills[skillType].baseValue = 0;
							});

							calculateModifiers(newAttributes);
							onAttributeUpdate(newAttributes);
						}}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '0.9em',
							padding: '2px',
							color: 'var(--text)',
						}}
						title='Reset all skills'
					>
						<FaUndo />
					</button>
				</div>
				<div style={{ padding: '8px' }}>
					{/* Group by Basic Attribute */}
					{Object.values(BasicAttributeType).map(attrType => {
						const attr = attributes.basicAttributes[attrType];
						const realm = attr.realmType;
						const skills = BASIC_ATTRIBUTE_TO_SKILLS[attrType];
						const allocatedPoints = getGroupAllocatedPoints(attributes, skills);
						const basicAttrPoints = getBasicAttributeAllocatedPoints(attributes, attrType);

						return (
							<div key={attrType} style={{ marginBottom: '12px' }}>
								<div
									style={{
										padding: '4px 8px',
										fontSize: '0.9em',
										fontWeight: 'bold',
										backgroundColor:
											realm === RealmType.Body
												? 'rgba(255, 100, 100, 0.1)'
												: realm === RealmType.Mind
													? 'rgba(100, 100, 255, 0.1)'
													: 'rgba(100, 255, 100, 0.1)',
										borderRadius: '4px',
										marginBottom: '4px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span>{attrType} Skills</span>
									<span style={{ fontSize: '0.8em' }}>
										{allocatedPoints}/{basicAttrPoints} points
									</span>
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '8px',
									}}
								>
									{BASIC_ATTRIBUTE_TO_SKILLS[attrType].map(skillType => {
										const skill = attributes.skills[skillType];
										return (
											<div
												key={skillType}
												style={{
													padding: '8px',
													border: '1px solid var(--text)',
													borderRadius: '4px',
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
													<span>{skillType}</span>
													<AttributeValue
														baseValue={skill.baseValue}
														finalModifier={skill.finalModifier}
														canAllocate={canAllocatePoint(
															attributes,
															AttributeType.Skill,
															skill.id
														)}
														canDeallocate={canDeallocatePoint(
															attributes,
															AttributeType.Skill,
															skill.id
														)}
														onClick={() => handleAllocatePoint(AttributeType.Skill, skill.id)}
														onRightClick={() =>
															handleDeallocatePoint(AttributeType.Skill, skill.id)
														}
													/>
												</div>
												<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{skill.description}</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
