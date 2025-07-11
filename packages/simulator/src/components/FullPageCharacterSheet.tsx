import React, { useState, useMemo } from 'react';
import {
	FaArrowLeft,
	FaEdit,
	FaSave,
	FaPlus,
	FaMinus,
	FaBatteryFull,
	FaCopy,
	FaExclamationTriangle,
	FaCog,
} from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, AttributeType, Size, SizeModifiers, DefenseType } from '../types';
import {
	getAllFeatSlots,
	FeatType,
	FEATS,
	getUpbringingModifierFeat,
	isParameterizedFeat,
	getParameterizedFeatDefinition,
} from '../types/feats';

import { AttributeTreeComponent } from './AttributeTreeComponent';
import { EquipmentSection } from './EquipmentSection';

interface FullPageCharacterSheetProps {
	characterId: string;
	onBack: () => void;
	onBackToSimulator: () => void;
	onNavigateToCharacterSheet: (characterId: string) => void;
}

export const FullPageCharacterSheet: React.FC<FullPageCharacterSheetProps> = ({
	characterId,
	onBack,
	onBackToSimulator,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onNavigateToCharacterSheet: _onNavigateToCharacterSheet,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const characters = useStore(state => state.characters);
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

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

	// Create reactive basic attacks and defense that update when sheet changes
	const basicAttacks = useMemo(() => (sheet ? sheet.getBasicAttacks() : []), [sheet]);
	const basicDefense = useMemo(
		() => (sheet ? sheet.getBasicDefense(DefenseType.Basic) : { value: 0, description: '' }),
		[sheet]
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
								onClick={onBackToSimulator}
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

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterName(character, e.target.value);
	};

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
		const characterLevel = sheet.attributes.getNode(AttributeType.Level)?.baseValue || 1;
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

		if (Object.keys(featsByLevel).length === 0) {
			return (
				<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
					<p>No feats assigned yet.</p>
					{isEditing && (
						<p style={{ fontSize: '0.9em' }}>
							Click &quot;Manage Feats&quot; above to assign feats.
						</p>
					)}
				</div>
			);
		}

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
			</div>
		);
	};

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Main Content */}
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
						<button onClick={onBackToSimulator}>
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
						<button
							onClick={() => setIsEditing(!isEditing)}
							style={{
								backgroundColor: isEditing ? 'var(--success)' : 'var(--background)',
								color: isEditing ? 'white' : 'var(--text)',
							}}
						>
							{isEditing ? <FaSave /> : <FaEdit />}{' '}
							{isEditing ? 'Finish Editing' : 'Edit Character'}
						</button>
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '2rem',
					}}
				>
					{/* Basic Information - Wide, Compact, One Line */}
					<section
						style={{
							padding: '1.5rem',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							backgroundColor: 'var(--background-alt)',
						}}
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '2fr 1fr 1fr 1fr',
								gap: '1rem',
								alignItems: 'end',
							}}
						>
							<div>
								<label
									htmlFor='character-name'
									style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
								>
									Name:
								</label>
								<input
									id='character-name'
									type='text'
									value={character.props.name}
									onChange={handleNameChange}
									disabled={!isEditing}
									style={{
										width: '100%',
										padding: '0.5rem',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: isEditing ? 'var(--background)' : 'var(--background-alt)',
										boxSizing: 'border-box',
									}}
								/>
							</div>
							<div>
								<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
									Race:
								</span>
								<div
									style={{
										padding: '0.5rem',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: 'var(--background-alt)',
										cursor: isEditing ? 'pointer' : 'default',
										minHeight: '2rem',
										display: 'flex',
										alignItems: 'center',
									}}
									onClick={isEditing ? handleOpenRaceSetup : undefined}
									onKeyDown={
										isEditing
											? e => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														handleOpenRaceSetup();
													}
												}
											: undefined
									}
									tabIndex={isEditing ? 0 : -1}
									role={isEditing ? 'button' : undefined}
								>
									{sheet.race.toString()}
								</div>
							</div>
							<div>
								<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
									Class:
								</span>
								<div
									style={{
										padding: '0.5rem',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: 'var(--background-alt)',
										cursor: isEditing ? 'pointer' : 'default',
										minHeight: '2rem',
										display: 'flex',
										alignItems: 'center',
									}}
									onClick={isEditing ? handleOpenClassSetup : undefined}
									onKeyDown={
										isEditing
											? e => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														handleOpenClassSetup();
													}
												}
											: undefined
									}
									tabIndex={isEditing ? 0 : -1}
									role={isEditing ? 'button' : undefined}
								>
									{sheet.characterClass.characterClass}
								</div>
							</div>
							<div>
								<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
									Level:
								</span>
								<div
									style={{
										padding: '0.5rem',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: 'var(--background-alt)',
										textAlign: 'center',
										fontSize: '1.1rem',
										fontWeight: 'bold',
										minHeight: '2rem',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{sheet.attributes.getNode(AttributeType.Level)?.baseValue || 1}
								</div>
							</div>
						</div>
					</section>

					{/* Derived Stats and Resource Points Row */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
							gap: '2rem',
						}}
					>
						{/* Derived Stats */}
						<section
							style={{
								padding: '1.5rem',
								border: '1px solid var(--text)',
								borderRadius: '8px',
								backgroundColor: 'var(--background-alt)',
							}}
						>
							<h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>Derived Stats</h2>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
									gap: '1rem',
									marginBottom: '1rem',
								}}
							>
								<div>
									<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
										Size:
									</span>
									<div
										style={{
											padding: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background)',
											textAlign: 'center',
										}}
										title={sheet.derivedStats.size.description}
									>
										{getSizeDisplay(sheet.derivedStats.size.value)}
									</div>
								</div>
								<div>
									<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
										Movement:
									</span>
									<div
										style={{
											padding: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background)',
											textAlign: 'center',
										}}
										title={sheet.derivedStats.movement.description}
									>
										{sheet.derivedStats.movement.value}
									</div>
								</div>
								<div>
									<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
										Initiative:
									</span>
									<div
										style={{
											padding: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background)',
											textAlign: 'center',
										}}
										title={sheet.derivedStats.initiative.description}
									>
										{sheet.derivedStats.initiative.value}
									</div>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
								<div>
									<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
										Basic Attacks:
									</span>
									<div
										style={{
											padding: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background)',
											minHeight: '2rem',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
										}}
										title={basicAttacks.map(attack => attack.description).join(' / ')}
									>
										{basicAttacks.map(attack => attack.description).join(' / ') || 'None'}
									</div>
								</div>
								<div>
									<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
										Basic Defense:
									</span>
									<div
										style={{
											padding: '0.5rem',
											border: '1px solid var(--text)',
											borderRadius: '4px',
											backgroundColor: 'var(--background)',
											textAlign: 'center',
										}}
										title={basicDefense.description}
									>
										{basicDefense.value}
									</div>
								</div>
							</div>
						</section>

						{/* Resource Points */}
						<section
							style={{
								padding: '1.5rem',
								border: '1px solid var(--text)',
								borderRadius: '8px',
								backgroundColor: 'var(--background-alt)',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '1.5rem',
									flexWrap: 'wrap',
									gap: '1rem',
								}}
							>
								<h2 style={{ margin: 0, fontSize: '1.3rem' }}>Resource Points</h2>
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
									}}
									title='Refill all points to maximum'
								>
									<FaBatteryFull />
									Refill All
								</button>
							</div>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
									gap: '1rem',
								}}
							>
								{['Heroism', 'Vitality', 'Focus', 'Spirit'].map(pointType => {
									const maxValue = (
										sheet.derivedStats[`max${pointType}` as keyof typeof sheet.derivedStats] as any
									).value;
									const currentValue =
										sheet.currentValues[`current${pointType}` as keyof typeof sheet.currentValues];

									return (
										<div key={pointType}>
											<span
												style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
											>
												{pointType}:
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
							</div>
						</section>
					</div>

					{/* Stat Tree - Wide */}
					<section
						style={{
							padding: '1.5rem',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							backgroundColor: 'var(--background-alt)',
						}}
					>
						<h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>Stat Tree</h2>
						<AttributeTreeComponent
							tree={sheet.getAttributeTree()}
							onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
							disabled={!isEditing}
							characterId={character.id}
						/>
					</section>

					{/* Feats - Wide */}
					<section
						style={{
							padding: '1.5rem',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							backgroundColor: 'var(--background-alt)',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '1.5rem',
								flexWrap: 'wrap',
								gap: '1rem',
							}}
						>
							<h2 style={{ margin: 0, fontSize: '1.3rem' }}>Feats</h2>
							{isEditing && (
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
						{renderFeatsSection()}
					</section>

					{/* Equipment - Wide */}
					<section
						style={{
							padding: '1.5rem',
							border: '1px solid var(--text)',
							borderRadius: '8px',
							backgroundColor: 'var(--background-alt)',
						}}
					>
						<h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>Equipment</h2>
						<EquipmentSection
							character={character}
							onUpdateEquipment={equipment =>
								updateCharacterProp(character, 'equipment', equipment.toProp())
							}
							editMode={isEditing}
						/>
					</section>
				</div>
			</main>
		</div>
	);
};
