import { ActionRow, ActionRowBox, ActionRowCheckBox, ActionRowValueBox } from '@shattered-wilds/commons';
import React from 'react';
import { FaDice } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';

import { CostBoxComponent } from './CostBoxComponent';
import { ParameterBoxComponent } from './ParameterBoxComponent';
import { RichText } from './shared/RichText';

export type ActionRowComponentProps = {
	characterId: string;
	actionRow: ActionRow;
};

export const ActionRowComponent: React.FC<ActionRowComponentProps> = ({ characterId, actionRow }) => {
	return (
		<div key={actionRow.slug} style={{ display: 'flex', gap: '2px' }}>
			{actionRow.cost && <CostBoxComponent cost={actionRow.cost} />}

			<div
				style={{
					flex: 1,
					padding: '12px',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					backgroundColor: 'var(--background-alt)',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
					<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
						<span style={{ fontWeight: 'bold' }}>
							<a href={`/wiki/${actionRow.slug}`} target='_blank' rel='noreferrer'>
								{actionRow.title}
							</a>
						</span>
						{actionRow.traits.map(trait => (
							<span key={trait} className='trait'>
								{trait}
							</span>
						))}
					</div>
				</div>
				<div style={{ fontSize: '0.9em' }}>
					<RichText>{actionRow.description}</RichText>
				</div>
			</div>

			{actionRow.boxes.map(box => {
				const { key, data } = box;
				if (data instanceof ActionRowValueBox) {
					return <ValueParameter key={key} box={box} data={data} />;
				} else if (data instanceof ActionRowCheckBox) {
					return <CheckParameter key={key} characterId={characterId} box={box} data={data} />;
				}
				return null;
			})}
		</div>
	);
};

interface ValueParameterProps {
	box: ActionRowBox;
	data: ActionRowValueBox;
}

const ValueParameter: React.FC<ValueParameterProps> = ({ box, data }) => {
	return (
		<ParameterBoxComponent title={box.labels.join('\n')} tooltip={box.tooltip}>
			{data.value.description}
		</ParameterBoxComponent>
	);
};

interface CheckParameterProps {
	characterId: string;
	box: ActionRowBox;
	data: ActionRowCheckBox;
}

const CheckParameter: React.FC<CheckParameterProps> = ({ characterId, box, data }) => {
	const { openDiceRollModal } = useModals();

	const { labels, tooltip } = box;
	const { check, targetDC, errors } = data;

	const error = errors[0];
	if (error) {
		return (
			<ParameterBoxComponent title={error.title} tooltip={error.tooltip}>
				<div style={{ color: 'var(--error-color)' }}>{error.text}</div>
			</ParameterBoxComponent>
		);
	}

	const title = labels.join('\n');

	return (
		<ParameterBoxComponent
			title={title}
			tooltip={tooltip}
			onClick={() => {
				openDiceRollModal({
					characterId,
					check: check,
					...(targetDC !== undefined && { initialTargetDC: targetDC }),
				});
			}}
		>
			{check.statModifier.value.description}
			<FaDice size={12} />
			{targetDC !== undefined && <span> | DC: {targetDC}</span>}
		</ParameterBoxComponent>
	);
};
