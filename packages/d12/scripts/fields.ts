export interface FieldDescriptor {
	name: string;
	generate(value: unknown): string;
	import(): string | undefined;
}

const safeWrapStringValue = (value: string): string => {
	const escapeTemplateString = (str: string): string => {
		return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
	};
	const tick = '`';

	return `${tick}${escapeTemplateString(String(value).trim())}${tick}`;
};

export const StringFieldGenerator = {
	generate(name: string, value: unknown): string {
		return `${name}: ${safeWrapStringValue(String(value))}`;
	},
};

export class StringFieldDescriptor implements FieldDescriptor {
	constructor(public name: string) {}

	generate(value: unknown): string {
		return StringFieldGenerator.generate(this.name, value);
	}

	import(): string | undefined {
		return undefined;
	}
}

export class NumberFieldDescriptor implements FieldDescriptor {
	constructor(public name: string) {}

	generate(value: unknown): string {
		return `${this.name}: ${Number(value)}`;
	}

	import(): string | undefined {
		return undefined;
	}
}

export class BooleanFieldDescriptor implements FieldDescriptor {
	constructor(public name: string) {}

	generate(value: unknown): string {
		return `${this.name}: ${Boolean(value)}`;
	}

	import(): string | undefined {
		return undefined;
	}
}

export class EnumFieldDescriptor implements FieldDescriptor {
	constructor(
		public name: string,
		public enumName: string,
		public key: boolean = false,
	) {}

	generate(value: unknown): string {
		return `${this.name}: ${this.enumName}.${String(value).replace(/ /g, '')}`;
	}

	import(): string | undefined {
		return this.enumName;
	}
}

export class BonusFieldDescriptor implements FieldDescriptor {
	constructor(public name: string) {}

	generate(value: unknown): string {
		return `${this.name}: Bonus.of(${Number(value)})`;
	}

	import(): string | undefined {
		return 'Bonus';
	}
}

export const Fields = {
	str: (name: string) => new StringFieldDescriptor(name),
	num: (name: string) => new NumberFieldDescriptor(name),
	bool: (name: string) => new BooleanFieldDescriptor(name),
	enumField: (name: string, enumName: string, { key = false }: { key: boolean }) =>
		new EnumFieldDescriptor(name, enumName, key),
	bonus: (name: string) => new BonusFieldDescriptor(name),
};
