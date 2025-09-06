import { Resource, StatType } from '@shattered-wilds/commons';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { parseCharacterSheet } from './characters.js';
import { getActorById, getApplicationV2Ctor, getHandlebarsApplicationMixin, showNotification } from './foundry-shim.js';

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
			const actor = getActorById(this.#actorId);
			const characterSheet = actor ? parseCharacterSheet(actor) : undefined;

			const resources: Record<string, { current: number; max: number }> = {};
			let statTreeData: unknown = null;

			try {
				if (characterSheet) {
					// Prepare resources data for template
					Object.values(Resource).forEach(resource => {
						resources[resource] = characterSheet!.getResource(resource);
					});

					// Prepare stat tree data for template
					const statTree = characterSheet.getStatTree();
					statTreeData = {
						level: {
							node: statTree.root,
							modifier: statTree.getNodeModifier(statTree.root),
							points: statTree.root.points,
						},
						realms: [StatType.Body, StatType.Mind, StatType.Soul].map(realmType => {
							const realmNode = statTree.getNode(realmType);
							return {
								type: realmType,
								node: realmNode,
								modifier: statTree.getNodeModifier(realmNode),
								points: realmNode.points,
								attributes: realmNode.children.map(attrNode => ({
									type: attrNode.type,
									node: attrNode,
									modifier: statTree.getNodeModifier(attrNode),
									points: attrNode.points,
									skills: attrNode.children.map(skillNode => ({
										type: skillNode.type,
										node: skillNode,
										modifier: statTree.getNodeModifier(skillNode),
										points: skillNode.points,
									})),
								})),
							};
						}),
					};
				}
			} catch (err) {
				console.warn('Failed to create CharacterSheet from props:', err);
			}

			return {
				actor,
				flags: actor?.flags ?? {},
				characterSheet,
				resources,
				statTreeData,
			};
		}

		async _onRender(): Promise<void> {
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (!root) return;
			const importBtn = root.querySelector('[data-action="sw-import"]') as HTMLButtonElement | null;
			if (importBtn) {
				importBtn.addEventListener('click', async () => {
					const actor = getActorById(this.#actorId);
					if (!actor) {
						return showNotification('warn', 'Actor not found');
					}

					await importActorPropsFromShareString(actor);
					// Re-render the app to show updated data
					(this as unknown as { render: (force?: boolean) => void }).render(false);
				});
			}
			const exportBtn = root.querySelector('[data-action="sw-export"]') as HTMLButtonElement | null;
			if (exportBtn) {
				exportBtn.addEventListener('click', async () => {
					const actor = getActorById(this.#actorId);
					if (!actor) {
						return showNotification('warn', 'Actor not found');
					}

					const shareString = exportActorPropsToShareString(actor);
					await navigator.clipboard.writeText(shareString);

					showNotification('info', 'Share string copied to clipboard');
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
