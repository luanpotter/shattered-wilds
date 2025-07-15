import React, { useMemo } from 'react';
import {
	FaArrowLeft,
	FaPlus,
	FaMinus,
	FaBatteryFull,
	FaCopy,
	FaExclamationTriangle,
	FaCog,
} from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, StatType, Size, SizeModifiers } from '../types';
import {
	getAllFeatSlots,
	FeatType,
	FEATS,
	getUpbringingModifierFeat,
	isParameterizedFeat,
	getParameterizedFeatDefinition,
} from '../types/feats';

import { AttributeTreeGridComponent } from './AttributeTreeGridComponent';
import { EquipmentSection } from './EquipmentSection';
import Block from './shared/Block';
import LabeledInput from './shared/LabeledInput';

interface FullPageCharacterSheetProps {
	characterId: string;
	onBack: () => void;
	onNavigateToCharacterSheet: (characterId: string) => void;
}

export const FullPageCharacterSheet: React.FC<FullPageCharacterSheetProps> = ({
	characterId,
	onBack,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onNavigateToCharacterSheet: _onNavigateToCharacterSheet,
}) => {
	const characters = useStore(state => state.characters);
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const editMode = useStore(state => state.editMode);

	const addWindow = useStore(state => state.addWindow);
	const windows = useStore(state => state.windows);

	// Get the current character from the store (reactive to store changes)
	const character = useMemo(
		() => characters.find(c => c.id === characterId),
		[characters, characterId]
	);

	// Create a reactive sheet that updates when character props change
	const sheet = useMemo(
		() => (character ? CharacterSheet.from(character.props) : null),
		[character]
	);

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
							The character you&apos;re looking for could not be found. It may have been deleted or
							the link is incorrect.
						</p>
						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
							<button
								onClick={onBack}
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
							>
								<FaArrowLeft /> Back to Character List
							</button>
							<button
								onClick={() => (window.location.hash = '#/')}
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
							>
								<FaArrowLeft /> Back to Simulator
							</button>
						</div>
					</div>
				</main>
			</div>
		);
	}

	const handlePointChange = (pointType: string, delta: number) => {
		const maxValue = (
			sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as any
		).value;
		const currentValue = parseInt(character.props[`current${pointType}`] ?? maxValue.toString());
		const newValue = Math.max(0, Math.min(maxValue, currentValue + delta));
		updateCharacterProp(character, `current${pointType}`, newValue.toString());
	};

	const handleRefillPoints = () => {
		const pointTypes = ['Heroism', 'Vitality', 'Focus', 'Spirit'];
		pointTypes.forEach(pointType => {
			const maxValue = (
				sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as any
			).value;
			updateCharacterProp(character, `current${pointType}`, maxValue.toString());
		});
	};

	const handleCopyCharacterSheet = () => {
		const keyValuePairs = Object.entries(character.props)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
		void window.navigator.clipboard.writeText(keyValuePairs);
	};

	const getSizeDisplay = (size: Size): string => {
		const modifier = SizeModifiers[size];
		const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
		return `${size} (${modifierStr})`;
	};

	const handleOpenRaceSetup = () => {
		// Check if a race setup window is already open for this character
		const raceSetupWindow = windows.find(
			w => w.type === 'race-setup' && w.characterId === character.id
		);

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
		const classSetupWindow = windows.find(
			w => w.type === 'class-setup' && w.characterId === character.id
		);

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
		const featsSetupWindow = windows.find(
			w => w.type === 'feats-setup' && w.characterId === character.id
		);

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

	// Get feat definition with proper handling of dynamic upbringing modifiers and parameterized feats
	const getFeatDefinition = (featId: string) => {
		if (featId.startsWith('upbringing-')) {
			return getUpbringingModifierFeat(
				sheet.race.upbringing,
				sheet.race.upbringingPlusModifier,
				sheet.race.upbringingMinusModifier
			);
		}

		// Handle parameterized feats
		if (isParameterizedFeat(featId)) {
			return getParameterizedFeatDefinition(featId);
		}

		return FEATS[featId] || null;
	};

	const renderFeatsSection = () => {
		const characterLevel = sheet.attributes.getNode(StatType.Level)?.baseValue || 1;
		const currentFeatSlots = sheet.getFeatSlots();
		const hasSpecializedTraining = Object.values(currentFeatSlots).includes('specialized-training');
		const allFeatSlots = getAllFeatSlots(characterLevel, hasSpecializedTraining);

		// Group feats by level
		const featsByLevel: Record<number, Array<{ slot: any; featId: string; isCore: boolean }>> = {};

		allFeatSlots.forEach(slot => {
			const featId = currentFeatSlots[slot.id];
			if (featId) {
				if (!featsByLevel[slot.level]) {
					featsByLevel[slot.level] = [];
				}
				featsByLevel[slot.level].push({
					slot,
					featId,
					isCore: slot.type === FeatType.Core,
				});
			}
		});

		// Count missing non-core feats
		const missingFeats = allFeatSlots.filter(
			slot => slot.type !== FeatType.Core && !currentFeatSlots[slot.id]
		);

		const wrap = (children: React.ReactNode) => {
			return (
				<Block>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Feats</h3>
						{editMode && (
							<button
								onClick={handleOpenFeatsSetup}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.5rem 1rem',
									backgroundColor: 'var(--background)',
									color: 'var(--text)',
									border: '1px solid var(--text)',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
								title='Open feats management'
							>
								<FaCog />
								Manage Feats
							</button>
						)}
					</div>
					{children}
				</Block>
			);
		};

		if (Object.keys(featsByLevel).length === 0) {
			return wrap(
				<>
					<p>No feats assigned yet.</p>
					{editMode && (
						<p style={{ fontSize: '0.9em' }}>
							Click &quot;Manage Feats&quot; above to assign feats.
						</p>
					)}
				</>
			);
		}

		return wrap(
			<>
				{missingFeats.length > 0 && (
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
						<span style={{ color: 'var(--text)' }}>
							{missingFeats.length} unassigned feat slot{missingFeats.length !== 1 ? 's' : ''}
						</span>
					</div>
				)}

				{Object.entries(featsByLevel)
					.sort(([a], [b]) => parseInt(a) - parseInt(b))
					.map(([level, feats]) => (
						<div key={level}>
							<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text)' }}>
								Level {level}
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
									gap: '0.5rem',
								}}
							>
								{feats.map((feat, index) => {
									const featDefinition = getFeatDefinition(feat.featId);
									return (
										<div
											key={index}
											style={{
												padding: '0.75rem',
												border: '1px solid var(--text)',
												borderRadius: '4px',
												backgroundColor: feat.isCore
													? 'var(--background)'
													: 'var(--background-alt)',
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
													{featDefinition?.name || feat.featId}
												</div>
												<div
													style={{
														fontSize: '0.7rem',
														color: 'var(--text-secondary)',
														textTransform: 'capitalize',
													}}
												>
													{feat.isCore ? 'Core' : feat.slot.type}
												</div>
											</div>
											{featDefinition?.description && (
												<div
													style={{
														fontSize: '0.8rem',
														color: 'var(--text-secondary)',
														lineHeight: '1.3',
													}}
												>
													{featDefinition.description}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
			</>
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
						<button onClick={() => (window.location.hash = '#/')}>
							<FaArrowLeft /> Back to Simulator
						</button>
						<button onClick={onBack}>
							<FaArrowLeft /> Back to List
						</button>
						<h2 style={{ margin: 0, fontSize: '1.5rem' }}>
							{character.props.name}&apos;s Character Sheet
						</h2>
					</div>
					<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
						<button onClick={handleCopyCharacterSheet} title='Copy character data to clipboard'>
							<FaCopy /> Export
						</button>
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
								id='character-name'
								label='Name'
								value={character.props.name}
								onChange={value => updateCharacterName(character, value)}
								editMode={editMode}
							/>
							<LabeledInput
								id='character-race'
								label='Race'
								value={sheet.race.toString()}
								editMode={editMode}
								onClick={editMode ? handleOpenRaceSetup : undefined}
								onKeyDown={
									editMode
										? e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													handleOpenRaceSetup();
												}
											}
										: undefined
								}
								tabIndex={editMode ? 0 : -1}
								role={editMode ? 'button' : undefined}
							/>
							<LabeledInput
								id='character-class'
								label='Class'
								value={sheet.characterClass.characterClass}
								editMode={editMode}
								onClick={editMode ? handleOpenClassSetup : undefined}
								onKeyDown={
									editMode
										? e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													handleOpenClassSetup();
												}
											}
										: undefined
								}
								tabIndex={editMode ? 0 : -1}
								role={editMode ? 'button' : undefined}
							/>
						</div>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
								gap: '1rem',
								marginBottom: '1rem',
							}}
						>
							{/* Derived Stats */}
							<LabeledInput
								id='character-size'
								label='Size'
								value={getSizeDisplay(sheet.derivedStats.size.value)}
								editMode={false}
								title={sheet.derivedStats.size.description}
							/>
							<LabeledInput
								id='character-movement'
								label='Movement'
								value={sheet.derivedStats.movement.value.toString()}
								editMode={false}
								title={sheet.derivedStats.movement.description}
							/>
							<LabeledInput
								id='character-initiative'
								label='Initiative'
								value={sheet.derivedStats.initiative.value.toString()}
								editMode={false}
								title={sheet.derivedStats.initiative.description}
							/>

							{/* Resource Points */}
							{['Heroism', 'Vitality', 'Focus', 'Spirit'].map(pointType => {
								const maxValue = (
									sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as any
								).value;
								const currentValue =
									sheet.currentValues[`current${pointType}` as keyof typeof sheet.currentValues];

								return (
									<div key={pointType}>
										<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
											{pointType}
										</span>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<button
												onClick={() => handlePointChange(pointType, -1)}
												style={{
													padding: '0.25rem 0.5rem',
													backgroundColor: 'var(--background)',
													border: '1px solid var(--text)',
													borderRadius: '4px',
													cursor: 'pointer',
												}}
											>
												<FaMinus size={12} />
											</button>
											<div
												style={{
													flex: 1,
													padding: '0.5rem',
													border: '1px solid var(--text)',
													borderRadius: '4px',
													backgroundColor: 'var(--background)',
													textAlign: 'center',
													fontSize: '1.1rem',
													fontWeight: 'bold',
												}}
											>
												{currentValue}/{maxValue}
											</div>
											<button
												onClick={() => handlePointChange(pointType, 1)}
												style={{
													padding: '0.25rem 0.5rem',
													backgroundColor: 'var(--background)',
													border: '1px solid var(--text)',
													borderRadius: '4px',
													cursor: 'pointer',
												}}
											>
												<FaPlus size={12} />
											</button>
										</div>
									</div>
								);
							})}

							<div style={{ display: 'flex', alignItems: 'end' }}>
								<button
									onClick={handleRefillPoints}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										backgroundColor: 'var(--success)',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										height: 'fit-content',
									}}
									title='Refill all points to maximum'
								>
									<FaBatteryFull />
									Refill All
								</button>
							</div>
						</div>
					</Block>

					<Block>
						<AttributeTreeGridComponent
							tree={sheet.getAttributeTree()}
							onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
							disabled={!editMode}
							characterId={character.id}
						/>
					</Block>

					{renderFeatsSection()}
					<EquipmentSection
						character={character}
						onUpdateEquipment={equipment =>
							updateCharacterProp(character, 'equipment', equipment.toProp())
						}
						editMode={editMode}
					/>
				</div>
			</main>
		</div>
	);
};
