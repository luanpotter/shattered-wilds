import * as tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';

export default tseslint.config(
	js.configs.recommended,
	// TODO(luan): enable ts rules across the board
	// ...tseslint.configs.recommended,
	{
		ignores: ['**/dist', '**/_site', '**/node_modules', '**/.git'],
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
	{
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: {
				...globals.node,
			},
		},
	},
);
