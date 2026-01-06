import React from 'react';

import { OmniBoxContext } from '../omni/OmniBoxContext';
import { Button } from '../shared/Button';

interface OmniBoxModalProps {
	context: OmniBoxContext | undefined;
	onClose: () => void;
}

export const OmniBoxModal: React.FC<OmniBoxModalProps> = ({ context, onClose }) => {
	const [query, setQuery] = React.useState('');
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', width: '100%' }}>
			{context && <Context context={context} />}
			<input
				ref={input => input?.focus()}
				type='text'
				placeholder='Find anything...'
				style={{ padding: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
				onBlur={onClose}
				value={query}
				onChange={e => setQuery(e.target.value)}
			/>
			<div style={{ flexGrow: 1, overflowY: 'auto' }}>RESULTS for query: {query}</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
				<Button variant='inline' onClick={onClose} title='Cancel' />
			</div>
		</div>
	);
};

const Context: React.FC<{ context: OmniBoxContext }> = ({ context }) => {
	return (
		<div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
			<strong>Context:</strong> {JSON.stringify(context)}
		</div>
	);
};
