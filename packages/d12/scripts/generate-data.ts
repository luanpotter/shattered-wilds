/**
 * Data generation definitions for d12 package
 * Add new data types here by calling generateDataType with the appropriate config.
 */

import {
	bool,
	cleanGeneratedDir,
	enumField,
	generateDataType,
	generateIndex,
	generateLexicon,
	str,
} from './generator.js';

const conditions = {
	key: 'conditions',
	exportName: 'CONDITIONS',
	className: 'ConditionDefinition',
	imports: ['../core/conditions.js'],
	fields: [enumField('name', 'Condition', { key: true }), bool('ranked'), str('description')],
};

const types = [
	conditions, //
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
