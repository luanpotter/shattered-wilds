import {
	CharacterSheet,
	CircumstancesSection,
	Condition,
	CONDITIONS,
	firstParagraph,
	Resource,
	RESOURCES,
} from '@shattered-wilds/commons';
import React, { JSX } from 'react';
import { FaCoffee, FaMinus, FaMoon, FaPlus } from 'react-icons/fa';

import { usePropUpdates } from '../../hooks/usePropUpdates';
import { useStore } from '../../store';
import { CardSection } from '../circumstances/CardSection';
import { RemovableCard } from '../circumstances/RemovableCard';
import { ResourceBar } from '../circumstances/ResourceBar';
import { ResourceDiamonds } from '../circumstances/ResourceDiamonds';
import Block from '../shared/Block';
import { Button } from '../shared/Button';

export const CircumstancesSectionComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const characterSheet = CharacterSheet.from(character.props);
	const circumstancesSection = CircumstancesSection.create({ characterSheet });

	const { updateResource, updateExhaustion, addCondition, removeCondition } = usePropUpdates(character, characterSheet);

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
					onIncrement={() => updateResource(resource, 1)}
					onDecrement={() => updateResource(resource, -1)}
				/>
			</div>,
		];
	};

	const resourceDiamonds = (resource: Resource): JSX.Element[] => {
		const def = RESOURCES[resource];
		const label = def.fullName;
		const value = circumstancesSection.resources[resource];
		return [
			<ResourceDiamonds
				key={`${resource}-diamonds`}
				count={value.current}
				total={value.max}
				onToggle={index => {
					const isIndexActive = index < value.current;
					const newIndex = isIndexActive ? index : index + 1;
					const delta = newIndex - value.current;
					updateResource(resource, delta);
				}}
			/>,
			<div key={`${resource}-buttons`} style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
				<Button
					variant='inline'
					onClick={() => updateResource(resource, -1)}
					icon={FaMinus}
					tooltip={`Decrease ${label}`}
				/>
				<Button
					variant='inline'
					onClick={() => updateResource(resource, 1)}
					icon={FaPlus}
					tooltip={`Increase ${label}`}
				/>
			</div>,
		];
	};

	const exhaustion = () => {
		const { rank, cmText } = circumstancesSection.exhaustion;
		return (
			<div style={{ height: '100%' }}>
				<RemovableCard title='Exhaustion' tooltip='Longer term form of tiredness and fatigue'>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
						<div>Rank: {rank}</div>
						<div style={{ display: 'flex', gap: '4px' }}>
							<Button
								variant='inline'
								onClick={() => updateExhaustion(-1)}
								icon={FaMinus}
								tooltip={`Decrease Exhaustion`}
							/>
							<Button
								variant='inline'
								onClick={() => updateExhaustion(1)}
								icon={FaPlus}
								tooltip={`Increase Exhaustion`}
							/>
						</div>
						<div title='The Exhaustion Circumstance Modifier is applied to all Checks'>{cmText}</div>
					</div>
				</RemovableCard>
			</div>
		);
	};

	const handleShortRest = () => {
		console.log('Short rest');
	};

	const handleLongRest = () => {
		console.log('Long rest');
	};

	const handleAddCondition = () => {
		// TODO: open a modal to select condition
		const randomCondition = Math.floor(Math.random() * Object.keys(Condition).length);
		addCondition(Object.values(Condition)[randomCondition]);
	};

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
				<h3 style={{ margin: 0, fontSize: '1.1em' }}>Circumstances</h3>
			</div>
			<div
				style={{
					display: 'grid',
					gridTemplateRows: '1fr 8px repeat(3, 1fr)',
					gridTemplateColumns: 'minmax(100px, auto) 1fr 200px',
					gap: '0 8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>Heroism</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						gridColumn: 'span 2',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'bottom' }}>{...resourceDiamonds(Resource.HeroismPoint)}</div>
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button variant='normal' title='Short Rest' icon={FaCoffee} onClick={handleShortRest} />
						<Button variant='normal' title='Long Rest' icon={FaMoon} onClick={handleLongRest} />
					</div>
				</div>
				<div style={{ gridColumn: 'span 3' }} />
				{...resourceBar(Resource.VitalityPoint)}
				<div style={{ gridRow: 'span 3' }}>{exhaustion()}</div>
				{...resourceBar(Resource.FocusPoint)}
				{...resourceBar(Resource.SpiritPoint)}
			</div>
			<hr />
			<CardSection
				title='Conditions'
				cards={circumstancesSection.conditions.map(c => {
					const def = CONDITIONS[c];
					return { key: c, title: def.name, tooltip: def.description, description: firstParagraph(def.description) };
				})}
				onAdd={handleAddCondition}
				onRemove={key => removeCondition(key as Condition)}
			/>
			<hr />
			<div>TODO: Consequences</div>
			<hr />
			<div style={{ marginBottom: '8px' }}>
				<h4 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>Other Circumstances</h4>
				<textarea
					style={{
						width: '100%',
						minHeight: '80px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						padding: '8px',
						fontSize: '0.9em',
						boxSizing: 'border-box',
						resize: 'vertical',
					}}
					placeholder='Enter miscellaneous circumstances...'
				/>
			</div>
		</Block>
	);
};
