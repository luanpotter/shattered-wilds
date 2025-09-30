import * as tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.ts';
import htmlESLint from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

export default tseslint.config(
	...baseConfig,
	{
		ignores: ['dist/**/*', 'build/**/*']
	},
	// HTML-specific configuration
	{
		files: ['templates/**/*.html'],
		plugins: {
			'@html-eslint': htmlESLint,
		},
		languageOptions: {
			parser: htmlParser,
		},
		rules: {
			'@html-eslint/require-doctype': 'off', // Templates don't need DOCTYPE
			'@html-eslint/require-lang': 'off', // Templates don't need lang attribute
			'@html-eslint/no-multiple-h1': 'off', // Templates may have multiple h1s in different contexts
			'@html-eslint/require-meta-charset': 'off', // Templates don't need charset meta
			'@html-eslint/require-title': 'off', // Templates don't need title
			'@html-eslint/no-inline-styles': 'off', // Allow inline styles in templates for dynamic behavior
			'@html-eslint/require-img-alt': 'error', // Accessibility
			'@html-eslint/no-obsolete-tags': 'error', // No obsolete HTML tags
			'@html-eslint/require-button-type': 'error', // Always specify button type
			'@html-eslint/no-target-blank': 'warn', // Security concern
			'@html-eslint/indent': ['error', 'tab'], // Use tabs for indentation
			'@html-eslint/quotes': ['error', 'double'], // Use double quotes
			'@html-eslint/element-newline': 'off', // Allow flexibility for templates
			'@html-eslint/no-extra-spacing-attrs': 'error', // Clean attribute spacing
			'@html-eslint/attrs-newline': 'off', // Allow flexibility for templates
		},
	}
);


