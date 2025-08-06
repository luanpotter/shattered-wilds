import React, { useMemo } from 'react';
import { FaArrowLeft, FaCopy } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { CharacterSheet } from '../types';
import { copyCharacterDataToClipboard } from '../utils/clipboard';
import { Navigator } from '../utils/routes';

import { ActionsSection } from './ActionsSection';
import { DerivedStatsRowComponent } from './DerivedStatsRowComponent';
import { EquipmentSection } from './EquipmentSection';
import { FeatsSectionComponent } from './FeatsSectionComponent';
import { ResourcesRowComponent } from './ResourcesRowComponent';
import Block from './shared/Block';
import { Button } from './shared/Button';
import LabeledInput from './shared/LabeledInput';
import { StatTreeGridComponent } from './stat-tree/StatTreeGridComponent';

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
	const characters = useStore(state => state.characters);
	const character = useMemo(() => characters.find(c => c.id === characterId), [characters, characterId]);

	const updateCharacterName = useStore(state => state.updateCharacterName);
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const editMode = useStore(state => state.editMode);

	const { openRaceSetupModal, openClassSetupModal } = useModals();

	if (!character) {
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

	const sheet = CharacterSheet.from(character.props);

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
					<Button onClick={Navigator.toSimulator} icon={FaArrowLeft} title='Back to Simulator' />
					<Button onClick={onBack} icon={FaArrowLeft} title='Back to List' />
					<h2 style={{ margin: 0, fontSize: '1.5rem' }}>{character.props.name}&apos;s Character Sheet</h2>
				</div>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<Button onClick={() => copyCharacterDataToClipboard(character)} icon={FaCopy} title='Export' />
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
						<DerivedStatsRowComponent variant='normal' characterId={characterId} />
					</Row>

					<Row>
						<ResourcesRowComponent variant='normal' characterId={characterId} />
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
		</>
	);
};
