import { DiceRoller, EntropyProvider } from '@shattered-wilds/d12';

const entropyProvider: EntropyProvider<void> = async (count: number) => ({
	values: Array.from({ length: count }, () => Math.floor(Math.random() * 12) + 1),
	context: undefined,
});

export const diceRoller = new DiceRoller(entropyProvider);
