import { DerivedStatType, FeatType, Resource, RESOURCES } from '@shattered-wilds/commons';
import React, { useMemo } from 'react';
import { FaArrowLeft, FaBatteryFull, FaCog, FaCopy, FaExclamationTriangle, FaMinus, FaPlus } from 'react-icons/fa';

import { useStore } from '../store';
import { Character, CharacterSheet, CurrentResources } from '../types';
import { FeatsSection } from '../types/feats-section';

import { ActionsSection } from './ActionsSection';
import { EquipmentSection } from './EquipmentSection';
import Block from './shared/Block';
import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';
import { RichText } from './shared/RichText';
import { StatTreeGridComponent } from './stat-tree/StatTreeGridComponent';

interface FullPageCharacterSheetProps {
	characterId: string;
	onBack: () => void;
}

export const FullPageCharacterSheet: React.FC<FullPageCharacterSheetProps> = ({ characterId, onBack }) => {
	const characters = useStore(state => state.characters);
	const character = useMemo(() => characters.find(c => c.id === characterId), [characters, characterId]);
	if (!character) {
		return <div>Character {characterId} not found</div>;
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

	const addWindow = useStore(state => state.addWindow);
	const windows = useStore(state => state.windows);

	// Create a reactive sheet that updates when character props change
	const sheet = useMemo(() => CharacterSheet.from(character.props), [character]);
	const statTree = useMemo(() => sheet.getStatTree(), [sheet]);
	const movement = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Movement), [statTree]);
	const initiative = useMemo(() => statTree.computeDerivedStat(DerivedStatType.Initiative), [statTree]);

	// Show error message if character not found
	if (!character || !sheet) {
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
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							backgroundColor: 'var(--background-alt)',
							maxWidth: '500px',
						}}
					>
						<FaExclamationTriangle size={48} style={{ color: 'orange', marginBottom: '1rem' }} />
						<h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Character Not Found</h2>
						<p style={{ marginBottom: '2rem', color: 'var(--text)' }}>
							The character you&apos;re looking for could not be found. It may have been deleted or the link is
							incorrect.
						</p>
						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
							<Button onClick={onBack} icon={FaArrowLeft} title='Back to Character List' />
							<Button onClick={() => (window.location.hash = '#/')} icon={FaArrowLeft} title='Back to Simulator' />
						</div>
					</div>
				</main>
			</div>
		);
	}

	const handlePointChange = (resource: Resource, delta: number) => {
		const newValue = sheet.updateResource(resource, delta);
		updateCharacterProp(character, resource, newValue.toString());
	};

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

	const handleOpenRaceSetup = () => {
		// Check if a race setup window is already open for this character
		const raceSetupWindow = windows.find(w => w.type === 'race-setup' && w.characterId === character.id);

		// If not, open a new race setup window
		if (!raceSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}&apos;s Race Setup`,
				type: 'race-setup',
				characterId: character.id,
				position: { x: 100, y: 100 }, // Default position for full page context
				width: '500px',
			});
		}
	};

	const handleOpenClassSetup = () => {
		// Check if a class setup window is already open for this character
		const classSetupWindow = windows.find(w => w.type === 'class-setup' && w.characterId === character.id);

		// If not, open a new class setup window
		if (!classSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}&apos;s Class Setup`,
				type: 'class-setup',
				characterId: character.id,
				position: { x: 100, y: 100 }, // Default position for full page context
				width: '700px',
			});
		}
	};

	const handleOpenFeatsSetup = () => {
		// Check if a feats setup window is already open for this character
		const featsSetupWindow = windows.find(w => w.type === 'feats-setup' && w.characterId === character.id);

		// If not, open a new feats setup window
		if (!featsSetupWindow) {
			addWindow({
				id: window.crypto.randomUUID(),
				title: `${character.props.name}&apos;s Feats`,
				type: 'feats-setup',
				characterId: character.id,
				position: { x: 100, y: 100 }, // Default position for full page context
				width: '700px',
			});
		}
	};

	const renderFeatsSection = () => {
		const section = FeatsSection.create(sheet);

		const wrap = (children: React.ReactNode) => {
			return (
				<Block>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Feats</h3>
						{editMode && <Button onClick={handleOpenFeatsSetup} title='Manage Feats' icon={FaCog} />}
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
								const key = featOrSlot.slot?.toProp() ?? featOrSlot.info?.feat.key;
								const feat = featOrSlot.info?.feat;
								const description = feat?.description;

								const type = feat?.type || featOrSlot.slot?.type;
								const isCore = type === FeatType.Core;

								return (
									<div
										key={key}
										style={{
											padding: '0.75rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: isCore ? 'var(--background)' : 'var(--background-alt)',
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'start',
												marginBottom: '0.25rem',
											}}
										>
											<div
												style={{
													fontWeight: 'bold',
													fontSize: '0.9rem',
													color: 'var(--text)',
												}}
											>
												{feat?.name ?? `Empty ${featOrSlot.slot?.name}`}
											</div>
											<div
												style={{
													fontSize: '0.7rem',
													color: 'var(--text-secondary)',
													textTransform: 'capitalize',
												}}
											>
												{type}
											</div>
										</div>
										{description && (
											<div
												style={{
													fontSize: '0.8rem',
													color: 'var(--text-secondary)',
													lineHeight: '1.3',
												}}
											>
												<RichText>{description}</RichText>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				))}
			</>,
		);
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
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
					}}
				>
					<Block>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '2fr 1fr 1fr',
								gap: '1rem',
								alignItems: 'end',
								marginBottom: '1rem',
							}}
						>
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
								onClick={editMode ? handleOpenRaceSetup : undefined}
							/>
							<LabeledInput
								label='Class'
								value={sheet.characterClass.characterClass}
								disabled={!editMode}
								onClick={editMode ? handleOpenClassSetup : undefined}
							/>
						</div>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '80px 100px 80px repeat(auto-fit, minmax(80px, 1fr))',
								gap: '1rem',
								marginBottom: '1rem',
							}}
						>
							{/* Derived Stats */}
							<LabeledInput label='Size' value={sheet.size} disabled={true} tooltip={sheet.size} />
							<LabeledInput
								label='Movement'
								value={movement.value.toString()}
								disabled={true}
								tooltip={movement.tooltip}
							/>
							<LabeledInput
								label='Initiative'
								value={initiative.value.toString()}
								disabled={true}
								tooltip={initiative.tooltip}
							/>

							{/* Resource Points */}
							{Object.values(Resource).map(resource => {
								const { max, current } = sheet.getResource(resource);
								const { name } = RESOURCES[resource];

								return (
									<LabeledInput
										key={resource}
										label={name}
										value={`${current}/${max}`}
										disabled={true}
										prefix={
											<Button
												onClick={() => handlePointChange(resource, -1)}
												icon={FaMinus}
												tooltip={`Decrease ${resource}`}
												type='inline'
											/>
										}
										suffix={
											<Button
												onClick={() => handlePointChange(resource, 1)}
												icon={FaPlus}
												tooltip={`Increase ${resource}`}
												type='inline'
											/>
										}
									/>
								);
							})}

							<div style={{ display: 'flex', alignItems: 'end', marginBottom: '0.75rem' }}>
								<Button onClick={handleRefillPoints} icon={FaBatteryFull} title='Refill All' />
							</div>
						</div>
					</Block>

					<Block>
						<StatTreeGridComponent
							tree={sheet.getStatTree()}
							onUpdateCharacterProp={(key: string, value: string) => updateCharacterProp(character, key, value)}
							disabled={!editMode}
							characterId={character.id}
						/>
					</Block>

					{renderFeatsSection()}
					<EquipmentSection
						character={character}
						onUpdateEquipment={equipment => updateCharacterProp(character, 'equipment', equipment.toProp())}
						editMode={editMode}
					/>
					<ActionsSection character={character} />
				</div>
			</main>
		</div>
	);
};
