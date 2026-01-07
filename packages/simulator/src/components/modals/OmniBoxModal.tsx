import React from 'react';

import { semanticClick } from '../../utils';
import { isSimpleRouteDefinition, Navigator, ROUTES } from '../../utils/routes';
import { OmniBoxContext } from '../omni/OmniBoxContext';
import { OmniBoxOption, OmniBoxOptionType } from '../omni/OmniBoxOption';
import { Button } from '../shared/Button';

interface OmniBoxModalProps {
	context: OmniBoxContext | undefined;
	onClose: () => void;
}

export const OmniBoxModal: React.FC<OmniBoxModalProps> = ({ context, onClose }) => {
	const [query, setQuery] = React.useState('');

	const options: OmniBoxOption[] = [
		{ type: OmniBoxOptionType.Misc, label: 'Close', action: () => {} }, // (just closes the modal)
		{ type: OmniBoxOptionType.Misc, label: 'No-op', action: () => console.log('No-op') },
		...buildNavigationOptions(),
		// TODO: more options
	];

	const act = (action: () => void) => {
		action();
		onClose();
	};

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
				// on enter, select the first option
				onKeyDown={e => {
					if (e.key === 'Enter') {
						const firstOption = options.find(option => matches(option, query));
						if (firstOption) {
							act(firstOption.action);
						}
					}
				}}
			/>
			<div style={{ flexGrow: 1, overflowY: 'auto' }}>
				{options
					.filter(option => matches(option, query))
					.map((option, index) => (
						<div
							key={index}
							style={{
								padding: '8px',
								borderBottom: '1px solid #eee',
								cursor: 'pointer',
							}}
							{...semanticClick('button', option.action)}
						>
							{option.label}
						</div>
					))}
			</div>
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

const matches = (option: OmniBoxOption, query: string): boolean => {
	return option.label.toLowerCase().includes(query.toLowerCase());
};

const buildNavigationOptions = (): OmniBoxOption[] => {
	return Object.values(ROUTES)
		.filter(isSimpleRouteDefinition)
		.map(def => ({
			type: OmniBoxOptionType.Navigation,
			label: `Go to ${def.label}`,
			action: () => Navigator.to(def.route),
		}));
};
