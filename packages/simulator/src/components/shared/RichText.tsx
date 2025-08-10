import React from 'react';
import ReactMarkdown from 'react-markdown';

const wikiLinks = (value: string) => {
	return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
		var link, text;
		if (r.includes(' | ')) {
			[link, text] = r.split(' | ');
		} else {
			link = text = r;
		}
		const url = `/wiki/${link.replace(' ', '_')}`;
		return `[${text}](${url})`;
	});
};

interface RichTextProps {
	children: string;
}

export const RichText: React.FC<RichTextProps> = ({ children }) => {
	const preProcessed = wikiLinks(children);
	return (
		<ReactMarkdown
			components={{
				p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
			}}
		>
			{preProcessed}
		</ReactMarkdown>
	);
};
