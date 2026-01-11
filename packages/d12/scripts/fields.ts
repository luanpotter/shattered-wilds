export interface FieldDescriptor {
	name: string;
	generate(value: unknown): string;
	import(): string | undefined;
}

export const escapeTemplateString = (str: string): string => {
	return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
};

export class StringFieldDescriptor implements FieldDescriptor {
	constructor(public name: string) {}

	generate(value: unknown): string {
		return `${this.name}: ${this.generateValue(value)}`;
	}

	generateValue(value: unknown): string {
		const escaped = escapeTemplateString(String(value).trim());
		return escaped.includes('\n') ? `\`${escaped}\`` : `'${escaped}'`;
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
