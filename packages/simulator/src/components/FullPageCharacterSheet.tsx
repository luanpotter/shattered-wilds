import { Check, CheckMode, CheckNature, DerivedStatType, Resource } from '@shattered-wilds/commons';
import React, { useMemo } from 'react';
import { FaArrowLeft, FaBatteryFull, FaCopy } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character, CharacterSheet, CurrentResources } from '../types';

import { ActionsSection } from './ActionsSection';
import { EquipmentSection } from './EquipmentSection';
import { FeatsSectionComponent } from './FeatsSectionComponent';
import { ResourceInputComponent } from './ResourceInputComponent';
import Block from './shared/Block';
import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';
import { StatTreeGridComponent } from './stat-tree/StatTreeGridComponent';

interface FullPageCharacterSheetProps {
	characterId: string;
	onBack: () => void;
}

export const FullPageCharacterSheet: React.FC<FullPageCharacterSheetProps> = ({ characterId, onBack }) => {
	const characters = useStore(state => state.characters);
	const character = useMemo(() => characters.find(c => c.id === characterId), [characters, characterId]);
	if (!character) {
		return (
			<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
				<main
					style={{
						flex: 1,
						padding: '2rem',
						paddingBottom: '3rem',
						overflow: 'auto',
						maxWidth: '1400px',
						margin: '0 auto',
						width: '100%',
						boxSizing: 'border-box',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '1rem',
							color: 'var(--error-color)',
						}}
					>
						Character {characterId} not found.
						<Button onClick={onBack} icon={FaArrowLeft} title='Back to List' />
					</div>
				</main>
			</div>
		);
	}

	return <FullPageCharacterSheetContent character={character} onBack={onBack} />;
};

const FullPageCharacterSheetContent: React.FC<{ character: Character; onBack: () => void }> = ({
	character,
	onBack,
}) => {
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const editMode = useStore(state => state.editMode);

	const { openDiceRollModal, openRaceSetupModal, openClassSetupModal } = useModals();

	const characterId = character.id;
	const sheet = CharacterSheet.from(character.props);

	const statTree = sheet.getStatTree();
	const movement = statTree.getModifier(DerivedStatType.Movement);
	const initiative = statTree.getModifier(DerivedStatType.Initiative);
	const influenceRange = statTree.getModifier(DerivedStatType.InfluenceRange);

	const handleRefillPoints = () => {
		Object.values(Resource).forEach(resource => {
			updateCharacterProp(character, resource, CurrentResources.MAX_VALUE.toString());
		});
	};

	const handleCopyCharacterSheet = () => {
		const keyValuePairs = Object.entries(character.props)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
		void window.navigator.clipboard.writeText(keyValuePairs);
	};

	const Row = ({ children }: { children: React.ReactNode }) => {
		return <div style={{ display: 'flex' }}>{children}</div>;
	};

	const Column = ({ children }: { children: React.ReactNode }) => {
		return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>;
	};

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<main
				style={{
					flex: 1,
					padding: '2rem',
					paddingBottom: '3rem',
					overflow: 'auto',
					maxWidth: '1400px',
					margin: '0 auto',
					width: '100%',
					boxSizing: 'border-box',
				}}
			>
				{/* Header Content */}
				<div
					style={{
						marginBottom: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '1rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
						<Button onClick={() => (window.location.hash = '#/')} icon={FaArrowLeft} title='Back to Simulator' />
						<Button onClick={onBack} icon={FaArrowLeft} title='Back to List' />
						<h2 style={{ margin: 0, fontSize: '1.5rem' }}>{character.props.name}&apos;s Character Sheet</h2>
					</div>
					<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
						<Button onClick={handleCopyCharacterSheet} icon={FaCopy} title='Export' />
					</div>
				</div>
				<Column>
					<Block>
						<Row>
							<LabeledInput
								label='Name'
								value={character.props.name}
								onChange={value => updateCharacterName(character, value)}
								disabled={!editMode}
							/>
							<LabeledInput
								label='Race'
								value={sheet.race.toString()}
								disabled={!editMode}
								onClick={() => openRaceSetupModal({ characterId })}
							/>
							<LabeledInput
								label='Class'
								value={sheet.characterClass.characterClass}
								disabled={!editMode}
								onClick={() => openClassSetupModal({ characterId })}
							/>
						</Row>
						<Row>
							{/* Derived Stats */}
							<LabeledInput label='Size' value={sheet.size} disabled={true} tooltip={sheet.size} />
							<LabeledInput
								label='Movement'
								value={movement.value.description}
								tooltip={movement.description}
								disabled={true}
							/>
							<LabeledInput
								label='Initiative'
								value={initiative.value.description}
								tooltip={initiative.description}
								disabled={true}
								onClick={() => {
									openDiceRollModal({
										characterId,
										check: new Check({
											mode: CheckMode.Contested,
											nature: CheckNature.Resisted,
											statModifier: initiative,
										}),
										title: `Roll Initiative Check`,
									});
								}}
							/>
							<LabeledInput
								label='Influence Range'
								value={influenceRange.value.description}
								tooltip={influenceRange.description}
								disabled={true}
							/>
						</Row>

						{/* Resource Points */}
						<Row>
							{Object.values(Resource).map(resource => (
								<ResourceInputComponent
									variant='normal'
									key={resource}
									character={character}
									sheet={sheet}
									resource={resource}
								/>
							))}

							<div style={{ display: 'flex', alignItems: 'end', marginBottom: '0.75rem' }}>
								<Button onClick={handleRefillPoints} icon={FaBatteryFull} title='Refill All' />
							</div>
						</Row>
					</Block>

					<Block>
						<StatTreeGridComponent
							tree={sheet.getStatTree()}
							onUpdateCharacterProp={(key: string, value: string) => updateCharacterProp(character, key, value)}
							disabled={!editMode}
							characterId={characterId}
						/>
					</Block>

					<FeatsSectionComponent character={character} />
					<EquipmentSection character={character} />
					<ActionsSection character={character} />
				</Column>
			</main>
		</div>
	);
};
