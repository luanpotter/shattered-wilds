import React, { useState, useMemo } from 'react';
import {
	FaArrowLeft,
	FaEdit,
	FaSave,
	FaPlus,
	FaMinus,
	FaBatteryFull,
	FaCopy,
} from 'react-icons/fa';

import { useStore } from '../store';
import { CharacterSheet, AttributeType, Size, SizeModifiers, DefenseType } from '../types';

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
	const updateCharacterAutomaticMode = useStore(state => state.updateCharacterAutomaticMode);
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

	// Return null if character not found
	if (!character || !sheet) {
		return null;
	}

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterName(character, e.target.value);
	};

	const handleAutomaticModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateCharacterAutomaticMode(character, e.target.checked);
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

	return (
		<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Main Content */}
			<main
				style={{
					flex: 1,
					padding: '2rem',
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
						display: 'grid',
						gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
						gap: '2rem',
					}}
				>
					{/* Left Column */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
						{/* Basic Information */}
						<section
							style={{
								padding: '1.5rem',
								border: '1px solid var(--text)',
								borderRadius: '8px',
								backgroundColor: 'var(--background-alt)',
							}}
						>
							<h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>Basic Information</h2>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr auto',
									gap: '1rem',
									marginBottom: '1rem',
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
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginTop: '1.5rem',
									}}
								>
									<input
										id='automatic-mode'
										type='checkbox'
										checked={character.automaticMode ?? false}
										onChange={handleAutomaticModeChange}
										disabled={!isEditing}
									/>
									<label
										htmlFor='automatic-mode'
										style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
									>
										Automatic Mode
									</label>
								</div>
							</div>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
									gap: '1rem',
								}}
							>
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

						{/* Points Management */}
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
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
												{pointType} Points:
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

					{/* Right Column */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
						{/* Attributes */}
						<section
							style={{
								padding: '1.5rem',
								border: '1px solid var(--text)',
								borderRadius: '8px',
								backgroundColor: 'var(--background-alt)',
							}}
						>
							<h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>Attributes</h2>
							<AttributeTreeComponent
								tree={sheet.getAttributeTree()}
								onUpdateCharacterProp={(key, value) => updateCharacterProp(character, key, value)}
								disabled={!isEditing}
								characterId={character.id}
							/>
						</section>

						{/* Equipment */}
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
				</div>
			</main>
		</div>
	);
};
