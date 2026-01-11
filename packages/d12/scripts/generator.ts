/**
 * Build-time code generation infrastructure for d12 package
 *
 * This module provides utilities to generate TypeScript source files from
 * YAML and Markdown data files at build time. This ensures:
 * - No runtime file loading needed
 * - Type-safe data access
 * - Single source of truth in human-friendly formats
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'js-yaml';
import { EnumFieldDescriptor, FieldDescriptor, StringFieldGenerator } from './fields';
import { filterInstanceOf } from '@shattered-wilds/commons';

const DATA_DIR = join(import.meta.dirname, '../data');
const DOCS_LEXICON_DIR = join(import.meta.dirname, '../../../docs/lexicon');
const GENERATED_DIR = join(import.meta.dirname, '../src/generated');

/**
 * Clean and recreate the generated directory
 */
export const cleanGeneratedDir = (): void => {
	if (existsSync(GENERATED_DIR)) {
		rmSync(GENERATED_DIR, { recursive: true });
	}
	mkdirSync(GENERATED_DIR, { recursive: true });
};

interface DataTypeConfig {
	key: string;
	exportName: string;
	className: string;
	fields: FieldDescriptor[];
}

/**
 * Generic data generator for enum-keyed types
 */
export const generateDataType = (config: DataTypeConfig): void => {
	const yamlFile = `${config.key}.yaml`;
	const yamlPath = join(DATA_DIR, yamlFile);
	if (!existsSync(yamlPath)) {
		console.log(`No ${yamlFile} found, skipping`);
		return;
	}

	const yamlContent = readFileSync(yamlPath, 'utf-8');
	const data = yaml.load(yamlContent) as Record<string, Record<string, Record<string, unknown>>>;
	const items = data[config.key];

	if (!items) {
		console.log(`No '${config.key}' key found in ${yamlFile}, skipping`);
		return;
	}

	const keyField = filterInstanceOf(config.fields, EnumFieldDescriptor).find(f => f.key);
	if (!keyField) {
		throw new Error(`No key enum field defined in config for ${config.key}`);
	}

	const entries = Object.values(items).map(entry => {
		const fields = config.fields
			.map(field => field.generate(entry[field.name]))
			.map(line => `\t\t${line}`)
			.join(',\n');
		const enumKey = (entry[keyField.name] as string).replace(/ /g, '');
		return `\t[${keyField.enumName}.${enumKey}]: new ${config.className}({\n${fields},\n\t})`;
	});

	const imports = [config.className, ...config.fields.map(f => f.import()).filter(item => item !== undefined)];

	const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from data/${yamlFile} by scripts/generate-data.ts

import { ${imports.join(', ')} } from '../types/types.js';

export const ${config.exportName}: Record<${keyField.enumName}, ${config.className}> = {
${entries.join(',\n')},
};
`;

	const outputFile = `${config.key}-data.ts`;
	writeFileSync(join(GENERATED_DIR, outputFile), output);
	console.log(`Generated ${outputFile}`);
};

/**
 * Generate lexicon data from Markdown files in docs/lexicon/
 */
export const generateLexicon = (): void => {
	if (!existsSync(DOCS_LEXICON_DIR)) {
		console.log('No docs/lexicon directory found, skipping lexicon generation');
		const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// No docs/lexicon directory found

export const LEXICON: Record<string, string> = {};
`;
		writeFileSync(join(GENERATED_DIR, 'lexicon.ts'), output);
		return;
	}

	const files = readdirSync(DOCS_LEXICON_DIR).filter(f => f.endsWith('.md'));
	if (files.length === 0) {
		console.log('No markdown files in lexicon, skipping');
		return;
	}

	const entries = files.map(file => {
		const slug = basename(file, '.md');
		const content = readFileSync(join(DOCS_LEXICON_DIR, file), 'utf-8').trim();
		return `\t${StringFieldGenerator.generate(slug, content)}`;
	});

	const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from docs/lexicon/*.md by scripts/generate-data.ts

export const LEXICON: Record<string, string> = {
${entries.join(',\n')},
};
`;

	writeFileSync(join(GENERATED_DIR, 'lexicon.ts'), output);
	console.log('Generated lexicon.ts with', files.length, 'entries');
};

/**
 * Generate the barrel export file
 */
export const generateIndex = (dataTypes: string[]): void => {
	const exports = [...dataTypes.map(t => `export * from './${t}-data.js';`), "export * from './lexicon.js';"].join(
		'\n',
	);

	const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Barrel export for all generated data

${exports}
`;

	writeFileSync(join(GENERATED_DIR, 'index.ts'), output);
	console.log('Generated index.ts');
};
