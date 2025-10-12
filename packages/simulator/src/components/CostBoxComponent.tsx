import { ActionCost, ActionRowCost, CharacterSheet, RESOURCES } from '@shattered-wilds/commons';
import React from 'react';

import { useModals } from '../hooks/useModals';

import { ParameterBoxComponent } from './ParameterBoxComponent';

export const CostBoxComponent: React.FC<{
	cost: ActionRowCost;
}> = ({ cost }) => {
	return (
		<BaseCostBoxComponent
			characterId={cost.characterId}
			sheet={cost.characterSheet}
			name={cost.name}
			actionCosts={cost.actionCosts}
		/>
	);
};

const BaseCostBoxComponent: React.FC<{
	characterId: string;
	sheet: CharacterSheet;
	name: string;
	actionCosts: ActionCost[];
}> = ({ characterId, sheet, name, actionCosts }) => {
	const { openConsumeResourceModal } = useModals();

	const costs = actionCosts.map(cost => {
		const resource = RESOURCES[cost.resource];
		const value = `${cost.amount}${cost.variable ? '+' : ''} ${resource.shortCode}`;
		const tooltip = `${cost.amount}${cost.variable ? '+' : ''} ${resource.fullName}`;
		const current = sheet.getResource(cost.resource).current;
		const insufficient = current < cost.amount;
		return { value, tooltip, insufficient };
	});

	return (
		<ParameterBoxComponent
			title='COST'
			tooltip={costs.map(e => e.tooltip).join('\n')}
			onClick={() => {
				openConsumeResourceModal({
					characterId,
					actionCosts: actionCosts,
					title: `Consume Resources - ${name}`,
				});
			}}
		>
			{costs.map(e => (
				<div
					key={e.value}
					style={{
						color: e.insufficient ? 'var(--error-color)' : 'inherit',
					}}
				>
					{e.value}
				</div>
			))}
		</ParameterBoxComponent>
	);
};
