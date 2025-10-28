import {
	CharacterSheet,
	CircumstancesSection,
	Resource,
	RESOURCES,
	StatNode,
	StatTree,
	StatType,
} from '@shattered-wilds/commons';
import React from 'react';

import { getRealmColorWithAlpha } from '../stat-tree/shared-logic';

import { Bold, Dash, ValueBox } from './print-friendly-commons';

export const PrintFriendlyTree = ({ characterSheet }: { characterSheet: CharacterSheet }) => {
	const statTree: StatTree = characterSheet.getStatTree();
	const circumstancesSection = CircumstancesSection.create({ characterSheet });

	const ModifierBox = ({ statNode }: { statNode: StatNode }) => {
		const modifier = statTree.getModifier(statNode.type);
		return <ValueBox value={modifier.value} />;
	};

	const RealmLabel: React.FC<{ statType: StatType; resource: Resource }> = ({ statType, resource }) => {
		const resourceDef = RESOURCES[resource];
		const maxResource = circumstancesSection.resources[resource].max;
		return (
			<div
				style={{
					width: '120px',
					display: 'flex',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '0.5rem',
						padding: '1rem 0.5rem',
						boxSizing: 'border-box',
					}}
				>
					<ModifierBox statNode={statTree.getNode(statType)} />
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
							textDecoration: 'underline',
							textDecorationColor: getRealmColorWithAlpha(statType, 1),
						}}
					>
						<span>{statType.name}</span>
					</div>
				</div>
				<div
					style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'start',
						border: '1px solid black',
						gap: '4px',
					}}
				>
					<Bold>{resourceDef.shortCode}</Bold>
					{Array.from({ length: maxResource }, (_, idx) => (
						<div key={idx} style={{ width: '16px', height: '16px', border: '1px solid black' }} />
					))}
				</div>
			</div>
		);
	};

	const AttributePanel: React.FC<{ statType: StatType }> = ({ statType }) => {
		const node = statTree.getNode(statType);
		return (
			<div
				style={{
					border: '1px solid black',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<div
					style={{
						padding: '0.1em 0.75rem',
						borderBottom: '1px solid black',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Bold>{statType.name}</Bold>
					<Dash />
					<ModifierBox statNode={node} />
				</div>

				<div style={{ padding: '0.5rem 0.75rem' }}>
					{node.children.map(skill => (
						<div
							key={skill.type.name}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '0.1em 0',
							}}
						>
							<span>{skill.type.name}</span>
							<Dash />
							<ModifierBox statNode={skill} />
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div style={{ display: 'flex', gap: '1rem' }}>
			{/* Vertical Realm Labels Column */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
				<RealmLabel statType={StatType.Body} resource={Resource.VitalityPoint} />
				<RealmLabel statType={StatType.Mind} resource={Resource.FocusPoint} />
				<RealmLabel statType={StatType.Soul} resource={Resource.SpiritPoint} />
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
				<AttributePanel statType={StatType.STR} />
				<AttributePanel statType={StatType.DEX} />
				<AttributePanel statType={StatType.CON} />

				{/* Mind Row */}
				<AttributePanel statType={StatType.INT} />
				<AttributePanel statType={StatType.WIS} />
				<AttributePanel statType={StatType.CHA} />

				{/* Soul Row */}
				<AttributePanel statType={StatType.DIV} />
				<AttributePanel statType={StatType.FOW} />
				<AttributePanel statType={StatType.LCK} />
			</div>
		</div>
	);
};
