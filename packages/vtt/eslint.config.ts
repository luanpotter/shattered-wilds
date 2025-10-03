import * as tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.ts';

export default tseslint.config(
	...baseConfig,
	{
		ignores: ['dist/**/*', 'build/**/*', 'templates/**/*']
	}
);


