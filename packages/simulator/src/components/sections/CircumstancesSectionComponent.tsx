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
} from '@shattered-wilds/commons';
import React, { JSX } from 'react';
import { FaCoffee, FaHourglassEnd, FaMinus, FaMoon, FaPlus } from 'react-icons/fa';

import { usePropUpdates } from '../../hooks/usePropUpdates';
import { useStore } from '../../store';
import { CardSection } from '../circumstances/CardSection';
import { ResourceBar } from '../circumstances/ResourceBar';
import { ResourceDiamonds } from '../circumstances/ResourceDiamonds';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';

export const CircumstancesSectionComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const characterSheet = CharacterSheet.from(character.props);
	const circumstancesSection = CircumstancesSection.create({ characterSheet });

	const { updateResource, addCondition, removeCondition, addConsequence, removeConsequence } = usePropUpdates(
		character,
		characterSheet,
	);

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

	const cards = ({
		label,
		items,
		handleAdd,
		removeItem,
	}: {
		label: string;
		items: { key: string; name: string; ranked: boolean; description: string; rank: number }[];
		handleAdd: () => void;
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
						children: (
							<div style={{ textAlign: 'justify' }}>
								<RichText>{firstParagraph(item.description)}</RichText>
								{item.ranked && (
									<>
										<hr />
										<div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '0.9em' }}>
											Current Rank: {item.rank}
										</div>
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

	const handleEndTurn = () => {
		console.log('End turn');
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
		const rank = Math.floor(Math.random() * 3);
		addCondition({ name: Object.values(Condition)[randomCondition], rank });
	};

	const handleAddConsequence = () => {
		// TODO: open a modal to select consequence
		const randomConsequence = Math.floor(Math.random() * Object.keys(Consequence).length);
		const rank = Math.floor(Math.random() * 3);
		addConsequence({ name: Object.values(Consequence)[randomConsequence], rank });
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
					gridTemplateColumns: 'minmax(100px, auto) 1fr auto',
					gap: '8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>Heroism</div>
				<div style={{ display: 'flex', alignItems: 'bottom' }}>{...resourceDiamonds(Resource.HeroismPoint)}</div>
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
				removeItem: key => removeCondition(key as Condition),
			})}
			<hr />
			{cards({
				label: 'Consequences',
				items: circumstancesSection.consequences.map(c => {
					const def = CONSEQUENCES[c.consequence];
					return { key: def.name, rank: c.rank, ...def };
				}),
				handleAdd: handleAddConsequence,
				removeItem: key => removeConsequence(key as Consequence),
			})}
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
