import * as tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';

export default tseslint.config(
	{
		ignores: ['dist', 'build', '**/_site', '**/node_modules', '**/.git'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parser: tseslint.parser,
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		files: ['**/*.{js,ts}'],
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			indent: 'off',
			'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			// use typescript-eslint/no-unused-vars instead
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error'],
		},
	},
);
