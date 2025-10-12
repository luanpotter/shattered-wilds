import { Consequence, CONSEQUENCES } from '@shattered-wilds/commons';
import React from 'react';

import { AddCircumstanceModal } from './AddCircumstanceModal';

interface AddConsequenceModalProps {
	characterId: string;
	onClose: () => void;
	onConfirm: (consequence: Consequence, rank: number) => void;
}

export const AddConsequenceModal: React.FC<AddConsequenceModalProps> = ({ characterId, onClose, onConfirm }) => {
	return (
		<AddCircumstanceModal
			characterId={characterId}
			onClose={onClose}
			onConfirm={onConfirm}
			items={Object.values(Consequence)}
			definitions={CONSEQUENCES}
		/>
	);
};
