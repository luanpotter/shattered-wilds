import React from 'react';
import ReactMarkdown from 'react-markdown';

const wikiLinks = (value: string) => {
	return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
		const [link, text] = r.includes(' | ') ? r.split(' | ') : [r, r];
		const url = `/wiki/${link.replace(' ', '_')}`;
		return `[${text}](${url})`;
	});
};

interface RichTextProps {
	children: string;
	otherComponents?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

export const RichText: React.FC<RichTextProps> = ({ children, otherComponents }) => {
	const preProcessed = wikiLinks(children);
	return (
		<ReactMarkdown
			components={{
				p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
				...otherComponents,
			}}
		>
			{preProcessed}
		</ReactMarkdown>
	);
};
