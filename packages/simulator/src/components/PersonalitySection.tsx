import React from 'react';

import Block from './shared/Block';

interface PersonalitySectionProps {
	characterId: string;
}

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({ characterId }) => {
	return (
		<Block>
			<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Personality</h3>
			<div style={{ fontStyle: 'italic', opacity: 0.8 }}>Coming soon :: {characterId}</div>
		</Block>
	);
};
