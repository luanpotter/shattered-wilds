import { ActionCost, Resource, RESOURCES } from '@shattered-wilds/commons';
import React, { useState } from 'react';
import { FaCoins, FaMinus, FaPlus, FaTimes, FaCheck } from 'react-icons/fa';

import { useStore } from '../../store';
import { Character, CharacterSheet } from '../../types';
import { Button } from '../shared/Button';

interface ConsumeResourceModalProps {
	character: Character;
	costs: ActionCost[];
	onClose: () => void;
}

export const ConsumeResourceModal: React.FC<ConsumeResourceModalProps> = ({ character, costs, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const sheet = CharacterSheet.from(character.props);

	const [adjustedCosts, setAdjustedCosts] = useState(() =>
		costs.map(cost => ({ ...cost, adjustedAmount: cost.amount })),
	);

	const resourceStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '12px',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		backgroundColor: 'var(--background-alt)',
		marginBottom: '8px',
	};

	const getResourceDisplayName = (resource: Resource): string => {
		return RESOURCES[resource].shortName;
	};

	const adjustCost = (index: number, delta: number) => {
		setAdjustedCosts(prev =>
			prev.map((cost, i) =>
				i === index ? { ...cost, adjustedAmount: Math.max(0, cost.adjustedAmount + delta) } : cost,
			),
		);
	};

	const canAffordCosts = (): boolean => {
		return adjustedCosts.every(cost => {
			const currentValue = sheet.getResource(cost.resource).current;
			return currentValue >= cost.adjustedAmount;
		});
	};

	const handleConsume = () => {
		adjustedCosts.forEach(cost => {
			const currentValue = sheet.getResource(cost.resource).current;
			const newValue = currentValue - cost.adjustedAmount;
			const propKey = cost.resource;

			updateCharacterProp(character, propKey, newValue.toString());
		});
		onClose();
	};

	return (
		<div>
			<h3
				style={{
					textAlign: 'center',
					margin: '0 0 20px 0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '8px',
				}}
			>
				<FaCoins /> Consume Resources
			</h3>

			<div style={{ marginBottom: '20px' }}>
				{adjustedCosts.map((cost, index) => {
					const current = sheet.getResource(cost.resource).current;
					const max = sheet.getResource(cost.resource).max;
					const displayName = getResourceDisplayName(cost.resource);
					const insufficient = current < cost.adjustedAmount;

					return (
						<div key={`${cost.resource}-${index}`} style={resourceStyle}>
							<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
								<div
									style={{
										fontWeight: 'bold',
										color: insufficient ? 'var(--error-color, #ff6b6b)' : 'var(--text)',
									}}
								>
									{displayName}
								</div>
								<div style={{ fontSize: '0.9em', opacity: 0.8 }}>
									{current}/{max} available
								</div>
							</div>

							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								{cost.variable && (
									<Button
										onClick={() => adjustCost(index, -1)}
										icon={FaMinus}
										tooltip={`Decrease ${displayName} cost`}
										variant='inline'
										disabled={cost.adjustedAmount <= 0}
									/>
								)}

								<div
									style={{
										minWidth: '40px',
										textAlign: 'center',
										fontWeight: 'bold',
										color: insufficient ? 'var(--error-color, #ff6b6b)' : 'var(--text)',
									}}
								>
									{cost.adjustedAmount}
								</div>

								{cost.variable && (
									<Button
										onClick={() => adjustCost(index, 1)}
										icon={FaPlus}
										tooltip={`Increase ${displayName} cost`}
										variant='inline'
									/>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
				<Button onClick={onClose} icon={FaTimes} title='Cancel' variant='inline' />
				<Button onClick={handleConsume} icon={FaCheck} title='Consume' variant='inline' disabled={!canAffordCosts()} />
			</div>
		</div>
	);
};
