import { MODULE_ID } from '../consts';

// TODO: figure out how to make this type-safe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settings = (): any => game.settings as any;

type HexagonsSettingKey = 'lineColor' | 'fillColor' | 'lineWidth';

type HexagonsSettingValues = {
	lineColor: string;
	fillColor: string;
	lineWidth: number;
};

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
		settings().register(MODULE_ID, 'lineWidth', {
			name: 'Line Width',
			hint: 'Stroke width used for hex drawings.',
			scope: 'client',
			config: false,
			type: Number,
			default: 4,
		});
	},

	get<K extends HexagonsSettingKey>(key: K): HexagonsSettingValues[K] {
		return settings().get(MODULE_ID, key) as HexagonsSettingValues[K];
	},

	set<K extends HexagonsSettingKey>(key: K, value: HexagonsSettingValues[K]): void {
		settings().set(MODULE_ID, key, value);
	},
};
