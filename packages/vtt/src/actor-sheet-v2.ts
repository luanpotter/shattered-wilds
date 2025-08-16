import { getActorSheetV2, getActorById, getUI, getHandlebarsApplicationMixin } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import {
	CharacterSheet,
	Resource,
	StatType,
	StatNode,
	NodeStatModifier,
	CircumstanceModifier,
} from '@shattered-wilds/commons';

const V2Base = getActorSheetV2();
const HbsMixin = getHandlebarsApplicationMixin();

if (!V2Base || !HbsMixin) {
	throw new Error('V2 ActorSheet or HandlebarsApplicationMixin not available');
}

// Create the mixed base class using HandlebarsApplicationMixin
const MixedBase = HbsMixin(V2Base) as unknown as (new (...args: unknown[]) => object) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
};

export class SWActorSheetV2 extends (MixedBase as new (...args: unknown[]) => object) {
	#actorId: string | undefined;

	static get DEFAULT_OPTIONS() {
		const base = (MixedBase as { DEFAULT_OPTIONS?: Record<string, unknown> }).DEFAULT_OPTIONS ?? {};
		return { ...base, window: { title: 'Shattered Wilds' } } as Record<string, unknown>;
	}

	static PARTS = {
		content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
	};

	async _prepareContext(): Promise<Record<string, unknown>> {
		const actorLike = (this as unknown as { actor?: { id?: string } }).actor;
		this.#actorId = actorLike?.id;
		const actor = (this.#actorId && getActorById(this.#actorId)) || { id: this.#actorId, name: 'Unknown', flags: {} };

		// Get the raw props from flags
		const flags = actor.flags as Record<string, unknown> | undefined;
		const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
		const props = swFlags?.props ?? {};

		// Use CharacterSheet.from to get computed character data
		let characterSheet: CharacterSheet | undefined;
		const resources: Record<string, { current: number; max: number }> = {};
		let statTreeData: unknown = null;

		try {
			if (Object.keys(props).length > 0) {
				characterSheet = CharacterSheet.from(props);

				// Prepare resources data for template
				Object.values(Resource).forEach(resource => {
					resources[resource] = characterSheet!.getResource(resource);
				});

				// Prepare stat tree data for template
				const statTree = characterSheet.getStatTree();
				const prepareNodeData = (node: StatNode, modifier: NodeStatModifier) => {
					const tooltip = modifier.appliedModifiers.map((mod: CircumstanceModifier) => mod.description);

					// Check for warnings: level capping OR unallocated points
					const hasLevelCapWarning = modifier.wasLevelCapped;
					const hasUnallocatedPointsWarning = node.childrenHaveUnallocatedPoints;
					const hasWarning = hasLevelCapWarning || hasUnallocatedPointsWarning;

					// Add warning-specific tooltip information
					if (hasLevelCapWarning) {
						tooltip.push(
							`This stat was capped from ${modifier.baseValuePreCap.description} to ${modifier.baseValue.description}.`,
						);
					}
					if (hasUnallocatedPointsWarning) {
						if (node.hasUnallocatedPoints) {
							tooltip.push(
								`Contains ${node.unallocatedPoints} unallocated points.`,
								`${node.allocatedPoints} / ${node.allocatablePoints} points allocated.`,
							);
						} else {
							tooltip.push('Children contain unallocated points.');
						}
					}

					return {
						type: node.type,
						node,
						modifier,
						points: node.points,
						tooltip: tooltip.join('\n'),
						hasWarning,
						hasTooltip: tooltip.length > 0 || hasWarning,
					};
				};

				statTreeData = {
					level: prepareNodeData(statTree.root, statTree.getNodeModifier(statTree.root)),
					realms: [StatType.Body, StatType.Mind, StatType.Soul].map(realmType => {
						const realmNode = statTree.getNode(realmType);
						const realmModifier = statTree.getNodeModifier(realmNode);
						return {
							...prepareNodeData(realmNode, realmModifier),
							attributes: realmNode.children.map(attrNode => {
								const attrModifier = statTree.getNodeModifier(attrNode);
								return {
									...prepareNodeData(attrNode, attrModifier),
									skills: attrNode.children.map(skillNode => {
										const skillModifier = statTree.getNodeModifier(skillNode);
										return prepareNodeData(skillNode, skillModifier);
									}),
								};
							}),
						};
					}),
				};
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
			statTreeData,
		};
	}

	async _onRender(): Promise<void> {
		const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
		if (!root || !this.#actorId) return;
		const importBtn = root.querySelector('[data-action="sw-import"]') as HTMLButtonElement | null;
		if (importBtn) {
			importBtn.addEventListener('click', async () => {
				const actor = getActorById(this.#actorId!) as unknown as {
					setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
				};
				if (!actor?.setFlag) return getUI().notifications?.warn('Actor not found');
				await importActorPropsFromShareString(actor);
				// Re-render the sheet to show updated data
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		}
		const exportBtn = root.querySelector('[data-action="sw-export"]') as HTMLButtonElement | null;
		if (exportBtn) {
			exportBtn.addEventListener('click', async () => {
				const actor = getActorById(this.#actorId!) as unknown as { flags?: Record<string, unknown> };
				if (!actor) return getUI().notifications?.warn('Actor not found');
				const share = exportActorPropsToShareString(actor as { flags?: Record<string, unknown> });
				await navigator.clipboard.writeText(share);
				getUI().notifications?.info('Share string copied to clipboard');
			});
		}
	}
}
