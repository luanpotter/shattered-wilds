import React from 'react';

import { useStore } from '../../store';
import { StatNode, StatTree, StatType } from '../../types';

import { PointAllocationWarning } from './PointAllocationWarning';
import { LevelSection, StatValueNode } from './shared-components';
import {
	handleAllocatePoint,
	handleDeallocatePoint,
	getRealmBackgroundColor,
	findAttributeByType,
} from './shared-logic';

interface StatTreeGridComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId?: string;
}

export const StatTreeGridComponent: React.FC<StatTreeGridComponentProps> = ({
	tree,
	onUpdateCharacterProp,
	disabled = false,
	characterId,
}) => {
	const editMode = useStore(state => state.editMode);

	const onAllocate = (node: StatNode) => handleAllocatePoint(node, disabled, onUpdateCharacterProp);
	const onDeallocate = (node: StatNode) => handleDeallocatePoint(node, disabled, onUpdateCharacterProp);

	// Get realms in order
	const bodyRealm = tree.root.children.find(r => r.type === StatType.Body);
	const mindRealm = tree.root.children.find(r => r.type === StatType.Mind);
	const soulRealm = tree.root.children.find(r => r.type === StatType.Soul);

	// Component for individual attribute panels
	const AttributePanel: React.FC<{ attribute: StatNode }> = ({ attribute }) => {
		return (
			<div
				style={{
					border: '1px solid var(--text)',
					borderRadius: '8px',
					backgroundColor: 'var(--background-alt)',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					minHeight: '200px',
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: '0.75rem',
						borderBottom: '1px solid var(--text)',
						backgroundColor: 'var(--background)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{attribute.type.name}</span>
						<PointAllocationWarning node={attribute} variant='compact' />
					</div>
					<StatValueNode
						node={attribute}
						tree={tree}
						onAllocate={onAllocate}
						onDeallocate={onDeallocate}
						{...(characterId && { characterId })}
					/>
				</div>

				{/* Skills */}
				<div style={{ padding: '0.75rem', flex: 1 }}>
					{attribute.children.map(skill => (
						<div
							key={skill.type.name}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '0.25rem 0',
								borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
								fontSize: '0.9rem',
							}}
						>
							<span style={{ flex: 1 }}>{skill.type.name}</span>
							<StatValueNode
								node={skill}
								tree={tree}
								onAllocate={onAllocate}
								onDeallocate={onDeallocate}
								variant='text-only'
								{...(characterId && { characterId })}
							/>
						</div>
					))}
				</div>
			</div>
		);
	};

	// Component for vertical realm labels
	const RealmLabel: React.FC<{ realm: StatNode }> = ({ realm }) => {
		return (
			<div
				style={{
					width: '120px',
					height: '100%',
					border: '1px solid var(--text)',
					borderRadius: '8px',
					backgroundColor: getRealmBackgroundColor(realm.type),
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '0.5rem',
					padding: '1rem 0.5rem',
					boxSizing: 'border-box',
				}}
			>
				<div
					style={{
						writingMode: 'vertical-lr',
						textOrientation: 'mixed',
						textTransform: 'uppercase',
						fontWeight: 'bold',
						fontSize: '2rem',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '0.5rem',
						transform: 'rotate(180deg)',
					}}
				>
					<span>{realm.type.name}</span>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
					<StatValueNode
						node={realm}
						tree={tree}
						onAllocate={onAllocate}
						onDeallocate={onDeallocate}
						{...(characterId && { characterId })}
					/>
					{editMode && <PointAllocationWarning node={realm} variant='compact' />}
				</div>
			</div>
		);
	};

	return (
		<div style={{ width: '100%', padding: '1rem', boxSizing: 'border-box' }}>
			{/* Level Section */}
			<LevelSection
				tree={tree}
				onUpdateCharacterProp={onUpdateCharacterProp}
				attributeValueNode={
					<StatValueNode
						node={tree.root}
						tree={tree}
						onAllocate={onAllocate}
						onDeallocate={onDeallocate}
						{...(characterId && { characterId })}
					/>
				}
				variant='compact'
			/>

			{/* Main Grid Layout */}
			<div style={{ display: 'flex', gap: '1rem' }}>
				{/* Vertical Realm Labels Column */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					{bodyRealm && <RealmLabel realm={bodyRealm} />}
					{mindRealm && <RealmLabel realm={mindRealm} />}
					{soulRealm && <RealmLabel realm={soulRealm} />}
				</div>

				{/* 3x3 Attribute Grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gridTemplateRows: 'repeat(3, 1fr)',
						gap: '1rem',
						flex: 1,
					}}
				>
					{/* Body Row */}
					{findAttributeByType(bodyRealm, StatType.STR) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.STR)!} />
					)}
					{findAttributeByType(bodyRealm, StatType.DEX) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.DEX)!} />
					)}
					{findAttributeByType(bodyRealm, StatType.CON) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.CON)!} />
					)}

					{/* Mind Row */}
					{findAttributeByType(mindRealm, StatType.INT) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.INT)!} />
					)}
					{findAttributeByType(mindRealm, StatType.WIS) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.WIS)!} />
					)}
					{findAttributeByType(mindRealm, StatType.CHA) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.CHA)!} />
					)}

					{/* Soul Row */}
					{findAttributeByType(soulRealm, StatType.DIV) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.DIV)!} />
					)}
					{findAttributeByType(soulRealm, StatType.FOW) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.FOW)!} />
					)}
					{findAttributeByType(soulRealm, StatType.LCK) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.LCK)!} />
					)}
				</div>
			</div>
		</div>
	);
};
