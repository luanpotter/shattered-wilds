import React from 'react';

import { OmniSearchContext } from '../omni/OmniSearchContext';
import { Button } from '../shared/Button';

interface OmniSearchModalProps {
	context: OmniSearchContext | undefined;
	onClose: () => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ context, onClose }) => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', width: '100%' }}>
			<input
				ref={input => input?.focus()}
				type='text'
				placeholder='Find anything...'
				style={{ padding: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
				onBlur={onClose}
			/>
			<div style={{ flexGrow: 1, overflowY: 'auto' }}>
				TODO: Omni Search Results based on context {context ? JSON.stringify(context) : 'none'}
			</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
				<Button variant='inline' onClick={onClose} title='Cancel' />
			</div>
		</div>
	);
};
