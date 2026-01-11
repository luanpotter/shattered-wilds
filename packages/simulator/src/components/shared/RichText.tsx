import React from 'react';
import ReactMarkdown from 'react-markdown';

const wikiLinks = (value: string): string => {
	return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
		const [link, text] = r.includes(' | ') ? r.split(' | ') : [r, r];
		const url = `/wiki/${link.replace(' ', '_')}`;
		return `[${text}](${url})`;
	});
};

const preProcess = (text: string): string => {
	// look for liquid tags such as {% list "Cover", "order" %}, {% text "Telluric" %} or {% item "Blinded" %}
	// and expand them according to how eleventy does it.
	return text.replace(/{% (list|text|item) "([^"]+)"(, "([^"]+)")? %}/g, (_, tag, arg1, __, arg2) => {
		switch (tag) {
			case 'list': {
				// {% list "Cover", "order" %} -> [Cover]( /wiki/Cover ) (ordered)
				const listType = arg2 === 'order' ? '1.' : '-';
				return `${listType} [${arg1}]( /wiki/${arg1.replace(' ', '_')} )`;
			}
			case 'text':
				// {% text "Telluric" %} -> [Telluric]( /wiki/Telluric )
				return `[${arg1}]( /wiki/${arg1.replace(' ', '_')} )`;
			case 'item':
				// {% item "Blinded" %} -> [Blinded]( /wiki/Blinded )
				return `[${arg1}]( /wiki/${arg1.replace(' ', '_')} )`;
			default:
				return '';
		}
	});
};

interface RichTextProps {
	children: string;
	otherComponents?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

export const RichText: React.FC<RichTextProps> = ({ children, otherComponents }) => {
	const preProcessed = wikiLinks(preProcess(children));
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
