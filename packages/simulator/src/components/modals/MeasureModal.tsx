import React from 'react';
import { FaRuler } from 'react-icons/fa';

import { Character, HexPosition } from '../../types/ui';
import { Button } from '../shared/Button';

interface MeasureModalProps {
	fromCharacter: Character;
	toPosition: HexPosition;
	distance: number;
	onClose: () => void;
	onMove?: () => void;
}

export const MeasureModal: React.FC<MeasureModalProps> = ({ fromCharacter, toPosition, distance, onClose, onMove }) => {
	const modalStyle: React.CSSProperties = {
		padding: '20px',
		maxWidth: '400px',
		boxSizing: 'border-box',
	};

	return (
		<div style={modalStyle}>
			<h3
				style={{
					textAlign: 'center',
					margin: '0 0 20px 0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '8px',
				}}
			>
				<FaRuler /> Measure Distance
			</h3>

			<div style={{ marginBottom: '20px', textAlign: 'center' }}>
				<p style={{ margin: '0 0 8px 0' }}>
					From: <strong>{fromCharacter.props.name}</strong>
				</p>
				<p style={{ margin: '0 0 8px 0' }}>
					To:{' '}
					<strong>
						({toPosition.q}, {toPosition.r})
					</strong>
				</p>
				<p style={{ margin: '0', fontSize: '1.2em', fontWeight: 'bold' }}>
					Distance: <span style={{ color: 'var(--success)' }}>{distance}m</span>
				</p>
			</div>

			<div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
				{onMove && (
					<Button
						onClick={() => {
							onMove();
							onClose();
						}}
						title='Move'
					/>
				)}
				<Button onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
