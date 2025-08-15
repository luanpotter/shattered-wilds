import { CharacterSheet } from '@shattered-wilds/commons';
import React from 'react';
import { FaCog, FaExclamationTriangle } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { FeatsSection } from '../types/feats-section';

import { FeatBox } from './FeatBox';
import Block from './shared/Block';
import { Button } from './shared/Button';

export const FeatsSectionComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
	const { openFeatsSetupModal } = useModals();
	const editMode = useStore(state => state.editMode);

	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);
	const section = FeatsSection.create(sheet);

	const wrap = (children: React.ReactNode) => {
		return (
			<Block>
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Feats</h3>
					{editMode && (
						<Button onClick={() => openFeatsSetupModal({ characterId })} title='Manage Feats' icon={FaCog} />
					)}
				</div>
				{children}
			</Block>
		);
	};

	if (section.isEmpty) {
		return wrap(
			<>
				<p>No feats assigned yet.</p>
				{editMode && <p style={{ fontSize: '0.9em' }}>Click &quot;Manage Feats&quot; above to assign feats.</p>}
			</>,
		);
	}

	const { warnings } = section;
	return wrap(
		<>
			{warnings.length > 0 && (
				<div
					style={{
						padding: '1rem',
						backgroundColor: 'var(--background)',
						border: '1px solid orange',
						borderRadius: '4px',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<FaExclamationTriangle style={{ color: 'orange' }} />
					<span style={{ color: 'var(--text)' }}>{warnings.length} warnings</span>
				</div>
			)}

			{section.featsOrSlotsByLevel.map(({ level, featsOrSlots }) => (
				<div key={level}>
					<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text)' }}>Level {level}</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '0.5rem',
						}}
					>
						{featsOrSlots.map(featOrSlot => {
							return (
								<FeatBox
									key={featOrSlot.slot?.toProp() ?? featOrSlot.info?.feat.key}
									featOrSlot={featOrSlot}
									character={character}
								/>
							);
						})}
					</div>
				</div>
			))}
		</>,
	);
};
