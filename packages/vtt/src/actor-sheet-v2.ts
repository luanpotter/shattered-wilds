import {
	getActorSheetV2,
	getActorById,
	getUI,
	getHandlebarsApplicationMixin,
	confirmAction,
	getRollCtor,
	getChatMessage,
	type FoundryRoll,
} from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { DiceRollModal, type DiceRollData } from './dice-modal.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { getActorData, getCharacterProps, ensureActorDataPersistence, type ActorLike } from './actor-data-manager.js';
import {
	CharacterSheet,
	Resource,
	RESOURCES,
	CurrentResources,
	StatType,
	StatNode,
	NodeStatModifier,
	CircumstanceModifier,
	FeatsSection,
	DerivedStatType,
} from '@shattered-wilds/commons';

// Helper function to sync resources to actor system data for token bars
async function syncResourcesToSystemData(actor: unknown, characterSheet: CharacterSheet): Promise<void> {
	try {
		const resourceData: Record<string, { value: number; max: number }> = {};

		// Map our resources to the system data structure
		const resourceMapping = {
			hp: Resource.HeroismPoint,
			vp: Resource.VitalityPoint,
			fp: Resource.FocusPoint,
			sp: Resource.SpiritPoint,
			ap: Resource.ActionPoint,
		};

		// Get current resource values from character sheet
		for (const [systemKey, resourceEnum] of Object.entries(resourceMapping)) {
			const resourceInfo = characterSheet.getResource(resourceEnum);
			resourceData[systemKey] = {
				value: resourceInfo.current,
				max: resourceInfo.max,
			};
		}

		// Type check and update actor system data if it has changed
		const actorWithSystem = actor as {
			system?: { resources?: Record<string, { value: number; max: number }> };
			update?: (data: Record<string, unknown>) => Promise<unknown>;
		};
		const currentSystemData = actorWithSystem.system?.resources || {};
		let needsUpdate = false;

		for (const [key, data] of Object.entries(resourceData)) {
			const current = currentSystemData[key];
			if (!current || current.value !== data.value || current.max !== data.max) {
				needsUpdate = true;
				break;
			}
		}

		if (needsUpdate && actorWithSystem.update) {
			await actorWithSystem.update({
				'system.resources': resourceData,
			});
		}
	} catch (err) {
		console.warn('Failed to sync resources to system data:', err);
	}
}

const V2Base = getActorSheetV2();
const HbsMixin = getHandlebarsApplicationMixin();

if (!V2Base || !HbsMixin) {
	throw new Error('V2 ActorSheet or HandlebarsApplicationMixin not available');
}

// Text processing helper for feat descriptions
function processDescriptionText(text: string): string {
	if (!text) return '';

	let processed = text;

	// First, protect code blocks from other processing
	const codeBlocks: string[] = [];
	processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
		const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
		codeBlocks.push(code);
		return placeholder;
	});

	// Process wiki links: [[Link Text]] or [[Link Text | Display Text]]
	// Keep original case for display, create slug properly for URL
	processed = processed.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_match, linkText, _, displayText) => {
		const display = displayText ? displayText.trim() : linkText.trim();
		// Create slug: preserve case but replace spaces with underscores, no lowercasing
		const slug = linkText.trim().replace(/\s+/g, '_');
		return `<a href="https://d12.nexus/wiki/${slug}" target="_blank" rel="noopener">${display}</a>`;
	});

	// Process basic markdown - be more careful with underscores to avoid conflicts
	// Bold: **text** only (avoid __ to prevent conflicts with slugs)
	processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

	// Italic: *text* only (avoid _ to prevent conflicts with slugs)
	processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

	// Restore code blocks with proper inline styling
	codeBlocks.forEach((code, index) => {
		const placeholder = `__CODE_BLOCK_${index}__`;
		processed = processed.replace(placeholder, `<code>${code}</code>`);
	});

	// Line breaks
	processed = processed.replace(/\n/g, '<br>');

	return processed;
}

// Create the mixed base class using HandlebarsApplicationMixin
const MixedBase = HbsMixin(V2Base) as unknown as (new (...args: unknown[]) => object) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
};

export class SWActorSheetV2 extends (MixedBase as new (...args: unknown[]) => object) {
	// Remove cached actor ID - always get from context to prevent cross-contamination
	#activeTab: string = 'stats'; // Store the current active tab

	// Helper to get current actor from context (never cache!)
	private getCurrentActor(): { id?: string; name?: string; flags?: Record<string, unknown> } | null {
		const actorLike = (this as unknown as { actor?: ActorLike }).actor;
		return actorLike || null;
	}

	private getCurrentActorId(): string | undefined {
		return this.getCurrentActor()?.id;
	}

	private getCharacterSheet(): CharacterSheet | undefined {
		const actor = this.getCurrentActor();
		if (!actor) return undefined;

		const rawProps = getCharacterProps(actor);
		const props = Object.fromEntries(
			Object.entries(rawProps).map(([key, value]) => {
				if (key.startsWith('feat_')) {
					// Convert feat_1_Minor_0 back to feat.1.Minor.0
					const transformedKey = key.replace(/^feat_(\d+)_(\w+)_(\d+)$/, 'feat.$1.$2.$3');
					return [transformedKey, value];
				}
				return [key, value];
			}),
		);

		try {
			if (Object.keys(props).length > 0) {
				return CharacterSheet.from(props);
			}
		} catch (err) {
			console.warn('Failed to create CharacterSheet:', err);
		}
		return undefined;
	}

	constructor(...args: unknown[]) {
		super(...args);
		// Register Handlebars helpers
		this.registerHelper('processDescription', processDescriptionText as (...args: unknown[]) => unknown);
		this.registerHelper('eq', (a: unknown, b: unknown) => a === b);
	}

	private registerHelper(name: string, fn: (...args: unknown[]) => unknown) {
		const Handlebars = (
			globalThis as unknown as {
				Handlebars?: { registerHelper(name: string, fn: (...args: unknown[]) => unknown): void };
			}
		).Handlebars;
		if (Handlebars) {
			Handlebars.registerHelper(name, fn);
		}
	}

	static get DEFAULT_OPTIONS() {
		const base = (MixedBase as { DEFAULT_OPTIONS?: Record<string, unknown> }).DEFAULT_OPTIONS ?? {};
		return { ...base, window: { title: 'Shattered Wilds' } } as Record<string, unknown>;
	}

	static PARTS = {
		content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
	};

	async _prepareContext(): Promise<Record<string, unknown>> {
		const actorLike = (this as unknown as { actor?: ActorLike }).actor;
		const currentActorId = actorLike?.id;

		let actor: ActorLike | null = actorLike || null;
		if (!actor) {
			actor = getActorData(currentActorId);
		}
		if (!actor) {
			actor = { id: currentActorId || 'unknown', name: 'Unknown', flags: {} };
		}

		// Get character props using robust method with multiple fallbacks
		const rawProps = getCharacterProps(actor);

		// Ensure actor data persistence for future token creation
		if (actor && Object.keys(rawProps).length > 0) {
			await ensureActorDataPersistence(actor);
		}

		// Transform feat props back to expected format (dots instead of underscores)
		// During import, dots were sanitized to underscores, but CharacterSheet expects dots
		const props = Object.fromEntries(
			Object.entries(rawProps).map(([key, value]) => {
				if (key.startsWith('feat_')) {
					// Convert feat_1_Minor_0 back to feat.1.Minor.0
					const transformedKey = key.replace(/^feat_(\d+)_(\w+)_(\d+)$/, 'feat.$1.$2.$3');
					return [transformedKey, value];
				}
				return [key, value];
			}),
		);

		// Use CharacterSheet.from to get computed character data
		let characterSheet: CharacterSheet | undefined;
		const resources: Record<string, { current: number; max: number }> = {};
		let resourcesArray: Array<{ key: string; name: string; shortName: string; current: number; max: number }> = [];
		let statTreeData: unknown = null;

		try {
			if (Object.keys(props).length > 0) {
				characterSheet = CharacterSheet.from(props);

				// Configure default token bars (one-time setup)
				await configureDefaultTokenBars(actor);

				// Sync resources to actor system data for token bars
				await syncResourcesToSystemData(actor, characterSheet);

				// Prepare resources data for template
				Object.values(Resource).forEach(resource => {
					resources[resource] = characterSheet!.getResource(resource);
				});

				// Prepare resources array for compact display
				resourcesArray = Object.values(Resource).map(resource => {
					const resourceData = characterSheet!.getResource(resource);
					const definition = RESOURCES[resource];
					return {
						key: resource,
						name: definition.name,
						shortName: definition.shortName,
						current: resourceData.current,
						max: resourceData.max,
					};
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

		// Prepare derived stats data for template
		const derivedStatsData: Array<{
			key: string;
			name: string;
			value: string;
			description: string;
			clickable: boolean;
		}> = [];
		if (characterSheet) {
			const statTree = characterSheet.getStatTree();

			// Race (from character sheet)
			derivedStatsData.push({
				key: 'race',
				name: 'Race',
				value: characterSheet.race?.primaryRace || 'Unknown',
				description: `Character race: ${characterSheet.race?.primaryRace || 'Unknown'}`,
				clickable: false,
			});

			// Class (from character sheet)
			derivedStatsData.push({
				key: 'class',
				name: 'Class',
				value: characterSheet.characterClass?.characterClass || 'Unknown',
				description: `Character class: ${characterSheet.characterClass?.characterClass || 'Unknown'}`,
				clickable: false,
			});

			// Size (from character sheet)
			derivedStatsData.push({
				key: 'size',
				name: 'Size',
				value: characterSheet.size,
				description: `Character size: ${characterSheet.size}`,
				clickable: false,
			});

			// Movement (computed)
			const movement = statTree.getDistance(DerivedStatType.Movement);
			derivedStatsData.push({
				key: 'movement',
				name: 'Movement',
				value: movement.value.description,
				description: movement.description,
				clickable: false,
			});

			// Influence Range (computed)
			const influenceRange = statTree.getDistance(DerivedStatType.InfluenceRange);
			derivedStatsData.push({
				key: 'influenceRange',
				name: 'Influence Range',
				value: influenceRange.value.description,
				description: influenceRange.description,
				clickable: false,
			});

			// Initiative (computed and clickable)
			const initiative = statTree.getModifier(DerivedStatType.Initiative);
			derivedStatsData.push({
				key: 'initiative',
				name: 'Initiative',
				value: initiative.value.description,
				description: initiative.description,
				clickable: true,
			});
		}

		return {
			actor,
			flags: actor?.flags ?? {},
			props,
			characterSheet,
			resources,
			resourcesArray,
			derivedStatsData,
			statTreeData,
			featsData: this.prepareFeatsData(characterSheet),
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isFeatsTabActive: this.#activeTab === 'feats',
			isDebugTabActive: this.#activeTab === 'debug',
		};
	}

	prepareFeatsData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}
		try {
			const featsSection = FeatsSection.create(characterSheet);
			return {
				isEmpty: featsSection.isEmpty,
				warnings: featsSection.warnings,
				featsOrSlotsByLevel: featsSection.featsOrSlotsByLevel,
			};
		} catch (err) {
			console.warn('Failed to create feats section:', err);
			return null;
		}
	}

	async _onRender(): Promise<void> {
		const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
		const currentActorId = this.getCurrentActorId();
		if (!root || !currentActorId) return;

		// Restore tab state after re-render
		this.restoreTabState(root);
		const importBtn = root.querySelector('[data-action="sw-import"]') as HTMLButtonElement | null;
		if (importBtn) {
			importBtn.addEventListener('click', async () => {
				const actor = getActorById(currentActorId!) as unknown as {
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
				const actor = getActorById(currentActorId!) as unknown as { flags?: Record<string, unknown> };
				if (!actor) return getUI().notifications?.warn('Actor not found');
				const share = exportActorPropsToShareString(actor as { flags?: Record<string, unknown> });
				await navigator.clipboard.writeText(share);
				getUI().notifications?.info('Share string copied to clipboard');
			});
		}

		// Add resource change handlers
		const resourceBtns = root.querySelectorAll('[data-action="resource-change"]') as NodeListOf<HTMLButtonElement>;
		resourceBtns.forEach(btn => {
			btn.addEventListener('click', async () => {
				const resource = btn.dataset.resource as Resource;
				const delta = parseInt(btn.dataset.delta || '0');
				if (!resource || delta === 0) return;

				await this.handleResourceChange(resource, delta);
			});
		});

		// Add refill all resources handler
		const refillBtn = root.querySelector('[data-action="refill-resources"]') as HTMLButtonElement | null;
		if (refillBtn) {
			refillBtn.addEventListener('click', async () => {
				const confirmed = await confirmAction({
					title: 'Refill Resources',
					message: 'Are you sure you want to refill all resources to their maximum values?',
				});

				if (confirmed) {
					await this.handleRefillAllResources();
				}
			});
		}

		// Add stat roll handlers
		const statButtons = root.querySelectorAll('[data-action="roll-stat"]') as NodeListOf<HTMLElement>;
		statButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const statType = btn.dataset.statType;
				const modifier = parseInt(btn.dataset.modifier || '0');
				if (statType) {
					if (event.shiftKey) {
						// Shift+click does a quick roll
						await this.handleStatRoll(statType, modifier);
					} else {
						// Normal click opens the dice modal
						await this.handleStatRollModal(statType, modifier);
					}
				}
			});
		});

		// Add derived stat roll handlers (for initiative)
		const derivedStatButtons = root.querySelectorAll('[data-action="roll-derived-stat"]') as NodeListOf<HTMLElement>;
		derivedStatButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const derivedStatKey = btn.dataset.derivedStat;
				if (derivedStatKey === 'initiative') {
					// Initiative rolls use the initiative modifier
					const characterSheet = this.getCharacterSheet();
					if (characterSheet) {
						const initiative = characterSheet.getStatTree().getModifier(DerivedStatType.Initiative);
						if (event.shiftKey) {
							// Shift+click does a quick roll
							await this.handleStatRoll('initiative', initiative.value.value);
						} else {
							// Normal click opens the dice modal
							await this.handleStatRollModal('initiative', initiative.value.value);
						}
					}
				}
			});
		});

		// Add tab switching handlers
		const tabButtons = root.querySelectorAll('.tab-button') as NodeListOf<HTMLButtonElement>;
		tabButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				const tabId = btn.dataset.tab;
				if (!tabId) return;

				// Store the active tab state in the application instance
				this.#activeTab = tabId;

				// Update tab buttons immediately (for instant feedback)
				tabButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');

				// Update tab panels immediately (for instant feedback)
				const tabPanels = root.querySelectorAll('.tab-panel') as NodeListOf<HTMLElement>;
				tabPanels.forEach(panel => {
					panel.classList.remove('active');
					if (panel.dataset.tabPanel === tabId) {
						panel.classList.add('active');
					}
				});
			});
		});
	}

	private restoreTabState(root: HTMLElement): void {
		// Restore the active tab state from our stored value
		const tabButtons = root.querySelectorAll('.tab-button') as NodeListOf<HTMLButtonElement>;
		const tabPanels = root.querySelectorAll('.tab-panel') as NodeListOf<HTMLElement>;

		// Update tab buttons
		tabButtons.forEach(btn => {
			if (btn.dataset.tab === this.#activeTab) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});

		// Update tab panels
		tabPanels.forEach(panel => {
			if (panel.dataset.tabPanel === this.#activeTab) {
				panel.classList.add('active');
			} else {
				panel.classList.remove('active');
			}
		});
	}

	private async handleResourceChange(resource: Resource, delta: number): Promise<void> {
		const currentActorId = this.getCurrentActorId();
		const actor = getActorById(currentActorId!) as unknown as {
			flags?: Record<string, unknown>;
			setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
		};
		if (!actor?.setFlag) return getUI().notifications?.warn('Actor not found');

		// Get current props
		const flags = actor.flags as Record<string, unknown> | undefined;
		const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
		const props = swFlags?.props ?? {};

		try {
			// Create character sheet to use updateResource method
			const characterSheet = CharacterSheet.from(props);
			const oldResourceValue = characterSheet.getResource(resource);
			const newValue = characterSheet.updateResource(resource, delta);

			// Early exit if value didn't actually change
			if (oldResourceValue.current === newValue) {
				return;
			}

			// Update the resource value directly in the DOM first (for instant feedback)
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (root) {
				const resourceValueElement = root
					.querySelector(`[data-resource="${resource}"]`)
					?.closest('.resource-control')
					?.querySelector('.resource-value');
				if (resourceValueElement) {
					const updatedCharacterSheet = CharacterSheet.from({ ...props, [resource]: newValue.toString() });
					const updatedResourceInfo = updatedCharacterSheet.getResource(resource);
					resourceValueElement.textContent = `${updatedResourceInfo.current}/${updatedResourceInfo.max}`;
				}
			}

			// Update the actor's props with the new resource value (background operation)
			const updatedProps = { ...props, [resource]: newValue.toString() };
			await actor.setFlag('shattered-wilds', 'props', updatedProps);

			// Sync updated resources to system data for token bars
			const updatedCharacterSheet = CharacterSheet.from(updatedProps);
			await syncResourcesToSystemData(actor, updatedCharacterSheet);

			// DO NOT call render() here - we've already updated the DOM directly
			// getUI().notifications?.info(`${RESOURCES[resource].shortName} updated`);
		} catch (err) {
			console.error('Failed to update resource:', err);
			getUI().notifications?.error('Failed to update resource');
		}
	}

	private async handleRefillAllResources(): Promise<void> {
		const currentActorId = this.getCurrentActorId();
		const actor = getActorById(currentActorId!) as unknown as {
			flags?: Record<string, unknown>;
			setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
		};
		if (!actor?.setFlag) return getUI().notifications?.warn('Actor not found');

		// Get current props
		const flags = actor.flags as Record<string, unknown> | undefined;
		const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
		const props = swFlags?.props ?? {};

		try {
			// Update all resource values directly in the DOM first (for instant feedback)
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (root) {
				Object.values(Resource).forEach(resource => {
					const resourceValueElement = root
						.querySelector(`[data-resource="${resource}"]`)
						?.closest('.resource-control')
						?.querySelector('.resource-value');
					if (resourceValueElement) {
						resourceValueElement.textContent = `${CurrentResources.MAX_VALUE}/${CurrentResources.MAX_VALUE}`;
					}
				});
			}

			// Set all resources to maximum value
			const updatedProps = { ...props };
			Object.values(Resource).forEach(resource => {
				updatedProps[resource] = CurrentResources.MAX_VALUE.toString();
			});

			await actor.setFlag('shattered-wilds', 'props', updatedProps);

			// Sync updated resources to system data for token bars
			const characterSheet = CharacterSheet.from(updatedProps);
			await syncResourcesToSystemData(actor, characterSheet);

			// DO NOT call render() here - we've already updated the DOM directly
			getUI().notifications?.info('All resources refilled to maximum');
		} catch (err) {
			console.error('Failed to refill resources:', err);
			getUI().notifications?.error('Failed to refill resources');
		}
	}

	private async handleStatRoll(statType: string, modifier: number): Promise<void> {
		// Quick roll with default options
		const rollData: DiceRollData = {
			statType,
			modifier,
			useExtra: false,
			useLuck: false,
			extraAttribute: undefined,
			circumstanceModifier: 0,
			targetDC: undefined,
		};

		await this.executeEnhancedRoll(rollData);
	}

	private async handleStatRollModal(statType: string, modifier: number): Promise<void> {
		if (!DiceRollModal.isSupported()) {
			getUI().notifications?.warn('Dice modal not supported in this Foundry version');
			return this.handleStatRoll(statType, modifier);
		}

		await DiceRollModal.open({
			statType,
			modifier,
			actorId: this.getCurrentActorId()!,
			onRoll: async (rollData: DiceRollData) => {
				await this.executeEnhancedRoll(rollData);
			},
			onCancel: () => {
				// Nothing to do on cancel
			},
		});
	}

	private async executeEnhancedRoll(rollData: DiceRollData): Promise<void> {
		try {
			const { statType, modifier, useExtra, useLuck, circumstanceModifier, targetDC, extraAttribute } = rollData;

			// Get stat breakdown details
			const statBreakdown = this.getStatBreakdown(statType);

			// Build the base formula
			const totalModifier = modifier + circumstanceModifier;
			const formula = `2d12 + ${totalModifier}`;

			// Execute the roll using Foundry's dice system
			const roll = await getRollCtor().create(formula);
			await roll.evaluate();

			// Get extra dice values if needed
			const extraDice: { type: string; value: number; valid?: boolean; label?: string }[] = [];

			if (useExtra && extraAttribute) {
				const extraRoll = await getRollCtor().create('1d12');
				await extraRoll.evaluate();
				const extraRollValue = extraRoll.total;
				const extraValue = await this.getAttributeValue(extraAttribute);

				// Send the chat message for the extra die
				await extraRoll.toMessage({
					flavor: `<strong>Extra Die</strong> (${extraAttribute}: ${extraValue})`,
				});

				extraDice.push({
					type: 'extra',
					value: extraRollValue,
					valid: extraRollValue <= extraValue,
					label: `${extraAttribute} (${extraValue})`,
				});
			}

			if (useLuck) {
				const luckRoll = await getRollCtor().create('1d12');
				await luckRoll.evaluate();
				const luckRollValue = luckRoll.total;
				const fortuneValue = await this.getAttributeValue('Fortune');

				// Send the chat message for the luck die
				await luckRoll.toMessage({
					flavor: `<strong>Luck Die</strong> (Fortune: ${fortuneValue})`,
				});

				extraDice.push({
					type: 'luck',
					value: luckRollValue,
					valid: luckRollValue <= fortuneValue,
					label: `Luck (${fortuneValue})`,
				});
			}

			// Display the roll result
			let flavorText = `<strong>${statType} Check</strong><br>Rolling ${formula}`;
			if (circumstanceModifier !== 0) {
				const sign = circumstanceModifier > 0 ? '+' : '';
				flavorText += `<br>Circumstance Modifier: ${sign}${circumstanceModifier}`;
			}
			if (targetDC !== undefined) {
				flavorText += `<br>Target DC: ${targetDC}`;
			}

			await roll.toMessage({
				speaker: {
					alias: `${statType} Check`,
				},
				flavor: flavorText,
			});

			// Process Shattered Wilds specific mechanics with extra dice
			this.processEnhancedShatteredWildsRoll(roll, rollData, extraDice, statBreakdown);
		} catch (err) {
			console.error('Failed to roll dice:', err);
			getUI().notifications?.error('Failed to roll dice');
		}
	}

	private async getAttributeValue(attributeName: string): Promise<number> {
		const actor = getActorById(this.getCurrentActorId()!);
		const flags = actor?.flags as Record<string, unknown> | undefined;
		const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
		const props = swFlags?.props ?? {};

		try {
			if (Object.keys(props).length > 0) {
				const characterSheet = CharacterSheet.from(props);
				const statTree = characterSheet.getStatTree();
				const statType = Object.values(StatType).find(st => st.name === attributeName);

				if (statType) {
					const node = statTree.getNode(statType);
					const modifier = statTree.getNodeModifier(node);
					return modifier.value.value;
				}
			}
		} catch (err) {
			console.warn('Failed to get attribute value:', err);
		}

		return 0;
	}

	private processEnhancedShatteredWildsRoll(
		roll: FoundryRoll,
		rollData: DiceRollData,
		extraDice: { type: string; value: number; valid?: boolean; label?: string }[],
		statBreakdown: { baseValue: number; modifiers: Array<{ source: string; value: number }>; total: number } | null,
	): void {
		const baseDice = roll.terms[0]?.results || [];
		const baseValues = baseDice.map(d => d.result);

		// Include extra dice in the analysis
		const allDiceValues = [...baseValues, ...extraDice.map(d => d.value)];

		// Check for crit modifiers
		let critModifiers = 0;
		if (allDiceValues.includes(12)) critModifiers += 6;

		// Check for pairs
		const pairs = allDiceValues.filter(
			(val: number, i: number, arr: number[]) =>
				arr.indexOf(val) !== i && arr.filter((x: number) => x === val).length >= 2,
		);
		if (pairs.length > 0) critModifiers += 6;

		// Check for auto-fail (pair of 1s)
		const ones = allDiceValues.filter((v: number) => v === 1);
		const autoFail = ones.length >= 2;

		// Calculate final total
		const baseTotal = roll.total;
		const finalTotal = baseTotal + critModifiers;

		// Calculate success and shifts if DC is provided
		let success: boolean | undefined;
		let shifts = 0;

		if (!autoFail && rollData.targetDC !== undefined) {
			success = finalTotal >= rollData.targetDC;
			if (success) {
				const excess = finalTotal - rollData.targetDC;
				shifts = this.calculateShifts(excess);
			}
		}

		// Build enhanced mechanics message
		let mechanicsHtml = `<div class="shattered-wilds-mechanics" style="font-family: Arial; margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">`;

		// Show stat breakdown
		if (statBreakdown) {
			mechanicsHtml += `<div style="margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.1); border-radius: 3px;">`;
			mechanicsHtml += `<strong>${rollData.statType} Breakdown:</strong><br>`;
			mechanicsHtml += `• Base: ${statBreakdown.baseValue}`;

			if (statBreakdown.modifiers.length > 0) {
				for (const mod of statBreakdown.modifiers) {
					const sign = mod.value >= 0 ? '+' : '';
					mechanicsHtml += `<br>• ${mod.source}: ${sign}${mod.value}`;
				}
			}

			if (rollData.circumstanceModifier !== 0) {
				const sign = rollData.circumstanceModifier > 0 ? '+' : '';
				mechanicsHtml += `<br>• Circumstance: ${sign}${rollData.circumstanceModifier}`;
			}

			mechanicsHtml += `<br><strong>Total Modifier: ${statBreakdown.total + rollData.circumstanceModifier}</strong>`;
			mechanicsHtml += `</div>`;
		}

		// Show dice breakdown
		mechanicsHtml += `<div style="margin-bottom: 8px;">`;
		mechanicsHtml += `<strong>Base Dice:</strong> ${baseValues.join(', ')}`;

		if (extraDice.length > 0) {
			const extraLabels = extraDice.map(d => {
				const validText = d.valid !== undefined ? (d.valid ? '✓' : '✗') : '';
				return `${d.label}: ${d.value} ${validText}`;
			});
			mechanicsHtml += `<br><strong>Extra Dice:</strong> ${extraLabels.join(', ')}`;
		}
		mechanicsHtml += `</div>`;

		// Show mechanics
		if (autoFail) {
			mechanicsHtml += `<div style="color: #d32f2f; font-weight: bold; font-size: 1.1em;">🎲 AUTO FAIL</div>`;
			mechanicsHtml += `<div style="color: #666; font-size: 0.9em;">Rolled pair of 1s</div>`;
		} else {
			if (critModifiers > 0) {
				mechanicsHtml += `<div style="color: #f57c00; font-weight: bold;">🎲 Crit Modifiers: +${critModifiers}</div>`;
			}

			mechanicsHtml += `<div style="color: #2e7d32; font-weight: bold; font-size: 1.1em;">🎯 Final Total: ${finalTotal}</div>`;

			if (rollData.targetDC !== undefined) {
				const successText = success ? 'SUCCESS' : 'FAILURE';
				const successColor = success ? '#2e7d32' : '#d32f2f';
				mechanicsHtml += `<div style="color: ${successColor}; font-weight: bold; margin-top: 4px;">vs DC ${rollData.targetDC}: ${successText}</div>`;

				if (success && shifts > 0) {
					mechanicsHtml += `<div style="color: #ff6f00; font-weight: bold;">⚡ Shifts: ${shifts}</div>`;
				}
			}
		}

		mechanicsHtml += `</div>`;

		// Send the mechanics message
		getChatMessage().create({
			content: mechanicsHtml,
			speaker: {
				alias: `${rollData.statType} Check`,
			},
		});
	}

	private calculateShifts(excess: number): number {
		if (excess < 6) return 0;

		let shifts = 0;
		let threshold = 6;
		let gap = 6;

		while (excess >= threshold) {
			shifts++;
			threshold += gap;
			gap += 6;
		}

		return shifts;
	}

	private getStatBreakdown(
		statTypeName: string,
	): { baseValue: number; modifiers: Array<{ source: string; value: number }>; total: number } | null {
		try {
			const currentActorId = this.getCurrentActorId();
			const actor = (currentActorId && getActorById(currentActorId)) || {
				id: currentActorId,
				name: 'Unknown',
				flags: {},
			};

			// Get the raw props from flags
			const flags = actor.flags as Record<string, unknown> | undefined;
			const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
			const rawProps = swFlags?.props ?? {};

			// Transform feat props back to expected format
			const props = Object.fromEntries(
				Object.entries(rawProps).map(([key, value]) => {
					if (key.startsWith('feat_')) {
						const transformedKey = key.replace(/^feat_(\d+)_(\w+)_(\d+)$/, 'feat.$1.$2.$3');
						return [transformedKey, value];
					}
					return [key, value];
				}),
			);

			if (Object.keys(props).length === 0) return null;

			const characterSheet = CharacterSheet.from(props);
			const statTree = characterSheet.getStatTree();

			// Special handling for derived stats like initiative
			if (statTypeName === 'initiative') {
				const initiativeModifier = statTree.getModifier(DerivedStatType.Initiative);
				const awarenessNode = statTree.getNode(StatType.Awareness);
				const awarenessModifier = statTree.getNodeModifier(awarenessNode);
				const agilityNode = statTree.getNode(StatType.Agility);
				const agilityModifier = statTree.getNodeModifier(agilityNode);

				return {
					baseValue: 0, // Initiative has no base value, it's purely derived
					modifiers: [
						{
							source: 'Awareness',
							value: awarenessModifier.value.value,
						},
						{
							source: 'Agility',
							value: agilityModifier.value.value,
						},
					],
					total: initiativeModifier.value.value,
				};
			}

			const statType = StatType.values.find(st => st.name === statTypeName);

			if (!statType) return null;

			const node = statTree.getNode(statType);
			const nodeModifier = statTree.getNodeModifier(node);

			// Get the base value (points allocated)
			const baseValue = node.allocatedPoints;

			// Get all modifiers
			const modifiers: Array<{ source: string; value: number }> = [];

			// Add modifiers from the NodeStatModifier
			if (nodeModifier.appliedModifiers && nodeModifier.appliedModifiers.length > 0) {
				for (const modifier of nodeModifier.appliedModifiers) {
					if (modifier.source && modifier.value.value !== 0) {
						modifiers.push({
							source: `${modifier.source} ${modifier.name}`,
							value: modifier.value.value,
						});
					}
				}
			}

			return {
				baseValue,
				modifiers,
				total: nodeModifier.value.value,
			};
		} catch (err) {
			console.warn('Failed to get stat breakdown:', err);
			return null;
		}
	}
}
