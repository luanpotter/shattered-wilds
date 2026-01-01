import { CharacterSheet, FeatsSection, StatType } from '@shattered-wilds/commons';
import React from 'react';
import {
	FaArrowLeft,
	FaBolt,
	FaBrain,
	FaBug,
	FaCopy,
	FaExclamationTriangle,
	FaMagic,
	FaPen,
	FaPrint,
	FaShieldAlt,
	FaSitemap,
	FaSlidersH,
	FaStar,
	FaSun,
	FaThLarge,
} from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useUIStateFactory } from '../../hooks/useUIState';
import { useStore } from '../../store';
import { copyCharacterDataToClipboard } from '../../utils/clipboard';
import { Navigator } from '../../utils/routes';
import { DerivedStatsRowComponent } from '../DerivedStatsRowComponent';
import { ResourcesRowComponent } from '../ResourcesRowComponent';
import { ActionsSectionComponent } from '../sections/ActionsSectionComponent';
import { ArcaneSectionComponent } from '../sections/ArcaneSectionComponent';
import { CircumstancesSectionComponent } from '../sections/CircumstancesSectionComponent';
import { DebugSection } from '../sections/DebugSection';
import { DivineSectionComponent } from '../sections/DivineSectionComponent';
import { EquipmentSection } from '../sections/EquipmentSection';
import { FeatsSectionComponent } from '../sections/FeatsSectionComponent';
import { MiscSectionComponent } from '../sections/MiscSectionComponent';
import { PersonalitySectionComponent } from '../sections/PersonalitySectionComponent';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import LabeledInput from '../shared/LabeledInput';
import { StatTreeGridComponent } from '../stat-tree/StatTreeGridComponent';

interface FullPageCharacterSheetProps {
	characterId: string;
	onBack: () => void;
}

export const FullPageCharacterSheet: React.FC<FullPageCharacterSheetProps> = ({ characterId, onBack }) => {
	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<main
				style={{
					flex: 1,
					padding: '1rem',
					overflow: 'auto',
					maxWidth: '1250px',
					margin: '0 auto',
					width: '100%',
					boxSizing: 'border-box',
				}}
			>
				<FullPageCharacterSheetContent characterId={characterId} onBack={onBack} />
			</main>
		</div>
	);
};

const FullPageCharacterSheetContent: React.FC<FullPageCharacterSheetProps> = ({ characterId, onBack }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId));
	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const editMode = useStore(state => state.editMode);

	const { openRaceSetupModal, openClassSetupModal } = useModals();

	const sheet = character?.props ? CharacterSheet.from(character.props) : null;

	const { useState } = useUIStateFactory(`full-page-sheet-${characterId}`);
	type TabKey =
		| 'all'
		| 'stats'
		| 'circumstances'
		| 'feats'
		| 'equipment'
		| 'actions'
		| 'arcane'
		| 'divine'
		| 'personality'
		| 'misc'
		| 'debug';
	const [activeTab, setActiveTab] = useState<TabKey>('activeTab', 'all');

	const primaryAttrName = sheet?.characterClass.definition.primaryAttribute.name;
	const hasArcane = primaryAttrName ? StatType.mindAttributes.includes(primaryAttrName) : false;
	const hasDivine = primaryAttrName ? StatType.soulAttributes.includes(primaryAttrName) : false;

	const tabs: { key: TabKey; icon: React.ComponentType; tooltip: string }[] = [
		{ key: 'all', icon: FaThLarge, tooltip: 'All' },
		{ key: 'stats', icon: FaSitemap, tooltip: 'Stats' },
		{ key: 'circumstances', icon: FaSlidersH, tooltip: 'Circumstances' },
		{ key: 'feats', icon: FaStar, tooltip: 'Feats' },
		{ key: 'equipment', icon: FaShieldAlt, tooltip: 'Equipment' },
		{ key: 'actions', icon: FaBolt, tooltip: 'Actions' },
		...(hasArcane ? ([{ key: 'arcane', icon: FaMagic, tooltip: 'Arcane' }] as const) : ([] as const)),
		...(hasDivine ? ([{ key: 'divine', icon: FaSun, tooltip: 'Divine' }] as const) : ([] as const)),
		{ key: 'personality', icon: FaBrain, tooltip: 'Personality' },
		{ key: 'misc', icon: FaPen, tooltip: 'Misc' },
		{ key: 'debug', icon: FaBug, tooltip: 'Debug' },
	];
	const availableKeys = tabs.map(t => t.key);
	const resolvedTab: TabKey = (availableKeys.includes(activeTab) ? activeTab : 'all') as TabKey;

	if (!character || !sheet) {
		return (
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '1rem',
					color: 'var(--error-color)',
					marginTop: '4rem',
				}}
			>
				Character {characterId} not found.
				<Button onClick={onBack} icon={FaArrowLeft} title='Back to List' />
			</div>
		);
	}

	const statTreeHasWarnings = sheet.getStatTree().root.childrenHaveUnallocatedPoints;
	const featsHasWarnings = FeatsSection.create(sheet).hasWarnings;

	const Row = ({ children }: { children: React.ReactNode }) => {
		return <div style={{ display: 'flex' }}>{children}</div>;
	};

	const Column = ({ children }: { children: React.ReactNode }) => {
		return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>;
	};

	return (
		<>
			<div
				style={{
					marginBottom: '1rem',
					display: 'flex',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
					<Button onClick={onBack} icon={FaArrowLeft} title='Back to List' />
					<h2 style={{ margin: 0, fontSize: '1.5rem' }}>{character.props.name}&apos;s Character Sheet</h2>
				</div>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<Button onClick={() => Navigator.toPrintView(character.id)} icon={FaPrint} title='Print Version' />
					<Button onClick={() => copyCharacterDataToClipboard(character)} icon={FaCopy} title='Export' />
				</div>
			</div>
			<Column>
				<Block>
					<Row>
						<LabeledInput
							label='Name'
							value={character.props.name}
							onBlur={value => updateCharacterName(character, value)}
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
						<DerivedStatsRowComponent variant='normal' characterId={characterId} />
					</Row>

					<Row>
						<ResourcesRowComponent variant='normal' characterId={characterId} />
					</Row>
				</Block>

				{/* Tab Selector */}
				<div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0 0.75rem' }}>
					<div
						style={{
							display: 'flex',
							gap: '0.5rem',
							padding: '4px',
							borderRadius: '6px',
							background: 'var(--panel-bg, rgba(0,0,0,0.05))',
							boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
						}}
					>
						{tabs.map(t => {
							const Icon = t.icon as React.ComponentType<{ size?: number }>;
							const isActive = resolvedTab === t.key;
							return (
								<button
									key={t.key}
									title={t.tooltip}
									aria-label={t.tooltip}
									onClick={() => setActiveTab(t.key)}
									className='icon-button'
									style={{
										width: '34px',
										height: '30px',
										borderRadius: '4px',
										background: isActive ? 'var(--primary-ghost, rgba(0,0,0,0.12))' : 'transparent',
										boxShadow: isActive ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : 'none',
										position: 'relative',
									}}
								>
									<Icon size={16} />
									{(t.key === 'stats' && statTreeHasWarnings) || (t.key === 'feats' && featsHasWarnings) ? (
										<FaExclamationTriangle
											size={10}
											style={{ position: 'absolute', top: 2, right: 2, color: 'var(--accent)' }}
											title={t.key === 'stats' ? 'Unallocated Stat Points' : 'Feats have warnings'}
										/>
									) : null}
								</button>
							);
						})}
					</div>
				</div>

				{(resolvedTab === 'all' || resolvedTab === 'stats') && (
					<Block>
						<StatTreeGridComponent
							characterSheet={sheet}
							onUpdateCharacterProp={(key: string, value: string) => updateCharacterProp(character, key, value)}
							disabled={!editMode}
							characterId={characterId}
						/>
					</Block>
				)}

				{(resolvedTab === 'all' || resolvedTab === 'circumstances') && (
					<CircumstancesSectionComponent characterId={characterId} />
				)}
				{(resolvedTab === 'all' || resolvedTab === 'feats') && <FeatsSectionComponent characterId={characterId} />}
				{(resolvedTab === 'all' || resolvedTab === 'equipment') && <EquipmentSection characterId={characterId} />}
				{(resolvedTab === 'all' || resolvedTab === 'actions') && <ActionsSectionComponent characterId={characterId} />}
				{(resolvedTab === 'all' || resolvedTab === 'arcane') && hasArcane && (
					<ArcaneSectionComponent characterId={characterId} />
				)}
				{(resolvedTab === 'all' || resolvedTab === 'divine') && hasDivine && (
					<DivineSectionComponent characterId={characterId} />
				)}
				{(resolvedTab === 'all' || resolvedTab === 'personality') && (
					<PersonalitySectionComponent characterId={characterId} />
				)}
				{(resolvedTab === 'all' || resolvedTab === 'misc') && <MiscSectionComponent characterId={characterId} />}
				{resolvedTab === 'debug' && <DebugSection characterId={characterId} />}
			</Column>
		</>
	);
};
