import { FeatDefinition, FeatSlot, FeatInfo } from '@shattered-wilds/commons';
import React from 'react';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { CharacterSheet } from '../../types';
import { FeatsSection } from '../../types/feats-section';
import Block from '../shared/Block';
import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';

interface FeatSelectionModalProps {
	characterId: string;
	slot: FeatSlot;
	onClose: () => void;
}

export const FeatSelectionModal: React.FC<FeatSelectionModalProps> = ({ characterId, slot, onClose }) => {
	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const characters = useStore(state => state.characters);
	const { openFeatParameterSetupModal } = useModals();

	const character = characters.find(c => c.id === characterId);
	if (!character) {
		return <div>Character not found: {characterId}</div>;
	}

	const sheet = CharacterSheet.from(character.props);
	const featsSection = FeatsSection.create(sheet);

	const handleFeatSelect = (selectedFeat: FeatDefinition<string | void> | null) => {
		const slotKey = slot.toProp();

		if (!selectedFeat) {
			// Clear slot
			updateCharacterProp(character, slotKey, undefined);
			onClose();
			return;
		}

		if (selectedFeat?.parameter) {
			// This feat requires parameters - close this modal and open parameter setup
			onClose();
			openFeatParameterSetupModal({
				characterId,
				slot,
				baseFeat: selectedFeat,
			});
		} else {
			// Direct feat selection without parameters
			const info = FeatInfo.hydrateFeatDefinition(selectedFeat, {}, slot);
			const [key, value] = info.toProp()!;
			updateCharacterProp(character, key, value);
			onClose();
		}
	};

	return (
		<Block>
			<div style={{ marginBottom: '16px' }}>
				<Button onClick={() => handleFeatSelect(null)} title='Clear Slot' />
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{featsSection.availableFeatsForSlot(slot, sheet).map(feat => (
					<div
						key={feat.key}
						style={{
							padding: '12px',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							cursor: 'pointer',
							backgroundColor: 'var(--background-alt)',
						}}
						onClick={() => handleFeatSelect(feat)}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleFeatSelect(feat);
							}
						}}
						tabIndex={0}
						role='button'
						aria-label={`Select ${feat.name} feat`}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<span style={{ fontWeight: 'bold' }}>{feat.name}</span>
							<span style={{ fontStyle: 'italic' }}>
								{feat.type} Level {feat.level} {sheet.applicableSource(feat)} Feat
							</span>
						</div>
						<div style={{ fontSize: '0.9em' }}>
							<RichText>{feat.description}</RichText>
						</div>
					</div>
				))}
			</div>
		</Block>
	);
};
