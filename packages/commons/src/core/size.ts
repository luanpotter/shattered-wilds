import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';

export enum Size {
	F = 'Fine',
	D = 'Diminutive',
	T = 'Tiny',
	S = 'Small',
	M = 'Medium',
	L = 'Large',
	H = 'Huge',
	G = 'Gargantuan',
	C = 'Colossal',
}

const build = (size: Size, value: number): CircumstanceModifier => {
	return new CircumstanceModifier({
		source: ModifierSource.Size,
		name: size,
		value,
	});
};

export const SizeModifiers: Record<Size, CircumstanceModifier> = {
	[Size.F]: build(Size.F, -8),
	[Size.D]: build(Size.D, -4),
	[Size.T]: build(Size.T, -2),
	[Size.S]: build(Size.S, -1),
	[Size.M]: build(Size.M, 0),
	[Size.L]: build(Size.L, 1),
	[Size.H]: build(Size.H, 2),
	[Size.G]: build(Size.G, 4),
	[Size.C]: build(Size.C, 8),
};
