import { Resource, StatType } from '@shattered-wilds/commons';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { parseCharacterSheet } from './characters.js';
import { getActorById, createHandlebarsApplicationBase, showNotification } from './foundry-shim.js';

export interface SWCharacterAppOptions {
	actorId: string;
}

const HandlebarsAppBase = createHandlebarsApplicationBase();

class SWCharacterAppImpl extends HandlebarsAppBase {
	#actorId: string;

	constructor(options: SWCharacterAppOptions) {
		super({ window: { title: 'Shattered Wilds' }, ...options });
		this.#actorId = options.actorId;
	}

	static override get DEFAULT_OPTIONS() {
		return { window: { title: 'Shattered Wilds' } };
	}

	static PARTS = {
		content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
	};

	override async _prepareContext(): Promise<Record<string, unknown>> {
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

	override async _onRender(): Promise<void> {
		const root = this.element;
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
				this.render(false);
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

export function newSWCharacterApp(opts: SWCharacterAppOptions): SWCharacterAppImpl {
	return new SWCharacterAppImpl(opts);
}

export class SWCharacterApp {
	static open(opts: SWCharacterAppOptions): SWCharacterAppImpl {
		const app = new SWCharacterAppImpl(opts);
		app.render(true);
		return app;
	}
}
