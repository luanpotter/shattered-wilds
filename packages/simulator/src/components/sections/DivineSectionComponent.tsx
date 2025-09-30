import {
	ActionCost,
	CharacterSheet,
	Check,
	CheckMode,
	CheckNature,
	DerivedStatType,
	Resource,
	StatModifier,
	StatTree,
	StatType,
} from '@shattered-wilds/commons';
import React from 'react';
import { FaDice } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { Character } from '../../types/ui';
import { CostBoxComponent } from '../CostBoxComponent';
import { ParameterBoxComponent } from '../ParameterBoxComponent';
import Block from '../shared/Block';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';

interface DivineSectionProps {
	characterId: string;
}

export const DivineSectionComponent: React.FC<DivineSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);
	const tree = sheet.getStatTree();

	const { primaryAttribute } = sheet.characterClass.definition;
	if (!StatType.soulAttributes.includes(primaryAttribute.name)) {
		return null; // not a mystic
	}

	return <DivineSectionInner character={character} sheet={sheet} tree={tree} primaryAttribute={primaryAttribute} />;
};

const DivineSectionInner: React.FC<{
	character: Character;
	sheet: CharacterSheet;
	tree: StatTree;
	primaryAttribute: StatType;
}> = ({ character, sheet, tree, primaryAttribute }) => {
	const influenceRange = tree.getDistance(DerivedStatType.InfluenceRange);
	const baseModifier = tree.getModifier(primaryAttribute);

	const costs = [
		new ActionCost({ resource: Resource.ActionPoint, amount: 2 }),
		new ActionCost({ resource: Resource.SpiritPoint, amount: 1 }),
	];

	return (
		<Block>
			<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Divine</h3>
			<div style={{ display: 'flex', gap: '8px' }}>
				<LabeledInput
					variant='normal'
					label='Base Modifier'
					value={`${baseModifier.name} (${baseModifier.value.description})`}
					tooltip={baseModifier.description}
					disabled
				/>
				<LabeledInput
					variant='normal'
					label='Range Increment'
					tooltip={influenceRange.description}
					value={influenceRange.value.description}
					disabled
				/>
			</div>
			<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
			<div style={{ display: 'flex', gap: '2px' }}>
				<CostBoxComponent characterId={character.id} sheet={sheet} name='Divine Channeling' actionCosts={costs} />
				<div
					style={{
						flex: 1,
						padding: '12px',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						backgroundColor: 'var(--background-alt)',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
						<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
							<span style={{ fontWeight: 'bold' }}>Pure Divine Channeling</span>
						</div>
					</div>
					<div style={{ fontSize: '0.9em' }}>
						<RichText>
							A plea to the forces of the beyond to grant a desired effect. The vaguer the request, the more likely it
							is for it to succeed in some form or another.
						</RichText>
					</div>
				</div>
				<SpellCheckBox character={character} finalModifier={baseModifier} />
			</div>
		</Block>
	);
};

const SpellCheckBox: React.FC<{
	character: Character;
	finalModifier: StatModifier;
}> = ({ character, finalModifier }) => {
	const { openDiceRollModal } = useModals();

	return (
		<ParameterBoxComponent
			title={`${finalModifier.name} (${finalModifier.value.description})`}
			tooltip={finalModifier.description}
			onClick={() => {
				openDiceRollModal({
					characterId: character.id,
					check: new Check({
						mode: CheckMode.Contested,
						nature: CheckNature.Active,
						statModifier: finalModifier,
					}),
					title: `Roll ${finalModifier.name} Check`,
				});
			}}
		>
			{finalModifier.value.description}
			<FaDice size={12} />
		</ParameterBoxComponent>
	);
};
