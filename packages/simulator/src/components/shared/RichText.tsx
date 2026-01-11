import { MarkdownPreProcessor } from '@shattered-wilds/d12';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const preProcessor = new MarkdownPreProcessor({
	renderer: (tagName: string, ...args: string[]): string => {
		return `{tag:${tagName}(${args.join(',')})}`;
	},
});

interface RichTextProps {
	children: string;
	otherComponents?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

export const RichText: React.FC<RichTextProps> = ({ children, otherComponents }) => {
	const preProcessed = preProcessor.process(children);
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
				...otherComponents,
			}}
		>
			{preProcessed}
		</ReactMarkdown>
	);
};
