import { Personality } from '@shattered-wilds/commons';
import React from 'react';

import { Bold, PrintRichText } from './print-friendly-commons';

export const PrintFriendlyPersonality: React.FC<{ personality: Personality }> = ({ personality }) => {
	if (!personality.hasAny()) {
		return null;
	}

	const Entry = ({ label, content }: { label: string; content: string | undefined }) => {
		if (!content) {
			return null;
		}
		return (
			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>{label}</div>
				<div style={{ padding: '0 16px' }}>
					<PrintRichText>{content}</PrintRichText>
				</div>
			</div>
		);
	};

	return (
		<div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
			<div style={{ width: '100%', border: '1px solid black' }}>
				<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
					<Bold>Personality</Bold>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gap: '0.5rem',
						margin: '8px',
						justifyContent: 'stretch',
					}}
				>
					<Entry label='Backstory' content={personality.backstory} />
					<Entry label='Calling' content={personality.calling} />
					<Entry label='Vice' content={personality.vice} />
					<Entry label='Aversion' content={personality.aversion} />
					<Entry label='Tenet' content={personality.tenet} />
					<Entry label='Leanings' content={personality.leanings} />
				</div>
			</div>
		</div>
	);
};
