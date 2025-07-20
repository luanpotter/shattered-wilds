import React from 'react';

import { StatNode, StatTree, StatType } from '../../types';

import { LevelSection } from './LevelSection';
import { PointAllocationWarning } from './PointAllocationWarning';
import { useHandleAllocatePoint, useHandleDeallocatePoint, getRealmBackgroundColor } from './shared-logic';
import { StatValueComponent } from './StatValueComponent';

interface StatTreeGridComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId: string;
}

export const StatTreeGridComponent: React.FC<StatTreeGridComponentProps> = ({
	tree,
	onUpdateCharacterProp,
	characterId,
}) => {
	const onAllocate = useHandleAllocatePoint(onUpdateCharacterProp);
	const onDeallocate = useHandleDeallocatePoint(onUpdateCharacterProp);

	const StatValue = ({ node }: { node: StatNode }) => {
		return (
			<StatValueComponent
				tree={tree}
				node={node}
				canAllocate={node.canAllocatePoint}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => onAllocate(node)}
				onRightClick={() => onDeallocate(node)}
				characterId={characterId}
			/>
		);
	};

	// Get realms in order
	const bodyRealm = tree.getNode(StatType.Body);
	const mindRealm = tree.getNode(StatType.Mind);
	const soulRealm = tree.getNode(StatType.Soul);

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
						<PointAllocationWarning node={attribute} />
					</div>
					<StatValue node={attribute} />
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
							<StatValue node={skill} />
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
					<StatValue node={realm} />
					<PointAllocationWarning node={realm} />
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
				attributeValueNode={<StatValue node={tree.root} />}
				variant='compact'
			/>

			{/* Main Grid Layout */}
			<div style={{ display: 'flex', gap: '1rem' }}>
				{/* Vertical Realm Labels Column */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					<RealmLabel realm={bodyRealm} />
					<RealmLabel realm={mindRealm} />
					<RealmLabel realm={soulRealm} />
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
					<AttributePanel attribute={tree.getNode(StatType.STR)} />
					<AttributePanel attribute={tree.getNode(StatType.DEX)} />
					<AttributePanel attribute={tree.getNode(StatType.CON)} />

					{/* Mind Row */}
					<AttributePanel attribute={tree.getNode(StatType.INT)} />
					<AttributePanel attribute={tree.getNode(StatType.WIS)} />
					<AttributePanel attribute={tree.getNode(StatType.CHA)} />

					{/* Soul Row */}
					<AttributePanel attribute={tree.getNode(StatType.DIV)} />
					<AttributePanel attribute={tree.getNode(StatType.FOW)} />
					<AttributePanel attribute={tree.getNode(StatType.LCK)} />
				</div>
			</div>
		</div>
	);
};
