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

export const SizeModifiers: Record<Size, number> = {
	[Size.F]: -8,
	[Size.D]: -4,
	[Size.T]: -2,
	[Size.S]: -1,
	[Size.M]: 0,
	[Size.L]: 1,
	[Size.H]: 2,
	[Size.G]: 4,
	[Size.C]: 8,
};
