import { METADATA_CLASSES, StatTypeName, WIKI, WikiDatum } from '@shattered-wilds/d12';
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
				<RichTextWithLinks>{entry.content}</RichTextWithLinks>
				{renderExtraContent(entry)}
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
		console.error(`WikiLink entry not found for slug: ${slug}`);
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

const renderExtraContent = (entry: WikiDatum) => {
	if (entry.group === 'Stat') {
		return renderStatExtraContent(entry);
	}
	return null;
};

interface AttributeExtraFields {
	longDescription?: string;
	hierarchy?: string;
	childHierarchy?: string;
	parent?: string;
	parentSlug?: string;
	children?: StatTypeName[];
	exampleUsages?: string[];
}

const renderStatExtraContent = (lexicon: WikiDatum & AttributeExtraFields) => {
	return (
		<>
			{lexicon.longDescription ? <RichTextWithLinks>{`${lexicon.longDescription}`}</RichTextWithLinks> : null}
			{lexicon.parent ? (
				<p>
					<strong>{lexicon.title}</strong> is a {lexicon.hierarchy} of{' '}
					<WikiLink slug={lexicon.parent} title={lexicon.parent} />.
				</p>
			) : null}
			{lexicon.children && lexicon.children.length > 0 ? (
				<>
					<p>It has the following {lexicon.childHierarchy}s:</p>
					<ul>
						{lexicon.children.map(child => (
							<li key={child}>
								<WikiLink slug={child} title={child} />
							</li>
						))}
					</ul>
				</>
			) : null}
			{lexicon.exampleUsages && lexicon.exampleUsages.length > 0 ? (
				<>
					<h3>Example Usages</h3>
					<ul>
						{lexicon.exampleUsages.map((usage, index) => (
							<li key={index}>
								<RichTextWithLinks>{usage}</RichTextWithLinks>
							</li>
						))}
					</ul>
				</>
			) : null}
		</>
	);
};

const RichTextWithLinks: React.FC<{ children: string }> = ({ children }) => {
	return (
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
			{children}
		</RichText>
	);
};
