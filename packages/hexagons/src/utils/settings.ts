import { MODULE_ID } from '../consts';

// TODO: figure out how to make this type-safe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settings = (): any => game.settings as any;

export const HexagonsSettings = {
	register(): void {
		settings().register(MODULE_ID, 'lineColor', {
			name: 'Line Color',
			hint: 'Color used for hex line drawing.',
			scope: 'client',
			config: false,
			type: String,
			default: '#ff8800',
		});
	},

	get(key: 'lineColor'): string {
		return settings().get(MODULE_ID, key) as string;
	},

	set(key: 'lineColor', value: string): void {
		settings().set(MODULE_ID, key, value);
	},
};
