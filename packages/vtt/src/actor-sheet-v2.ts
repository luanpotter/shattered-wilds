import { getActorSheetV2, getActorById, getUI, getHandlebarsApplicationMixin, confirmAction } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { DiceRollModal } from './dice-modal.js';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';
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
	Weapon,
	Armor,
	Shield,
	OtherItem,
	PRIMARY_WEAPON_TYPES,
} from '@shattered-wilds/commons';
import { parseCharacterSheet } from './characters.js';

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
	private getCurrentActor(): ActorLike | undefined {
		return (this as unknown as { actor?: ActorLike }).actor;
	}

	private getCurrentActorId(): string | undefined {
		return this.getCurrentActor()?.id;
	}

	private getCharacterSheet(): CharacterSheet | undefined {
		const actor = this.getCurrentActor();
		return actor ? parseCharacterSheet(actor) : undefined;
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
			equipmentData: this.prepareEquipmentData(characterSheet),
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isFeatsTabActive: this.#activeTab === 'feats',
			isEquipmentTabActive: this.#activeTab === 'equipment',
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

	prepareEquipmentData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}
		try {
			const equipment = characterSheet.equipment;
			if (!equipment || equipment.items.length === 0) {
				return { isEmpty: true, items: [] };
			}

			const items = equipment.items.map(item => {
				const baseItem = {
					name: item.name,
					description: item.displayText,
					traits: [],
				};

				if (item instanceof Weapon) {
					return {
						...baseItem,
						itemType: 'Weapon',
						headerDisplay: `<strong>${item.name}</strong> - ${item.description}`,
						traits: item.traits,
						weaponModes: item.modes.map(mode => {
							const weaponTypeDef = PRIMARY_WEAPON_TYPES[mode.type];
							return {
								type: mode.description,
								bonus: mode.bonus.description,
								bonusValue: mode.bonus.value,
								range: mode.range?.description,
								attackStat: weaponTypeDef.statType.name,
								primaryAttribute: `Primary: ${weaponTypeDef.statType.name}`,
							};
						}),
					};
				}

				if (item instanceof Armor) {
					return {
						...baseItem,
						itemType: 'Armor',
						headerDisplay: `<strong>${item.name}</strong> - ${item.description}`,
						traits: item.traits,
						armorInfo: {
							type: item.type,
							bonus: item.bonus.description,
							dexPenalty: item.dexPenalty.isNotZero ? item.dexPenalty.description : null,
						},
					};
				}

				if (item instanceof Shield) {
					return {
						...baseItem,
						itemType: 'Shield',
						headerDisplay: `<strong>${item.name}</strong> - ${item.description}`,
						traits: item.traits,
						shieldInfo: {
							type: item.type,
							bonus: item.bonus.description,
						},
					};
				}

				if (item instanceof OtherItem) {
					return {
						...baseItem,
						itemType: 'Other',
						headerDisplay: `<strong>${item.name}</strong> - ${item.details || 'Other equipment'}`,
						description: item.details || item.name,
					};
				}

				return {
					...baseItem,
					itemType: 'Unknown',
					headerDisplay: `<strong>${item.name}</strong> - Unknown equipment`,
				};
			});

			return {
				isEmpty: false,
				items,
			};
		} catch (err) {
			console.warn('Failed to prepare equipment data:', err);
			return { isEmpty: true, items: [] };
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

		// Add equipment toggle handlers
		const equipmentToggles = root.querySelectorAll('[data-action="toggle-equipment"]') as NodeListOf<HTMLElement>;
		equipmentToggles.forEach(toggle => {
			toggle.addEventListener('click', () => {
				const itemIndex = toggle.dataset.itemIndex;
				if (itemIndex === undefined) return;

				const itemElement = toggle.closest('.equipment-item');
				if (!itemElement) return;

				const detailsElement = itemElement.querySelector('.equipment-details') as HTMLElement;
				const iconElement = toggle.querySelector('.equipment-toggle-icon') as HTMLElement;

				if (detailsElement && iconElement) {
					const isVisible = detailsElement.style.display !== 'none';
					detailsElement.style.display = isVisible ? 'none' : 'block';
					iconElement.classList.toggle('fa-chevron-down', isVisible);
					iconElement.classList.toggle('fa-chevron-up', !isVisible);
				}
			});
		});

		// Add weapon attack roll handlers
		const weaponAttackButtons = root.querySelectorAll('[data-action="roll-weapon-attack"]') as NodeListOf<HTMLElement>;
		weaponAttackButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const weaponName = btn.dataset.weaponName;
				const modeType = btn.dataset.modeType;
				const modeBonus = parseInt(btn.dataset.modeBonus || '0');
				const attackStat = btn.dataset.attackStat;

				if (weaponName && modeType && attackStat) {
					if (event.shiftKey) {
						// Shift+click does a quick weapon attack roll
						await this.handleWeaponAttackRoll(weaponName, modeType, attackStat, modeBonus);
					} else {
						// Normal click opens the dice modal for weapon attack
						await this.handleWeaponAttackRollModal(weaponName, modeType, attackStat, modeBonus);
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
		// Quick roll with default options using centralized dice system
		const rollRequest: DiceRollRequest = {
			name: statType,
			characterName: this.getCharacterSheet()?.name ?? 'Unknown',
			modifiers: this.buildModifiersMap(statType, modifier, 0), // modifier + 0 circumstance
			extra: undefined,
			luck: undefined,
			targetDC: undefined,
		};

		await executeEnhancedRoll(rollRequest);
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
			// Modal handles rolling directly through centralized system now
			onCancel: () => {
				// Nothing to do on cancel
			},
		});
	}

	private buildModifiersMap(
		statType: string,
		_ignoredBaseModifier: number,
		circumstanceModifier: number,
	): Record<string, number> {
		const modifiers: Record<string, number> = {};

		// ALWAYS use the well-tested commons breakdown instead of the passed baseModifier
		const breakdown = this.getStatBreakdown(statType);
		if (breakdown) {
			// Add base points if any
			if (breakdown.baseValue > 0) {
				modifiers['Base'] = breakdown.baseValue;
			}

			// Add individual modifiers from the well-tested commons logic
			for (const mod of breakdown.modifiers) {
				modifiers[mod.source] = mod.value;
			}
		} else {
			// This should rarely happen - commons should always provide breakdown
			console.warn(`Failed to get stat breakdown for ${statType}, this shouldn't happen`);
		}

		// Add circumstance modifier if any
		if (circumstanceModifier !== 0) {
			modifiers['Circumstance'] = circumstanceModifier;
		}

		return modifiers;
	}

	private async handleWeaponAttackRoll(
		weaponName: string,
		modeType: string,
		attackStat: string,
		weaponBonus: number,
	): Promise<void> {
		// Quick weapon attack roll using centralized dice system - treat as stat check with weapon modifier
		const rollRequest: DiceRollRequest = {
			name: `${attackStat} Check`,
			characterName: this.getCharacterSheet()?.name ?? 'Unknown',
			modifiers: this.buildWeaponAttackModifiers(attackStat, weaponBonus, weaponName, modeType),
			extra: undefined,
			luck: undefined,
			targetDC: undefined,
		};

		await executeEnhancedRoll(rollRequest);
	}

	private async handleWeaponAttackRollModal(
		weaponName: string,
		modeType: string,
		attackStat: string,
		weaponBonus: number,
	): Promise<void> {
		if (!DiceRollModal.isSupported()) {
			getUI().notifications?.warn('Dice modal not supported in this Foundry version');
			return this.handleWeaponAttackRoll(weaponName, modeType, attackStat, weaponBonus);
		}

		// Get the total modifier for the weapon attack - treat as stat check
		const modifiers = this.buildWeaponAttackModifiers(attackStat, weaponBonus, weaponName, modeType);
		const totalModifier = Object.values(modifiers).reduce((sum: number, val: number) => sum + val, 0);

		await DiceRollModal.open({
			statType: attackStat, // Use the stat name instead of weapon name
			modifier: totalModifier,
			actorId: this.getCurrentActorId()!,
			onCancel: () => {
				// Nothing to do on cancel
			},
		});
	}

	private buildWeaponAttackModifiers(
		attackStat: string,
		weaponBonus: number,
		weaponName: string,
		modeType: string,
	): Record<string, number> {
		// Start with the stat's normal modifiers using the centralized breakdown
		const modifiers = this.buildModifiersMap(attackStat, 0, 0); // Get the stat's breakdown with no extra modifiers

		// Add weapon bonus as an equipment modifier
		if (weaponBonus !== 0) {
			modifiers[`${weaponName} (${modeType})`] = weaponBonus;
		}

		return modifiers;
	}

	private getStatBreakdown(
		statTypeName: string,
	): { baseValue: number; modifiers: Array<{ source: string; value: number }>; total: number } | undefined {
		try {
			const characterSheet = this.getCharacterSheet();
			if (!characterSheet) return undefined;

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

			if (!statType) return undefined;

			const node = statTree.getNode(statType);
			const nodeModifier = statTree.getNodeModifier(node);

			// Get the base value (points allocated)
			const baseValue = nodeModifier.baseValue.value;

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
			return undefined;
		}
	}
}
