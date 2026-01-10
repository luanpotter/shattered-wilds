import { ActionRowCost, CharacterSheet, ResourceCost } from '@shattered-wilds/d12';
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
			resourceCosts={cost.actionCosts}
		/>
	);
};

const BaseCostBoxComponent: React.FC<{
	characterId: string;
	sheet: CharacterSheet;
	name: string;
	resourceCosts: ResourceCost[];
}> = ({ characterId, sheet, name, resourceCosts }) => {
	const { openConsumeResourceModal } = useModals();

	const costs = resourceCosts.map(cost => {
		const value = cost.shortDescription;
		const tooltip = cost.longDescription;
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
					costs: resourceCosts,
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
