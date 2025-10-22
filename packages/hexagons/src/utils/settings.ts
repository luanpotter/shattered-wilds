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
		settings().register(MODULE_ID, 'fillColor', {
			name: 'Fill Color',
			hint: 'Color used for hex paint fill.',
			scope: 'client',
			config: false,
			type: String,
			default: '#00aaff',
		});
	},

	get(key: 'lineColor' | 'fillColor'): string {
		return settings().get(MODULE_ID, key) as string;
	},

	set(key: 'lineColor' | 'fillColor', value: string): void {
		settings().set(MODULE_ID, key, value);
	},
};
