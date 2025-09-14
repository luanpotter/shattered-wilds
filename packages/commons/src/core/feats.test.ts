import { describe, it, expect } from 'vitest';
import { FEATS, FeatDefinition, FeatInfo } from './feats.js';

describe('FEATS parameter binding and hydration', () => {
	it('every feat can be hydrated', () => {
		const feats = Object.entries(FEATS) as Array<[string, FeatDefinition<string | void>]>;
		for (const [, def] of feats) {
			const param = def.parameter;

			if (param) {
				expect(typeof param.id).toBe('string');
				expect(param.id.length).toBeGreaterThan(0);
				expect(Array.isArray(param.values)).toBe(true);
				expect(param.values.length).toBeGreaterThan(0);

				for (const possibleValue of param.values) {
					const info = FeatInfo.hydrateFeatDefinition(def, { [param.id]: String(possibleValue) });
					expect(info.parameter).toBe(String(possibleValue));
					expect(info.feat).toBe(def);
				}
			} else {
				const info = FeatInfo.hydrateFeatDefinition(def, {});
				expect(info.parameter).toBeUndefined();
				expect(info.feat).toBe(def);
			}
		}
	});
});
