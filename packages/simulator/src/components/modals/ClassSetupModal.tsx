import { ClassInfo } from '@shattered-wilds/commons';
import React, { useState } from 'react';

import { useStore } from '../../store';
import {
	Character,
	CharacterClass,
	CLASS_DEFINITIONS,
	ClassRealm,
	ClassRole,
	ClassFlavor,
	CLASS_ROLE_PRIMARY_ATTRIBUTE,
} from '../../types';
import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';
import { Tabs } from '../shared/Tabs';

interface ClassSetupModalProps {
	character: Character;
	onClose?: () => void;
}

export const ClassSetupModal: React.FC<ClassSetupModalProps> = ({ character, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);

	const currentClassInfo = ClassInfo.from(character.props);
	const currentClassRealm = currentClassInfo.definition.realm;
	const [selectedTab, setSelectedTab] = useState<ClassRealm>(currentClassRealm);

	const handleClassSelect = (characterClass: CharacterClass) => {
		updateCharacterProp(character, 'class', characterClass);
	};

	const isSelected = (characterClass: CharacterClass) => {
		return currentClassInfo.characterClass === characterClass;
	};

	const renderWarriorClasses = () => {
		const roles = [ClassRole.Melee, ClassRole.Ranged, ClassRole.Tank];
		const flavors = [ClassFlavor.Martial, ClassFlavor.Survivalist, ClassFlavor.Scoundrel];

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
									{role} ({CLASS_ROLE_PRIMARY_ATTRIBUTE[role].name})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.realm === ClassRealm.Warrior && def.role === role && def.flavor === flavor;
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell) ? '#4CAF50' : 'var(--background-alt)',
														border: isSelected(classForCell) ? '2px solid #2E7D32' : '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell) ? '0 2px 4px rgba(76, 175, 80, 0.3)' : 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>No class</div>
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
		const roles = [ClassRole.Erudite, ClassRole.Intuitive, ClassRole.Innate];
		const flavors = [ClassFlavor.Arcanist, ClassFlavor.Mechanist, ClassFlavor.Naturalist, ClassFlavor.Musicist];

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
									{role} ({CLASS_ROLE_PRIMARY_ATTRIBUTE[role].name})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.realm === ClassRealm.Caster && def.role === role && def.flavor === flavor;
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell) ? '#4CAF50' : 'var(--background-alt)',
														border: isSelected(classForCell) ? '2px solid #2E7D32' : '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell) ? '0 2px 4px rgba(76, 175, 80, 0.3)' : 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>No class</div>
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
		const roles = [ClassRole.Disciple, ClassRole.Adept, ClassRole.Inspired];
		const flavors = [ClassFlavor.Devout, ClassFlavor.Mixed, ClassFlavor.Crusader];

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
									{role} ({CLASS_ROLE_PRIMARY_ATTRIBUTE[role].name})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.realm === ClassRealm.Mystic && def.role === role && def.flavor === flavor;
									});
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px' }}>
											{classForCell ? (
												<button
													onClick={() => handleClassSelect(classForCell)}
													style={{
														width: '100%',
														padding: '8px',
														backgroundColor: isSelected(classForCell) ? '#4CAF50' : 'var(--background-alt)',
														border: isSelected(classForCell) ? '2px solid #2E7D32' : '1px solid var(--text)',
														borderRadius: '4px',
														color: isSelected(classForCell) ? 'white' : 'var(--text)',
														cursor: 'pointer',
														fontWeight: isSelected(classForCell) ? 'bold' : 'normal',
														fontSize: isSelected(classForCell) ? '0.95em' : '0.9em',
														boxShadow: isSelected(classForCell) ? '0 2px 4px rgba(76, 175, 80, 0.3)' : 'none',
													}}
												>
													{classForCell}
												</button>
											) : (
												<div style={{ fontSize: '0.8em', color: 'gray', padding: '8px' }}>No class</div>
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
		const definition = currentClassInfo.characterClass ? CLASS_DEFINITIONS[currentClassInfo.characterClass] : null;
		const coreFeats = currentClassInfo.getCoreFeats();

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
							<strong>Realm:</strong> {definition.realm} |<strong> Primary Attribute:</strong>{' '}
							{definition.primaryAttribute.name}
						</p>
						<div style={{ marginTop: '8px' }}>
							<strong>Core Class Feats (Level 1):</strong>
							<div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
								{coreFeats.map(featInfo => {
									const feat = featInfo.feat;
									const key = feat.key;
									return (
										<div
											key={key}
											style={{
												marginBottom: '6px',
												padding: '6px',
												backgroundColor: 'var(--background)',
												borderRadius: '4px',
												border: '1px solid var(--text)',
											}}
										>
											<div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.9em' }}>{feat.name}</div>
											<div style={{ fontSize: '0.8em' }}>
												<RichText>{feat.description}</RichText>
											</div>
										</div>
									);
								})}
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

			<Tabs
				tabs={Object.values(ClassRealm).map(realm => ({ key: realm, label: `${realm}s` }))}
				activeKey={selectedTab}
				onChange={setSelectedTab}
			/>

			{selectedTab === 'Warrior' && renderWarriorClasses()}
			{selectedTab === 'Caster' && renderCasterClasses()}
			{selectedTab === 'Mystic' && renderMysticClasses()}

			{renderSelectedClassInfo()}

			{onClose && (
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
					<Button onClick={onClose} title='Close' />
				</div>
			)}
		</div>
	);
};
