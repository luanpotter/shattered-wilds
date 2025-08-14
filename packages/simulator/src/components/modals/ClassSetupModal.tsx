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

	const baseButtonStyle: React.CSSProperties = {
		width: '100%',
		padding: '8px',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '0.9em',
	};
	const unselectedButtonStyle: React.CSSProperties = {
		backgroundColor: 'var(--background-alt)',
		border: '1px solid var(--text)',
		boxShadow: 'none',
	};
	const selectedButtonStyle: React.CSSProperties = {
		backgroundColor: 'var(--background)',
		border: '1px solid var(--accent)',
		boxShadow: '0 0 0 1px rgb(from var(--accent) r g b / 0.5)',
	};

	const renderRealmTable = (realm: ClassRealm) => {
		const realmDefs = Object.values(CLASS_DEFINITIONS).filter(def => def.realm === realm);
		const roles: ClassRole[] = [];
		const flavors: ClassFlavor[] = [];
		realmDefs.forEach(def => {
			if (!roles.includes(def.role)) roles.push(def.role);
			if (!flavors.includes(def.flavor)) flavors.push(def.flavor);
		});

		const firstColWidth = '25%';
		const otherColWidth = `${(75 / flavors.length).toFixed(2)}%`;

		return (
			<div>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ border: '1px solid var(--text)', padding: '8px', width: firstColWidth }}>Role / Flavor</th>
							{flavors.map(flavor => (
								<th key={flavor} style={{ border: '1px solid var(--text)', padding: '8px', width: otherColWidth }}>
									{flavor}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{roles.map(role => (
							<tr key={role}>
								<td
									style={{ border: '1px solid var(--text)', padding: '8px', fontWeight: 'bold', width: firstColWidth }}
								>
									{role} ({CLASS_ROLE_PRIMARY_ATTRIBUTE[role].name})
								</td>
								{flavors.map(flavor => {
									const classForCell = Object.values(CharacterClass).find(cls => {
										const def = CLASS_DEFINITIONS[cls];
										return def.realm === realm && def.role === role && def.flavor === flavor;
									})!;
									return (
										<td key={flavor} style={{ border: '1px solid var(--text)', padding: '8px', width: otherColWidth }}>
											<button
												onClick={() => handleClassSelect(classForCell)}
												style={{
													...baseButtonStyle,
													...(isSelected(classForCell) ? selectedButtonStyle : unselectedButtonStyle),
												}}
											>
												{classForCell}
											</button>
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

		if (!definition) {
			return (
				<div style={{ color: 'gray', fontStyle: 'italic' }}>
					No class selected yet. Choose a class from the tabs above.
				</div>
			);
		}

		const coreFeats = currentClassInfo.getCoreFeats();

		const description = [
			['Realm', definition.realm],
			['Role', definition.role],
			['Flavor', definition.flavor],
			['Primary Attribute', definition.primaryAttribute.name],
		];

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
						<p className='desc-line' style={{ fontSize: '0.9em' }}>
							{description.map(([label, value]) => (
								<span key={label}>
									<strong>{label}:</strong> {value}
								</span>
							))}
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

			{renderRealmTable(selectedTab)}

			{renderSelectedClassInfo()}

			{onClose && (
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
					<Button onClick={onClose} title='Close' />
				</div>
			)}
		</div>
	);
};
