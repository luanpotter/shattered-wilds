import { getApplicationV2Ctor, getHandlebarsApplicationMixin, getActorById, getUI } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { CharacterSheet, Resource, StatType } from '@shattered-wilds/commons';

export interface SWCharacterAppOptions {
	actorId: string;
}

export class SWCharacterApp {
	static isSupported(): boolean {
		return Boolean(getApplicationV2Ctor() && getHandlebarsApplicationMixin());
	}
}

// Build the concrete class using Foundry's V2 mixin API only if available
const AppV2 = getApplicationV2Ctor();
const HbsMixin = getHandlebarsApplicationMixin();

let SWCharacterAppImpl: unknown;

if (AppV2 && HbsMixin) {
	type DefaultOptions = Record<string, unknown>;
	type HandlebarsBase = new (options?: DefaultOptions) => {
		// Methods provided by the mixin contract
		render: (force?: boolean) => unknown;
		_preloadTemplates?: () => Promise<unknown>;
	};
	interface BaseWithDefaults {
		DEFAULT_OPTIONS?: DefaultOptions;
	}

	const Mixed = HbsMixin(AppV2) as unknown as HandlebarsBase & BaseWithDefaults;

	class Impl extends (Mixed as unknown as new (options?: DefaultOptions) => InstanceType<typeof Mixed>) {
		#actorId: string;

		constructor(options: SWCharacterAppOptions) {
			super({ window: { title: 'Shattered Wilds' }, ...options } as DefaultOptions);
			this.#actorId = options.actorId;
		}

		static get DEFAULT_OPTIONS() {
			const base = (Mixed as BaseWithDefaults).DEFAULT_OPTIONS ?? {};
			return { ...base, window: { title: 'Shattered Wilds' } } as DefaultOptions;
		}

		static PARTS = {
			content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
		};

		async _prepareContext(): Promise<Record<string, unknown>> {
			const actor = getActorById(this.#actorId) ?? { id: this.#actorId, name: 'Unknown', flags: {} };

			// Get the raw props from flags
			const flags = actor.flags as Record<string, unknown> | undefined;
			const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
			const props = swFlags?.props ?? {};

			// Use CharacterSheet.from to get computed character data
			let characterSheet: CharacterSheet | undefined;
			const resources: Record<string, { current: number; max: number }> = {};
			const stats: Record<string, number> = {};

			try {
				if (Object.keys(props).length > 0) {
					characterSheet = CharacterSheet.from(props);

					// Prepare resources data for template
					Object.values(Resource).forEach(resource => {
						resources[resource] = characterSheet!.getResource(resource);
					});

					// Prepare stats data for template
					const statTree = characterSheet.getStatTree();
					StatType.values.forEach(statType => {
						const computed = statTree.getModifier(statType);
						stats[statType.name] = computed.value.value;
					});
				}
			} catch (err) {
				console.warn('Failed to create CharacterSheet from props:', err);
			}

			return {
				actor,
				flags: actor.flags ?? {},
				props,
				characterSheet,
				resources,
				stats,
			};
		}

		async _onRender(): Promise<void> {
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (!root) return;
			const importBtn = root.querySelector('[data-action="sw-import"]') as HTMLButtonElement | null;
			if (importBtn) {
				importBtn.addEventListener('click', async () => {
					const actor = getActorById(this.#actorId) as unknown as {
						setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
					};
					if (!actor?.setFlag) return getUI().notifications?.warn('Actor not found');
					await importActorPropsFromShareString(actor);
					// Re-render the app to show updated data
					(this as unknown as { render: (force?: boolean) => void }).render(false);
				});
			}
			const exportBtn = root.querySelector('[data-action="sw-export"]') as HTMLButtonElement | null;
			if (exportBtn) {
				exportBtn.addEventListener('click', async () => {
					const actor = getActorById(this.#actorId) as unknown as { flags?: Record<string, unknown> };
					if (!actor) return getUI().notifications?.warn('Actor not found');
					const share = exportActorPropsToShareString(actor as { flags?: Record<string, unknown> });
					await navigator.clipboard.writeText(share);
					getUI().notifications?.info('Share string copied to clipboard');
				});
			}
		}
	}

	SWCharacterAppImpl = Impl;
}

export function newSWCharacterApp(opts: SWCharacterAppOptions): unknown {
	if (!SWCharacterApp.isSupported()) throw new Error('ApplicationV2 is not available in this core build.');
	const Ctor = SWCharacterAppImpl as { new (opts: SWCharacterAppOptions): unknown };
	return new Ctor(opts);
}
