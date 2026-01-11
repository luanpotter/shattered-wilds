/**
 * Data generation definitions for d12 package
 * Add new data types here by calling generateDataType with the appropriate config.
 */

import { Fields } from './fields.js';
import { cleanGeneratedDir, generateDataType, generateIndex, generateLexicon } from './generator.js';

const { str, bonus, bool, enumField } = Fields;

const conditions = {
	key: 'conditions',
	exportName: 'CONDITIONS',
	className: 'ConditionDefinition',
	fields: [enumField('name', 'Condition', { key: true }), bool('ranked'), str('description')],
};

const covers = {
	key: 'covers',
	exportName: 'COVER_TYPES',
	className: 'PassiveCoverDefinition',
	fields: [enumField('type', 'PassiveCoverType', { key: true }), str('examples'), bonus('bonus')],
};

const types = [
	conditions, //
	covers, //
];

const main = () => {
	console.log('Generating data files...');
	cleanGeneratedDir();
	generateLexicon();
	for (const type of types) {
		generateDataType(type);
	}
	generateIndex(types.map(t => t.key));
	console.log('Done!');
};

main();
