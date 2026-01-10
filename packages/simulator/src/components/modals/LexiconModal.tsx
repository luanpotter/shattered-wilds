import { METADATA_CLASSES, WIKI, WikiDatum } from '@shattered-wilds/d12';
import React from 'react';

import { useModals } from '../../hooks/useModals';
import { semanticClick } from '../../utils';
import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';

interface LexiconModalProps {
	entry: WikiDatum;
	onClose: () => void;
}

export const LexiconModal: React.FC<LexiconModalProps> = ({ entry, onClose }) => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			<div className='item-header'>
				<div className='item-metadata'>
					{entry.metadata.map(({ metadataClass, key, value }, index) => {
						const css = METADATA_CLASSES[metadataClass];
						return (
							<span key={index} style={{ color: css.color }}>
								{key.slug ? <WikiLink slug={key.slug} title={key.text} overrideStyle={true} /> : key.text}
								{value !== undefined && (
									<>
										:{' '}
										{value.slug ? (
											<WikiLink slug={value.slug} title={`${value.text}`} overrideStyle={true} />
										) : (
											value.text
										)}
									</>
								)}
							</span>
						);
					})}
				</div>

				<Breadcrumb entry={entry} />
			</div>
			<div className='item-excerpt'>
				<RichText
					otherComponents={{
						a: ({ href, children }) => {
							if (href?.startsWith('/wiki/') === true) {
								return <WikiLink slug={href?.replace('/wiki/', '') || ''} title={children as string} />;
							}
							return <a href={href}>{children}</a>;
						},
					}}
				>
					{entry.content}
				</RichText>
			</div>
			<Button variant='inline' onClick={onClose} title='Close' />
		</div>
	);
};

const Breadcrumb: React.FC<{ entry: WikiDatum }> = ({ entry }) => {
	const { group, groupSlug } = entry;
	if (!group || !groupSlug) {
		return null;
	}
	return (
		entry.group && (
			<div className='breadcrumb'>
				<WikiLink slug={groupSlug} title={`← ${group.replace(/_/g, ' ')}`} />
			</div>
		)
	);
};

const WikiLink: React.FC<{ slug: string; title: string; overrideStyle?: boolean }> = ({
	slug,
	title,
	overrideStyle = false,
}) => {
	const { openLexiconModal } = useModals();
	const entry = WIKI.find(e => e.slug === slug);
	const style = overrideStyle ? { color: 'inherit', cursor: 'pointer' } : { cursor: 'pointer' };
	if (!entry) {
		console.warn(`WikiLink: entry not found for slug "${slug}"`);
		return (
			<a style={style} href={`/wiki/${slug}`}>
				{title}
			</a>
		);
	}
	return (
		<a style={style} {...semanticClick('button', () => openLexiconModal({ entry }))}>
			{title}
		</a>
	);
};
