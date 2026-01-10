import { CharacterSheet, CheckFactory, DerivedStatType } from '@shattered-wilds/d12';
import React from 'react';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';

import LabeledInput from './shared/LabeledInput';

export const DerivedStatsRowComponent: React.FC<{ variant: 'normal' | 'inline'; characterId: string }> = ({
	variant,
	characterId,
}) => {
	const { openDiceRollModal } = useModals();

	const character = useStore(state => state.characters.find(c => c.id === characterId))!;

	const sheet = CharacterSheet.from(character.props);
	const tree = sheet.getStatTree();
	const movement = tree.getDistance(DerivedStatType.Movement);
	const initiative = tree.getModifier(DerivedStatType.Initiative);
	const influenceRange = tree.getDistance(DerivedStatType.InfluenceRange);

	const checkFactory = new CheckFactory({ characterSheet: sheet });

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
				label='Influence Range'
				value={influenceRange.value.description}
				tooltip={influenceRange.description}
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
						check: checkFactory.initiative(),
					});
				}}
			/>
		</>
	);
};
