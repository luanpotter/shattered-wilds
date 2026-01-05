import React from 'react';

import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';

interface ErrorModalProps {
	message: string;
	onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', height: '100%' }}
		>
			<div>
				<RichText>{message}</RichText>
			</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button variant='inline' onClick={onClose} title='Close' />
			</div>
		</div>
	);
};
