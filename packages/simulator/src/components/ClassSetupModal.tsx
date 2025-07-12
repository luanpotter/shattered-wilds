import React, { useState } from 'react';

import { useStore } from '../store';
import { Character, CharacterClass, ClassInfo, CLASS_DEFINITIONS } from '../types';
import { FEATS } from '../types/feats';

interface ClassSetupModalProps {
	character: Character;
	onClose?: () => void;
}

type ArchetypeTab = 'Warrior' | 'Caster' | 'Mystic';

export const ClassSetupModal: React.FC<ClassSetupModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const [selectedTab, setSelectedTab] = useState<ArchetypeTab>('Warrior');

	const currentClassInfo = ClassInfo.from(character.props);

	const handleClassSelect = (characterClass: CharacterClass) => {
		// Clear existing core class feats
		const existingCoreFeats = currentClassInfo.getCoreClassFeats();
		existingCoreFeats.forEach(featId => {
			updateCharacterProp(character, `feat:${featId}`, '');
		});

		// Create new ClassInfo with the selected class
		const newClassInfo = new ClassInfo(characterClass);

		// Update character props
		updateCharacterProp(character, 'class', characterClass);
		updateCharacterProp(character, 'class.feats', newClassInfo.toProp());

		// Add new core class feats
		const newCoreFeats = newClassInfo.getCoreClassFeats();
		newCoreFeats.forEach(featId => {
			updateCharacterProp(character, `feat:${featId}`, 'true');
		});
	};

	const isSelected = (characterClass: CharacterClass) => {
		return currentClassInfo.characterClass === characterClass;
	};

	const renderWarriorClasses = () => {
		const roles = ['Melee', 'Ranged', 'Tank'];
		const flavors = ['Martial', 'Survivalist', 'Scoundrel'];
		const attributeMap = { Melee: 'STR', Ranged: 'DEX', Tank: 'CON' };

		return (
			<div>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ border: '1px solid var(--text)', padding: '8px' }}>Role / Flavor</th>
							{flavors.map(flavor => (
								<th key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
									{flavor}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{roles.map(role => (
							<tr key={role}>
								<td style={{ border: '1px solid var(--text)', padding: '8px', fontWeight: 'bold' }}>
									{role} ({attributeMap[role as keyof typeof attributeMap]})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return (
											def.archetype === 'Warrior' && def.role === role && def.flavor === flavor
										);
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell)
															? '#4CAF50'
															: 'var(--background-alt)',
														border: isSelected(classForCell)
															? '2px solid #2E7D32'
															: '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell)
															? '0 2px 4px rgba(76, 175, 80, 0.3)'
															: 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>
													No class
												</div>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const renderCasterClasses = () => {
		const roles = ['Erudite', 'Intuitive', 'Innate'];
		const flavors = ['Arcanist', 'Mechanist', 'Naturalist', 'Musicist'];
		const attributeMap = { Erudite: 'INT', Intuitive: 'WIS', Innate: 'CHA' };

		return (
			<div>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ border: '1px solid var(--text)', padding: '8px' }}>Role / Flavor</th>
							{flavors.map(flavor => (
								<th key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
									{flavor}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{roles.map(role => (
							<tr key={role}>
								<td style={{ border: '1px solid var(--text)', padding: '8px', fontWeight: 'bold' }}>
									{role} ({attributeMap[role as keyof typeof attributeMap]})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.archetype === 'Caster' && def.role === role && def.flavor === flavor;
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell)
															? '#4CAF50'
															: 'var(--background-alt)',
														border: isSelected(classForCell)
															? '2px solid #2E7D32'
															: '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell)
															? '0 2px 4px rgba(76, 175, 80, 0.3)'
															: 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>
													No class
												</div>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const renderMysticClasses = () => {
		const roles = ['Disciple', 'Adept', 'Inspired'];
		const flavors = ['Pure', 'Mixed', 'Martial'];
		const attributeMap = { Disciple: 'DIV', Adept: 'FOW', Inspired: 'LCK' };

		return (
			<div>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ border: '1px solid var(--text)', padding: '8px' }}>Role / Flavor</th>
							{flavors.map(flavor => (
								<th key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
									{flavor}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{roles.map(role => (
							<tr key={role}>
								<td style={{ border: '1px solid var(--text)', padding: '8px', fontWeight: 'bold' }}>
									{role} ({attributeMap[role as keyof typeof attributeMap]})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.archetype === 'Mystic' && def.role === role && def.flavor === flavor;
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell)
															? '#4CAF50'
															: 'var(--background-alt)',
														border: isSelected(classForCell)
															? '2px solid #2E7D32'
															: '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell)
															? '0 2px 4px rgba(76, 175, 80, 0.3)'
															: 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>
													No class
												</div>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const renderSelectedClassInfo = () => {
		const definition = currentClassInfo.characterClass
			? CLASS_DEFINITIONS[currentClassInfo.characterClass]
			: null;
		const coreFeats = currentClassInfo.getCoreClassFeats();
		const coreFeatDefinitions = coreFeats.map(featId => FEATS[featId]).filter(Boolean);

		return (
			<div
				style={{
					marginTop: '16px',
					padding: '12px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
					border: '1px solid var(--text)',
				}}
			>
				{definition ? (
					<>
						<h4 style={{ margin: '0 0 8px 0' }}>Selected: {currentClassInfo.characterClass}</h4>
						<p style={{ margin: '0 0 8px 0', fontSize: '0.9em' }}>
							<strong>Archetype:</strong> {definition.archetype} |
							<strong> Primary Attribute:</strong> {definition.primaryAttribute.name}
						</p>
						<div style={{ marginTop: '8px' }}>
							<strong>Core Class Feats (Level 1):</strong>
							<div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
								{coreFeatDefinitions.map((feat, index) => (
									<div
										key={index}
										style={{
											marginBottom: '6px',
											padding: '6px',
											backgroundColor: 'var(--background)',
											borderRadius: '4px',
											border: '1px solid var(--text)',
										}}
									>
										<div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.9em' }}>
											{feat.name}
										</div>
										<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
											{feat.description}
										</div>
									</div>
								))}
							</div>
						</div>
					</>
				) : (
					<div style={{ color: 'gray', fontStyle: 'italic' }}>
						No class selected yet. Choose a class from the tabs above.
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			style={{
				padding: '16px',
				minWidth: '600px',
				minHeight: '400px',
			}}
		>
			<h3 style={{ margin: '0 0 16px 0' }}>Choose Class for {character.props.name}</h3>

			{/* Tab Navigation */}
			<div style={{ display: 'flex', marginBottom: '16px' }}>
				{(['Warrior', 'Caster', 'Mystic'] as ArchetypeTab[]).map(tab => (
					<button
						key={tab}
						onClick={() => setSelectedTab(tab)}
						style={{
							padding: '8px 16px',
							backgroundColor: selectedTab === tab ? '#2196F3' : 'var(--background-alt)',
							border: selectedTab === tab ? '2px solid #1976D2' : '1px solid var(--text)',
							borderRadius: selectedTab === tab ? '4px 4px 0 0' : '4px',
							color: selectedTab === tab ? 'white' : 'var(--text)',
							cursor: 'pointer',
							marginRight: '4px',
							fontWeight: selectedTab === tab ? 'bold' : 'normal',
							fontSize: selectedTab === tab ? '1em' : '0.9em',
							boxShadow: selectedTab === tab ? '0 2px 4px rgba(33, 150, 243, 0.3)' : 'none',
							transform: selectedTab === tab ? 'translateY(-2px)' : 'none',
						}}
					>
						{tab}s
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div
				style={{
					border: '1px solid var(--text)',
					borderRadius: '0 4px 4px 4px',
					padding: '16px',
					backgroundColor: 'var(--background)',
					minHeight: '200px',
				}}
			>
				{selectedTab === 'Warrior' && renderWarriorClasses()}
				{selectedTab === 'Caster' && renderCasterClasses()}
				{selectedTab === 'Mystic' && renderMysticClasses()}
			</div>

			{/* Selected Class Info */}
			{renderSelectedClassInfo()}

			{/* Action Buttons */}
			{onClose && (
				<div
					style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}
				>
					<button
						onClick={onClose}
						style={{
							padding: '6px 12px',
							border: '1px solid var(--text)',
							backgroundColor: 'var(--background-alt)',
							color: 'var(--text)',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Close
					</button>
				</div>
			)}
		</div>
	);
};
