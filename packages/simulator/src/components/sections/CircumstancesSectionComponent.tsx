import {
	CharacterSheet,
	CircumstancesSection,
	Condition,
	CONDITIONS,
	Consequence,
	CONSEQUENCES,
	firstParagraph,
	Resource,
	RESOURCES,
	slugify,
} from '@shattered-wilds/commons';
import React, { JSX, useState } from 'react';
import { FaCoffee, FaHourglassEnd, FaMinus, FaMoon, FaPlus, FaTrash } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { usePropUpdates } from '../../hooks/usePropUpdates';
import { useStore } from '../../store';
import { CardSection } from '../circumstances/CardSection';
import { ResourceBar } from '../circumstances/ResourceBar';
import { ResourceDiamonds } from '../circumstances/ResourceDiamonds';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';

export const CircumstancesSectionComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const characterSheet = CharacterSheet.from(character.props);
	const circumstancesSection = CircumstancesSection.create({ characterSheet });
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const [newOtherCircumstance, setNewOtherCircumstance] = useState('');

	const propUpdater = usePropUpdates(character, characterSheet);
	const { openAddConditionModal, openAddConsequenceModal, openConfirmationModal } = useModals();

	const resourceBar = (resource: Resource): JSX.Element[] => {
		const def = RESOURCES[resource];
		const value = circumstancesSection.resources[resource];
		return [
			<div key={`${resource}-name`} style={{ display: 'flex', alignItems: 'flex-end' }}>
				{def.shortName}
			</div>,
			<div key={`${resource}-bar`} style={{ display: 'flex', alignItems: 'flex-end' }}>
				<ResourceBar
					label={def.fullName}
					current={value.current}
					max={value.max}
					color={def.color}
					onIncrement={() => propUpdater.updateResourceByDelta(resource, 1)}
					onDecrement={() => propUpdater.updateResourceByDelta(resource, -1)}
				/>
			</div>,
		];
	};

	const resourceDiamonds = (resource: Resource): JSX.Element[] => {
		const def = RESOURCES[resource];
		const label = def.fullName;
		const value = circumstancesSection.resources[resource];
		if (value.max === 0) {
			return [
				<div key={`${resource}-name`} style={{ textEmphasis: 'italics' }}>
					No {label}
				</div>,
			];
		}
		return [
			<ResourceDiamonds
				key={`${resource}-diamonds`}
				count={value.current}
				total={value.max}
				color={def.color}
				onToggle={index => {
					const isIndexActive = index < value.current;
					const newIndex = isIndexActive ? index : index + 1;
					propUpdater.updateResourceToValue(resource, newIndex);
				}}
			/>,
			<div key={`${resource}-buttons`} style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
				<Button
					variant='inline'
					onClick={() => propUpdater.updateResourceByDelta(resource, -1)}
					icon={FaMinus}
					tooltip={`Decrease ${label}`}
				/>
				<Button
					variant='inline'
					onClick={() => propUpdater.updateResourceByDelta(resource, 1)}
					icon={FaPlus}
					tooltip={`Increase ${label}`}
				/>
			</div>,
		];
	};

	const cards = ({
		label,
		items,
		handleAdd,
		addItem,
		removeItem,
	}: {
		label: string;
		items: {
			key: string;
			name: string;
			ranked: boolean;
			description: string;
			rank: number;
			descriptionForRank?: ((rank: number) => string) | undefined;
		}[];
		handleAdd: () => void;
		addItem: (key: string, rank: number) => void;
		removeItem: (key: string) => void;
	}) => {
		return (
			<CardSection
				title={label}
				cards={items.map(item => {
					return {
						key: item.key,
						title: `${item.name}${item.ranked ? ` (${item.rank})` : ''}`,
						tooltip: item.description,
						href: `/wiki/${slugify(item.name)}`,
						children: (
							<div style={{ textAlign: 'justify' }}>
								<RichText>{firstParagraph(item.description)}</RichText>
								{item.ranked && (
									<>
										<hr />
										<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
											<Button
												variant='inline'
												icon={FaMinus}
												tooltip='Decrease Rank'
												onClick={() => {
													if (item.rank <= 1) {
														removeItem(item.key);
													} else {
														addItem(item.key, item.rank - 1);
													}
												}}
											/>
											Current Rank: {item.rank}
											<Button
												variant='inline'
												icon={FaPlus}
												tooltip='Increase Rank'
												onClick={() => addItem(item.key, item.rank + 1)}
											/>
										</div>
										{item.descriptionForRank && (
											<div style={{ marginTop: '8px', fontStyle: 'italic', textAlign: 'center' }}>
												{item.descriptionForRank(item.rank)}
											</div>
										)}
									</>
								)}
							</div>
						),
					};
				})}
				onAdd={handleAdd}
				onRemove={removeItem}
			/>
		);
	};

	const healAttributePoints = () => {
		[Resource.VitalityPoint, Resource.FocusPoint, Resource.SpiritPoint].forEach(resource =>
			propUpdater.updateResourceToMax(resource),
		);
	};

	const endTurn = () => {
		propUpdater.updateResourceToMax(Resource.ActionPoint);
	};

	const shortRest = () => {
		propUpdater.removeAllConditions();
		healAttributePoints();
		propUpdater.addToConsequenceRank(Consequence.Exhaustion, 1);
	};

	const longRest = () => {
		propUpdater.removeAllConditions();
		healAttributePoints();
		propUpdater.addToConsequenceRank(Consequence.Exhaustion, -3);
		propUpdater.updateResourceByDelta(Resource.HeroismPoint, 1);
	};

	const handleEndTurn = async () => {
		const confirmed = await openConfirmationModal({
			title: 'End Turn',
			message: [
				'Are you sure you want to trigger an **End of Turn**?',
				'That will restore all your [[Action Points]].',
			].join('\n\n'),
			confirmText: 'End Turn',
		});
		if (confirmed) {
			endTurn();
		}
	};

	const handleShortRest = async () => {
		const confirmed = await openConfirmationModal({
			title: 'Short Rest',
			message: [
				'Are you sure you want to trigger a **Short Rest**?',
				'That will:',
				'- Restore all your [[Vitality Points]], [[Focus Points]], and [[Spirit Points]].',
				'- Clear all conditions',
				'- Add 1 rank of [[Exhaustion]]',
			].join('\n\n'),
			confirmText: 'Take Short Rest',
		});
		if (confirmed) {
			shortRest();
		}
	};

	const handleLongRest = async () => {
		const confirmed = await openConfirmationModal({
			title: 'Long Rest',
			message: [
				'Are you sure you want to trigger a Long Rest?',
				'That will:',
				'- Restore all your [[Vitality Points]], [[Focus Points]], and [[Spirit Points]].',
				'- Clear all conditions',
				'- Remove up to 3 ranks of [[Exhaustion]]',
				'- Regain 1 [[Heroism Point]] (if not at max)',
			].join('\n\n'),
			confirmText: 'Take Long Rest',
		});
		if (confirmed) {
			longRest();
		}
	};

	const handleAddCondition = () => {
		openAddConditionModal({
			characterId,
			onConfirm: (condition, rank) => {
				propUpdater.addCondition({ name: condition, rank });
			},
		});
	};

	const handleAddConsequence = () => {
		openAddConsequenceModal({
			characterId,
			onConfirm: (consequence, rank) => {
				propUpdater.addConsequence({ name: consequence, rank });
			},
		});
	};

	const serializeOtherCircumstances = (circumstances: string[]) => {
		updateCharacterProp(character, 'otherCircumstances', circumstances.join('\n'));
	};

	const handleAddOtherCircumstance = () => {
		if (newOtherCircumstance.trim()) {
			const newCircumstances = [...circumstancesSection.otherCircumstances, newOtherCircumstance.trim()];
			serializeOtherCircumstances(newCircumstances);
			setNewOtherCircumstance('');
		}
	};

	const handleUpdateOtherCircumstance = (index: number, value: string) => {
		const newCircumstances = [...circumstancesSection.otherCircumstances];
		newCircumstances[index] = value;
		serializeOtherCircumstances(newCircumstances);
	};

	const handleRemoveOtherCircumstance = (index: number) => {
		const newCircumstances = circumstancesSection.otherCircumstances.filter((_, i) => i !== index);
		serializeOtherCircumstances(newCircumstances);
	};

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
				<h3 style={{ margin: 0, fontSize: '1.1em' }}>Circumstances</h3>
			</div>
			<h4 style={{ margin: '0 0 8px 0' }}>Resource Points</h4>
			<div
				style={{
					display: 'grid',
					gridTemplateRows: '1fr 8px repeat(3, 1fr)',
					gridTemplateColumns: 'minmax(100px, auto) 1fr auto',
					gap: '8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>Heroism</div>
				<div style={{ display: 'flex', alignItems: 'bottom', justifyContent: 'space-between' }}>
					<div style={{ display: 'flex', alignItems: 'bottom' }}>{...resourceDiamonds(Resource.HeroismPoint)}</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div>Action</div>
						{...resourceDiamonds(Resource.ActionPoint)}
					</div>
				</div>
				<div
					style={{
						gridRow: 'span 5',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						paddingLeft: '12px',
						borderLeft: '1px solid var(--text)',
						justifyContent: 'flex-end',
					}}
				>
					<Button variant='normal' title='End Turn' icon={FaHourglassEnd} onClick={handleEndTurn} />
					<Button variant='normal' title='Short Rest' icon={FaCoffee} onClick={handleShortRest} />
					<Button variant='normal' title='Long Rest' icon={FaMoon} onClick={handleLongRest} />
				</div>
				<div style={{ gridColumn: 'span 2' }} />
				{...resourceBar(Resource.VitalityPoint)}
				{...resourceBar(Resource.FocusPoint)}
				{...resourceBar(Resource.SpiritPoint)}
			</div>
			<hr />
			{cards({
				label: 'Conditions',
				items: circumstancesSection.conditions.map(c => {
					const def = CONDITIONS[c.condition];
					return { key: def.name, rank: c.rank, ...def };
				}),
				handleAdd: handleAddCondition,
				addItem: (key, rank) => propUpdater.addCondition({ name: key as Condition, rank }),
				removeItem: key => propUpdater.removeCondition(key as Condition),
			})}
			<hr />
			{cards({
				label: 'Consequences',
				items: circumstancesSection.consequences.map(c => {
					const def = CONSEQUENCES[c.consequence];
					return { key: def.name, rank: c.rank, ...def };
				}),
				handleAdd: handleAddConsequence,
				addItem: (key, rank) => propUpdater.addConsequence({ name: key as Consequence, rank }),
				removeItem: key => propUpdater.removeConsequence(key as Consequence),
			})}
			<hr />
			<div style={{ marginBottom: '8px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
					<h4 style={{ margin: 0, fontSize: '1em' }}>Other Circumstances</h4>
					<div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1, marginLeft: '12px' }}>
						<LabeledInput
							variant='inline'
							value={newOtherCircumstance}
							onChange={setNewOtherCircumstance}
							placeholder='Add new circumstance...'
						/>
						<Button
							onClick={handleAddOtherCircumstance}
							icon={FaPlus}
							tooltip='Add circumstance'
							variant='inline'
							disabled={!newOtherCircumstance.trim()}
						/>
					</div>
				</div>
				{circumstancesSection.otherCircumstances.map((circumstance, idx) => (
					<div
						key={idx}
						style={{
							display: 'flex',
							alignItems: 'center',
							marginBottom: '4px',
							gap: '4px',
							width: '100%',
						}}
					>
						<LabeledInput
							variant='inline'
							value={circumstance}
							onBlur={value => handleUpdateOtherCircumstance(idx, value)}
						/>
						<Button
							onClick={() => handleRemoveOtherCircumstance(idx)}
							icon={FaTrash}
							tooltip='Remove circumstance'
							variant='inline'
						/>
					</div>
				))}
			</div>
		</Block>
	);
};
