import React from 'react';

import { Button } from '../shared/Button';

interface ConfirmationModalProps {
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
}) => {
	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', height: '100%' }}
		>
			<div>{message}</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button variant='inline' onClick={onCancel} title={cancelText} />
				<Button variant='inline' onClick={onConfirm} title={confirmText} />
			</div>
		</div>
	);
};
