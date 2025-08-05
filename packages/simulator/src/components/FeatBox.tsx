import { FeatSlot, FeatType } from '@shattered-wilds/commons';
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

import { FeatOrSlot } from '../types/feats-section';

import { RichText } from './shared/RichText';

export const FeatBox: React.FC<{
	featOrSlot: FeatOrSlot;
	onSelectSlot: (slot: FeatSlot) => void;
	onClearSlot: (slot: FeatSlot) => void;
}> = ({ featOrSlot, onSelectSlot, onClearSlot }) => {
	const slot = featOrSlot.slot ?? featOrSlot.info?.slot;
	const info = featOrSlot.info;
	const feat = info?.feat;
	const description = feat?.description;

	const type = feat?.type || featOrSlot.slot?.type;

	const slotType = slot?.type ?? feat?.type;
	const isCore = slotType === FeatType.Core;

	const isEmpty = featOrSlot.isEmpty;
	const warning = featOrSlot.warning;
	const isClickable = !isCore;

	const key = slot?.toProp() || feat?.key;
	const name = info?.name ?? `Empty ${featOrSlot.slot?.name}`;

	const handleOpen = () => {
		if (!isClickable) {
			return;
		}
		if (featOrSlot.slot) {
			onSelectSlot(featOrSlot.slot);
		} else {
			const infoSlot = featOrSlot.info?.slot;
			if (infoSlot) {
				onClearSlot(infoSlot);
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
						color: 'var(--text-secondary)',
						fontSize: '0.8em',
					}}
				>
					Click to assign feat
				</div>
			)}
		</div>
	);

	// return (
	// 	<div
	// 		key={key}
	// 		style={{
	// 			padding: '0.75rem',
	// 			border: '1px solid var(--text)',
	// 			borderRadius: '4px',
	// 			backgroundColor: isCore ? 'var(--background)' : 'var(--background-alt)',
	// 		}}
	// 	>
	// 		<div
	// 			style={{
	// 				display: 'flex',
	// 				justifyContent: 'space-between',
	// 				alignItems: 'start',
	// 				marginBottom: '0.25rem',
	// 			}}
	// 		>
	// 			<div
	// 				style={{
	// 					fontWeight: 'bold',
	// 					fontSize: '0.9rem',
	// 				}}
	// 			>
	// 				{feat?.name ?? `Empty ${featOrSlot.slot?.name}`}
	// 			</div>
	// 			<div
	// 				style={{
	// 					fontSize: '0.7rem',
	// 					textTransform: 'capitalize',
	// 				}}
	// 			>
	// 				{type}
	// 			</div>
	// 		</div>
	// 		{description && (
	// 			<div
	// 				style={{
	// 					fontSize: '0.8rem',
	// 					lineHeight: '1.3',
	// 				}}
	// 			>
	// 				<RichText>{description}</RichText>
	// 			</div>
	// 		)}
	// 	</div>
	// );
};
