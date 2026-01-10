import { FeatOrSlot, FeatType } from '@shattered-wilds/d12';
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useStore } from '../store';
import { Character } from '../types/ui';

import { RichText } from './shared/RichText';

export const FeatBox: React.FC<{
	featOrSlot: FeatOrSlot;
	character: Character;
}> = ({ featOrSlot, character }) => {
	const slot = featOrSlot.slot ?? featOrSlot.info?.slot;
	const info = featOrSlot.info;
	const feat = info?.feat;
	const description = info?.description;

	const type = feat?.type || featOrSlot.slot?.type;

	const slotType = slot?.type ?? feat?.type;
	const isCore = slotType === FeatType.Core;

	const isEmpty = featOrSlot.isEmpty;
	const warning = featOrSlot.warning;
	const independentlyChosen = feat?.parameter?.independentlyChosen;
	const isClickable = !isCore || independentlyChosen;

	const key = slot?.toProp() || feat?.key;
	const name = info?.name ?? `Empty ${featOrSlot.slot?.name}`;

	const updateCharacterProp = useStore(state => state.updateCharacterProp);
	const { openFeatSelectionModal, openFeatParameterSetupModal } = useModals();

	const handleOpen = () => {
		if (!isClickable) {
			return;
		}
		if (independentlyChosen && isCore && feat) {
			openFeatParameterSetupModal({
				characterId: character.id,
				slot: undefined, // core feats have no slots
				baseFeat: feat,
			});
			return;
		}
		if (featOrSlot.slot) {
			openFeatSelectionModal({
				characterId: character.id,
				slot: featOrSlot.slot,
			});
		} else {
			const infoSlot = featOrSlot.info?.slot;
			if (infoSlot) {
				updateCharacterProp(character, infoSlot.toProp(), undefined);
			}
		}
	};

	return (
		<div
			key={key}
			style={{
				padding: '8px',
				border: `1px solid ${isEmpty ? 'orange' : 'var(--text)'}`,
				borderRadius: '4px',
				backgroundColor: isClickable ? 'var(--background-alt)' : 'var(--background)',
				cursor: isClickable ? 'pointer' : 'default',
				minHeight: '80px',
				display: 'flex',
				flexDirection: 'column',
				boxSizing: 'border-box',
			}}
			onClick={handleOpen}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleOpen();
				}
			}}
			tabIndex={isClickable ? 0 : -1}
			role={isClickable ? 'button' : undefined}
			aria-label={isClickable ? 'Select feat slot' : undefined}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '4px',
				}}
			>
				<div
					style={{
						fontWeight: 'bold',
						fontSize: '0.9rem',
					}}
				>
					{name}
				</div>
				<div
					style={{
						fontSize: '0.7rem',
						textTransform: 'capitalize',
					}}
				>
					<span style={{ marginRight: '4px' }}>{type}</span>
					{warning && <FaExclamationTriangle size={10} style={{ color: 'orange' }} title={warning} />}
				</div>
			</div>

			{description ? (
				<div
					style={{
						fontSize: '0.8rem',
						lineHeight: '1.3',
					}}
				>
					<RichText>{description}</RichText>
				</div>
			) : (
				<div
					style={{
						fontStyle: 'italic',
						fontSize: '0.8em',
					}}
				>
					Click to assign feat
				</div>
			)}
		</div>
	);
};
