import baseConfig from '../../eslint.config.ts';

import * as tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import a11yPlugin from 'eslint-plugin-jsx-a11y';
import * as importPlugin from 'eslint-plugin-import';

export default tseslint.config(
	...baseConfig,
	{
		ignores: ['dist/**/*'],
	},
	{
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-extra-non-null-assertion': 'error',
		},
	},
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: './tsconfig.app.json',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				document: 'readonly',
				window: 'readonly',
				React: 'readonly',
			},
		},
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'react-refresh': reactRefreshPlugin,
			'jsx-a11y': a11yPlugin,
			import: importPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			// Disable base ESLint rule in favor of TypeScript version
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error'],

			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			...a11yPlugin.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off',
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'import/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
					'newlines-between': 'always',
					alphabetize: { order: 'asc', caseInsensitive: true },
				},
			],
			'jsx-a11y/no-static-element-interactions': 'off',
		},
	},
	{
		files: ['*.ts'],
		ignores: ['src/**/*.ts', 'src/**/*.tsx', 'eslint.config.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: './tsconfig.node.json',
			},
		},
		rules: {},
	}
);
