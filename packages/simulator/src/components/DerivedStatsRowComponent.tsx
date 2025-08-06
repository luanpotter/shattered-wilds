import { DerivedStatType } from '@shattered-wilds/commons';
import React from 'react';

import { Check, CheckMode, CheckNature } from '../../../commons/dist/stats/check';
import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { CharacterSheet } from '../types';

import LabeledInput from './shared/LabeledInput';

export const DerivedStatsRowComponent: React.FC<{ variant: 'normal' | 'inline'; characterId: string }> = ({
	variant,
	characterId,
}) => {
	const { openDiceRollModal } = useModals();

	const character = useStore(state => state.characters).find(c => c.id === characterId)!;
	const sheet = CharacterSheet.from(character.props);
	const statTree = sheet.getStatTree();

	const movement = statTree.getModifier(DerivedStatType.Movement);
	const initiative = statTree.getModifier(DerivedStatType.Initiative);
	const influenceRange = statTree.getModifier(DerivedStatType.InfluenceRange);

	return (
		<>
			<LabeledInput variant={variant} label='Size' value={sheet.size} tooltip={sheet.race.toString()} disabled />
			<LabeledInput
				variant={variant}
				label='Movement'
				value={movement.value.description}
				tooltip={movement.description}
				disabled
			/>
			<LabeledInput
				variant={variant}
				label='Initiative'
				value={initiative.value.description}
				tooltip={initiative.description}
				disabled
				onClick={() => {
					openDiceRollModal({
						characterId,
						check: new Check({
							mode: CheckMode.Contested,
							nature: CheckNature.Resisted,
							statModifier: initiative,
						}),
						title: `Roll Initiative Check`,
					});
				}}
			/>
			<LabeledInput
				variant={variant}
				label='Influence Range'
				value={influenceRange.value.description}
				tooltip={influenceRange.description}
				disabled
			/>
		</>
	);
};
