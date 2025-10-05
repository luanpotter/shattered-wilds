import {
	ActionRow,
	ActionRowBox,
	ActionRowCheckBox,
	ActionRowValueBox,
	ActionRowVariableBox,
	ARCANE_SCHOOLS,
	slugify,
} from '@shattered-wilds/commons';
import React from 'react';
import { FaDice } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';

import { CostBoxComponent } from './CostBoxComponent';
import { ParameterBoxComponent } from './ParameterBoxComponent';
import LabeledInput from './shared/LabeledInput';
import { RichText } from './shared/RichText';

export type ActionRowComponentProps = {
	characterId: string;
	actionRow: ActionRow;
	setBoxParameterValue?: (actionSlug: string, boxKey: string, value: number) => void;
};

export const ActionRowComponent: React.FC<ActionRowComponentProps> = ({
	characterId,
	actionRow,
	setBoxParameterValue,
}) => {
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
						{actionRow.traits.map(trait => {
							const className = Object.hasOwn(ARCANE_SCHOOLS, trait) ? 'school' : 'trait';
							return (
								<span key={trait} className={className}>
									<a href={`/wiki/${slugify(trait)}`} target='_blank' rel='noreferrer'>
										{trait}
									</a>
								</span>
							);
						})}
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
				} else if (data instanceof ActionRowVariableBox) {
					if (!setBoxParameterValue) {
						throw new Error('setBoxParameterValue is required for ActionRowVariableBox');
					}
					return (
						<VariableParameter
							key={key}
							box={box}
							data={data}
							setBoxParameterValue={value => setBoxParameterValue(actionRow.slug, box.key, value)}
						/>
					);
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

interface VariableParameterProps {
	box: ActionRowBox;
	data: ActionRowVariableBox;
	setBoxParameterValue: (value: number) => void;
}

const VariableParameter: React.FC<VariableParameterProps> = ({ box, data, setBoxParameterValue }) => {
	return (
		<ParameterBoxComponent title={box.labels.join('\n')} tooltip={box.tooltip}>
			<div style={{ display: 'flex', gap: '4px' }}>
				<LabeledInput
					variant='inline'
					value={`${data.inputValue}`}
					onBlur={value => {
						const parsedValue = (() => {
							const parsedValue = parseInt(value);
							if (isNaN(parsedValue) || parsedValue < 0) {
								return 1;
							}
							return parsedValue;
						})();
						setBoxParameterValue(parsedValue);
					}}
				/>
				<span> = {data.value.description}</span>
			</div>
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
