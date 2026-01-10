import { Condition, CONDITIONS } from '@shattered-wilds/d12';
import React from 'react';

import { AddCircumstanceModal } from './AddCircumstanceModal';

interface AddConditionModalProps {
	characterId: string;
	onClose: () => void;
	onConfirm: (condition: Condition, rank: number) => void;
}

export const AddConditionModal: React.FC<AddConditionModalProps> = ({ characterId, onClose, onConfirm }) => {
	return (
		<AddCircumstanceModal
			characterId={characterId}
			onClose={onClose}
			onConfirm={onConfirm}
			items={Object.values(Condition)}
			definitions={CONDITIONS}
		/>
	);
};
