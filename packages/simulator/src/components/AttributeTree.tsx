import React from 'react';
import { FaUndo, FaExclamationTriangle } from 'react-icons/fa';

import { Attribute, AttributeHierarchy, AttributeType } from '../types';

interface AttributeTreeComponentProps {
	tree: Attribute;
	onUpdateCharacterProp: (key: string, value: string) => void;
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

export const AttributeTreeComponent: React.FC<AttributeTreeComponentProps> = ({
	tree,
	onUpdateCharacterProp,
}) => {
	if (!tree.grouped) {
		return <div>Loading...</div>;
	}

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

	const BaseValueAttributeNode: React.FC<{ node: Attribute }> = ({ node }) => {
		return (
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
				onClick={() => handleAllocatePoint(node)}
				onContextMenu={e => {
					e.preventDefault();
					handleDeallocatePoint(node);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleAllocatePoint(node);
					}
				}}
				tabIndex={0}
				role='button'
				aria-label={`Level ${node.baseValue}. Left-click to increase, right-click to decrease.`}
				title='Left-click to increase level, right-click to decrease'
			>
				{node.baseValue}
			</div>
		);
	};

	const ModifierAttributeNode: React.FC<{ node: Attribute }> = ({ node }) => {
		const modifier = tree.modifierOf(node.type);
		return (
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
				{modifier >= 0 ? `+${modifier}` : modifier}
			</div>
		);
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
		const modifier = tree.modifierOf(node.type);
		return (
			<AttributeValue
				baseValue={node.baseValue}
				finalModifier={modifier}
				canAllocate={canAllocatePoint(node)}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => handleAllocatePoint(node)}
				onRightClick={() => handleDeallocatePoint(node)}
			/>
		);
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
					<BaseValueAttributeNode node={tree} />
					<ModifierAttributeNode node={tree} />
				</div>
				<PointsAllocation node={tree} />
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
						<PointsAllocation node={tree} />
						<button
							onClick={() => {
								const updates = tree.children.flatMap(child => child.reset());
								for (const update of updates) {
									onUpdateCharacterProp(update.key, update.value);
								}
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
						{tree.children.map(realm => (
							<div
								key={realm.type.name}
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
									<span style={{ fontWeight: 'bold' }}>{realm.type.name}</span>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<AttributeValueNode node={realm} />
									</div>
								</div>
								<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{realm.type.description}</div>
							</div>
						))}
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
				</div>
				<div style={{ padding: '8px' }}>
					{tree.children.map(realm => {
						return (
							<div key={realm.type.name} style={{ marginBottom: '12px' }}>
								<div
									style={{
										padding: '4px 8px',
										fontSize: '0.9em',
										fontWeight: 'bold',
										// TODO: add color as property of attributes
										backgroundColor:
											realm.type === AttributeType.Body
												? 'rgba(255, 100, 100, 0.1)'
												: realm.type === AttributeType.Mind
													? 'rgba(100, 100, 255, 0.1)'
													: 'rgba(100, 255, 100, 0.1)',
										borderRadius: '4px',
										marginBottom: '4px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span>{realm.type.name} Attributes</span>
									<PointsAllocation node={realm} />
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '8px',
									}}
								>
									{realm.children.map(attr => {
										return (
											<div
												key={attr.type.name}
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
													<span style={{ fontWeight: 'bold' }}>{attr.type.name}</span>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
														<span style={{ fontSize: '0.8em' }}>{attr.baseValue} points</span>
														<AttributeValueNode node={attr} />
													</div>
												</div>
												<div style={{ fontSize: '0.8em', opacity: 0.8 }}>
													{attr.type.description}
												</div>
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
				</div>
				<div style={{ padding: '8px' }}>
					{/* Group by Basic Attribute */}
					{tree.grouped(AttributeHierarchy.BasicAttribute).map(attr => {
						const realm = attr.type.parent;
						return (
							<div key={attr.type.name} style={{ marginBottom: '12px' }}>
								<div
									style={{
										padding: '4px 8px',
										fontSize: '0.9em',
										fontWeight: 'bold',
										backgroundColor:
											realm === AttributeType.Body
												? 'rgba(255, 100, 100, 0.1)'
												: realm === AttributeType.Mind
													? 'rgba(100, 100, 255, 0.1)'
													: 'rgba(100, 255, 100, 0.1)',
										borderRadius: '4px',
										marginBottom: '4px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span>{attr.type.name} Skills</span>
									<PointsAllocation node={attr} />
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '8px',
									}}
								>
									{attr.children.map(skill => {
										return (
											<div
												key={skill.type.name}
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
													<span>{skill.type.name}</span>
													<AttributeValueNode node={skill} />
												</div>
												<div style={{ fontSize: '0.8em', opacity: 0.8 }}>
													{skill.type.description}
												</div>
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
