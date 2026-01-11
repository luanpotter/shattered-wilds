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

/**
 * Escape a string for use in a TypeScript template literal
 */
const escapeTemplateString = (str: string): string =>
	str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

// Field type descriptors
type EnumFieldDescriptor = { type: 'enum'; name: string; enumName: string; key: boolean };
type FieldDescriptor =
	| { type: 'str'; name: string }
	| { type: 'bool'; name: string }
	| { type: 'num'; name: string }
	| EnumFieldDescriptor;

export const str = (name: string): FieldDescriptor => ({ type: 'str', name });
export const bool = (name: string): FieldDescriptor => ({ type: 'bool', name });
export const enumField = (name: string, enumName: string, options: { key?: boolean } = {}): FieldDescriptor => ({
	type: 'enum',
	name,
	enumName,
	key: options.key ?? false,
});

/**
 * Serialize a field value to TypeScript literal syntax
 */
const serializeField = (field: FieldDescriptor, value: unknown): string => {
	if (field.type === 'enum') {
		return `${field.enumName}.${(value as string).replace(/ /g, '')}`;
	}
	if (field.type === 'bool' || field.type === 'num') {
		return String(value);
	}
	// str
	const escaped = escapeTemplateString((value as string).trim());
	return escaped.includes('\n') ? `\`${escaped}\`` : `'${escaped}'`;
};

interface DataTypeConfig {
	key: string;
	exportName: string;
	className: string;
	imports: string[];
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

	// Find the enum field to use as the map key
	const keyField = config.fields.find((f): f is EnumFieldDescriptor => f.type === 'enum' && f.key);
	if (!keyField) {
		throw new Error(`No key enum field defined in config for ${config.key}`);
	}

	const entries = Object.values(items).map(entry => {
		const fields = config.fields
			.map(field => `\t\t${field.name}: ${serializeField(field, entry[field.name])}`)
			.join(',\n');

		const enumKey = (entry[keyField.name] as string).replace(/ /g, '');
		return `\t[${keyField.enumName}.${enumKey}]: new ${config.className}({\n${fields},\n\t})`;
	});

	// Collect all enum names and class name for imports
	const enumNames = config.fields.filter(f => f.type === 'enum').map(f => (f as { enumName: string }).enumName);
	const importSymbols = [...new Set([...enumNames, config.className])].join(', ');

	const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from data/${yamlFile} by scripts/generate-data.ts

${config.imports.map(imp => `import { ${importSymbols} } from '${imp}';`).join('\n')}

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

export const GENERATED_LEXICON: Record<string, string> = {};
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
		const escapedContent = escapeTemplateString(content);
		return `	'${slug}': \`${escapedContent}\``;
	});

	const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from docs/lexicon/*.md by scripts/generate-data.ts

export const GENERATED_LEXICON: Record<string, string> = {
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
