import {
	getActorSheetV2,
	getActorById,
	getUI,
	getHandlebarsApplicationMixin,
	confirmAction,
	ActorLike,
} from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { DiceRollModal } from './dice-modal.js';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';
import { configureDefaultTokenBars } from './token-bars.js';
import {
	getActorData,
	ensureActorDataPersistence,
	getCharacterConditions,
	getCharacterProps,
} from './actor-data-manager.js';
import { ConsumeResourceModal } from './consume-resource-modal.js';
import {
	CharacterSheet,
	Resource,
	RESOURCES,
	StatType,
	StatNode,
	NodeStatModifier,
	CircumstanceModifier,
	FeatsSection,
	DerivedStatType,
	Weapon,
	WeaponMode,
	Armor,
	Shield,
	OtherItem,
	PRIMARY_WEAPON_TYPES,
	ACTIONS,
	Action,
	ActionDefinition,
	ActionType,
	ActionValueParameter,
	ActionCheckParameter,
	ActionValueUnit,
	Bonus,
	Distance,
	StandardCheck,
	PassiveCoverType,
	Trait,
	ModifierSource,
	COVER_TYPES,
	IncludeEquipmentModifier,
	Condition,
	CONDITIONS,
} from '@shattered-wilds/commons';
import { parseCharacterProps, parseCharacterSheet } from './characters.js';

function buildWeaponModesList(
	characterSheet: CharacterSheet,
): Array<{ index: number; label: string; weapon: Weapon | null; mode: WeaponMode | null }> {
	const equipment = characterSheet.equipment;
	const hasShield = equipment.items.some(item => item instanceof Shield);
	const weapons = equipment.items.filter(item => item instanceof Weapon) as Weapon[];

	const weaponModes: Array<{ index: number; label: string; weapon: Weapon | null; mode: WeaponMode | null }> = [
		{ index: 0, label: 'Unarmed', weapon: null, mode: null },
		...(hasShield ? [{ index: 1, label: 'Shield Bash', weapon: null, mode: null }] : []),
	];

	let currentIndex = hasShield ? 2 : 1;

	for (const weapon of weapons) {
		for (const mode of weapon.modes) {
			weaponModes.push({
				index: currentIndex++,
				label: `${weapon.name} - ${mode.description}`,
				weapon: weapon,
				mode: mode,
			});
		}
	}

	return weaponModes;
}

function computeStatType(
	statType: StatType | StandardCheck,
	actionsUIState?: Record<string, unknown>,
	characterSheet?: CharacterSheet,
): StatType {
	if (typeof statType === 'string' && Object.values(StandardCheck).includes(statType as StandardCheck)) {
		switch (statType as StandardCheck) {
			case StandardCheck.BodyAttack: {
				// Use selected weapon to determine STR vs DEX
				if (
					actionsUIState?.selectedWeaponIndex !== null &&
					actionsUIState?.selectedWeaponIndex !== undefined &&
					characterSheet
				) {
					const selectedIndex = actionsUIState.selectedWeaponIndex as number;
					const weaponModes = buildWeaponModesList(characterSheet);
					const selectedWeaponMode = weaponModes.find(w => w.index === selectedIndex);

					if (selectedWeaponMode?.mode) {
						return selectedWeaponMode.mode.statType; // This will be DEX for Light Melee, STR for Heavy Melee, etc.
					}
				}
				return StatType.STR; // Default to STR for body attacks when no weapon selected
			}
			case StandardCheck.Defense:
				// Use selected defense realm
				if (actionsUIState?.selectedDefenseRealm) {
					return actionsUIState.selectedDefenseRealm as StatType;
				}
				return StatType.Body; // Default to Body for defense
			default:
				return StatType.STR; // Fallback
		}
	}
	return statType as StatType;
}

function computeIncludedModifiers(
	includeModifierFor: string,
	characterSheet: CharacterSheet,
	actionsUIState: Record<string, unknown>,
): CircumstanceModifier[] {
	const equipment = characterSheet.equipment;

	switch (includeModifierFor) {
		case 'Weapon': {
			const modifiers: CircumstanceModifier[] = [];

			// Weapon modifier
			const selectedWeaponIndex = actionsUIState.selectedWeaponIndex as number | null;
			if (selectedWeaponIndex !== null && selectedWeaponIndex >= 0) {
				const weaponModes = buildWeaponModesList(characterSheet);
				const selectedWeaponMode = weaponModes.find(w => w.index === selectedWeaponIndex);

				if (selectedWeaponMode?.weapon && selectedWeaponMode?.mode) {
					const weapon = selectedWeaponMode.weapon;
					const mode = selectedWeaponMode.mode;

					const weaponModifier: CircumstanceModifier = {
						source: ModifierSource.Equipment,
						name: `${weapon.name} (${mode.description})`,
						description: `Weapon bonus from ${weapon.name} (${mode.description})`,
						value: mode.bonus,
					};
					modifiers.push(weaponModifier);

					// Range increment modifier for ranged weapons
					if (mode.rangeType === Trait.Ranged) {
						const selectedRange = actionsUIState.selectedRange as Distance | null;
						if (selectedRange && mode.range) {
							const rangeIncrements = Math.max(0, Math.floor((selectedRange.value - 1) / mode.range.value));
							if (rangeIncrements > 0) {
								const rangeModifier: CircumstanceModifier = {
									source: ModifierSource.Circumstance,
									name: `Range Increment Penalty`,
									description: `${rangeIncrements} range increment(s) penalty`,
									value: Bonus.of(rangeIncrements * -3),
								};
								modifiers.push(rangeModifier);
							}
						}
					}
				}
			}

			// Passive cover modifier
			const selectedPassiveCover = actionsUIState.selectedPassiveCover as PassiveCoverType;
			if (selectedPassiveCover && selectedPassiveCover !== PassiveCoverType.None) {
				const coverModifier = COVER_TYPES[selectedPassiveCover].modifier;
				if (coverModifier) {
					modifiers.push(coverModifier);
				}
			}

			// Height increments modifier
			const heightIncrements = actionsUIState.heightIncrements as string;
			if (heightIncrements) {
				const increments = parseInt(heightIncrements);
				if (!isNaN(increments) && increments !== 0) {
					const heightModifier: CircumstanceModifier = {
						source: ModifierSource.Circumstance,
						name: `Height Increments (${increments})`,
						description: `${increments} height increment(s) modifier`,
						value: Bonus.of(increments * -3),
					};
					modifiers.push(heightModifier);
				}
			}

			return modifiers;
		}
		case 'Armor': {
			// Armor only applies to Body defense
			const selectedDefenseRealm = actionsUIState.selectedDefenseRealm as StatType;
			if (selectedDefenseRealm?.name !== 'Body') return [];

			const selectedArmorIndex = actionsUIState.selectedArmor as number | null;
			if (selectedArmorIndex === null) return [];

			const armors = equipment.items.filter(item => item instanceof Armor) as Armor[];
			const armor = armors[selectedArmorIndex];

			if (armor) {
				return [armor.getEquipmentModifier()];
			}
			return [];
		}
		case 'Shield': {
			// Shield only applies to Body defense
			const selectedDefenseRealm = actionsUIState.selectedDefenseRealm as StatType;
			if (selectedDefenseRealm?.name !== 'Body') return [];

			const selectedShieldIndex = actionsUIState.selectedShield as number | null;
			if (selectedShieldIndex === null) return [];

			const shields = equipment.items.filter(item => item instanceof Shield) as Shield[];
			const shield = shields[selectedShieldIndex];

			if (shield) {
				return [shield.getEquipmentModifier()];
			}
			return [];
		}
		default:
			return [];
	}
}

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

const MixedBase = HbsMixin(V2Base) as unknown as (new (...args: unknown[]) => object) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
};

export class SWActorSheetV2 extends (MixedBase as new (...args: unknown[]) => object) {
	// Remove cached actor ID - always get from context to prevent cross-contamination
	#activeTab: string = 'stats'; // Store the current active tab

	// Actions-specific UI state
	#actionsUIState = {
		activeTab: ActionType.Movement as string,
		showAll: true,
		selectedRange: null as Distance | null,
		selectedDefenseRealm: StatType.Body as StatType,
		selectedPassiveCover: PassiveCoverType.None as PassiveCoverType,
		heightIncrements: '',
		selectedWeaponIndex: null as number | null, // Index in the flat weapon modes list
		selectedArmor: null as number | null,
		selectedShield: null as number | null,
	};

	#conditions = new Set<Condition>();
	#conditionsLoaded = false;

	private loadConditionsFromActor(): void {
		const actor = this.getCurrentActor();
		if (!actor) return;

		// Only load conditions once per sheet instance
		if (this.#conditionsLoaded) return;

		// Load from actor flags first
		const flagConditions = getCharacterConditions(actor);

		// Also check token status effects for initial sync
		const actorWithStatuses = actor as { statuses?: Set<string> } | undefined;
		const tokenConditions: Condition[] = [];

		if (actorWithStatuses?.statuses) {
			for (const statusId of actorWithStatuses.statuses) {
				if (statusId.startsWith('sw-')) {
					const conditionName = statusId
						.replace('sw-', '')
						.replace(/-/g, ' ')
						.replace(/\b\w/g, l => l.toUpperCase());
					const condition = Object.values(Condition).find(
						c => c === conditionName || c.toLowerCase().replace(/\s+/g, '-') === statusId.replace('sw-', ''),
					);
					if (condition) {
						tokenConditions.push(condition);
					}
				}
			}
		}

		// Use token conditions if they exist and differ from flags (token is source of truth)
		const conditionsToLoad = tokenConditions.length > 0 ? tokenConditions : flagConditions;

		this.#conditions.clear();
		conditionsToLoad.forEach(condition => this.#conditions.add(condition));
		this.#conditionsLoaded = true;

		// Sync flags if token had different conditions
		if (
			tokenConditions.length > 0 &&
			JSON.stringify([...tokenConditions].sort()) !== JSON.stringify(flagConditions.sort())
		) {
			this.saveConditionsToActor().catch(err => console.warn('Failed to sync token conditions to actor flags:', err));
		}
	}

	private async saveConditionsToActor(): Promise<void> {
		const actor = this.getCurrentActor() as
			| {
					flags?: Record<string, unknown>;
					setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
			  }
			| undefined;

		if (!actor?.setFlag) {
			console.warn('Cannot save conditions: actor not found or missing setFlag');
			return;
		}

		const conditionsArray = Array.from(this.#conditions);
		await actor.setFlag('shattered-wilds', 'conditions', conditionsArray);
		await this.syncConditionsToToken();
	}

	private async syncConditionsToToken(): Promise<void> {
		const actor = this.getCurrentActor() as
			| {
					token?: {
						document?: {
							update?: (data: Record<string, unknown>) => Promise<unknown>;
							actor?: {
								statuses?: Set<string>;
								toggleStatusEffect?: (statusId: string, options?: { active?: boolean }) => Promise<boolean>;
							};
						};
					};
					getActiveTokens?: () => Array<{
						document?: {
							update?: (data: Record<string, unknown>) => Promise<unknown>;
							actor?: {
								statuses?: Set<string>;
								toggleStatusEffect?: (statusId: string, options?: { active?: boolean }) => Promise<boolean>;
							};
						};
					}>;
					statuses?: Set<string>;
					toggleStatusEffect?: (statusId: string, options?: { active?: boolean }) => Promise<boolean>;
			  }
			| undefined;

		if (!actor) return;

		try {
			// Get all tokens for this actor
			const tokens = actor.getActiveTokens?.() || (actor.token?.document ? [actor.token] : []);

			// If no tokens, try to update actor directly
			const targets = tokens.length > 0 ? tokens.map(t => t.document?.actor || actor) : [actor];

			for (const target of targets) {
				if (!target?.toggleStatusEffect) continue;

				// Get current SW status effects on the token
				const currentStatuses = target.statuses || new Set<string>();
				const currentSWStatuses = new Set(Array.from(currentStatuses).filter(statusId => statusId.startsWith('sw-')));

				// Get desired SW status effects from current conditions
				const desiredSWStatuses = new Set(
					Array.from(this.#conditions).map(condition => `sw-${condition.toLowerCase().replace(/\s+/g, '-')}`),
				);

				// Find differences
				const statusesToRemove = Array.from(currentSWStatuses).filter(statusId => !desiredSWStatuses.has(statusId));
				const statusesToAdd = Array.from(desiredSWStatuses).filter(statusId => !currentSWStatuses.has(statusId));

				// Apply only the changes needed
				for (const statusId of statusesToRemove) {
					await target.toggleStatusEffect(statusId, { active: false });
				}

				for (const statusId of statusesToAdd) {
					await target.toggleStatusEffect(statusId, { active: true });
				}
			}
		} catch (err) {
			console.warn('Failed to sync conditions to token:', err);
		}
	}

	static registerStatusEffects(): void {
		const CONFIG = (globalThis as { CONFIG?: { statusEffects?: unknown[] } }).CONFIG;

		if (!CONFIG?.statusEffects) return;

		// Remove existing SW conditions to avoid duplicates
		CONFIG.statusEffects = (CONFIG.statusEffects as Array<{ id: string }>).filter(
			effect => !effect.id?.startsWith('sw-'),
		);

		// Define condition icon mapping using Foundry core icons
		const getConditionIcon = (condition: Condition): string => {
			const iconMap: Record<Condition, string> = {
				[Condition.Blessed]: 'icons/svg/angel.svg',
				[Condition.Blinded]: 'icons/svg/blind.svg',
				[Condition.Distracted]: 'icons/svg/daze.svg',
				[Condition.Distraught]: 'icons/svg/cursed.svg', // Using cursed for distraught (emotional/spiritual turmoil)
				[Condition.Frightened]: 'icons/svg/terror.svg',
				[Condition.Immobilized]: 'icons/svg/net.svg',
				[Condition.Incapacitated]: 'icons/svg/skull.svg',
				[Condition.OffGuard]: 'icons/svg/downgrade.svg',
				[Condition.Prone]: 'icons/svg/falling.svg',
				[Condition.Silenced]: 'icons/svg/silenced.svg',
				[Condition.Unconscious]: 'icons/svg/unconscious.svg',
			};
			return iconMap[condition] || 'icons/svg/aura.svg';
		};

		// Add our conditions as status effects
		const conditionEffects = Object.values(Condition).map(condition => ({
			id: `sw-${condition.toLowerCase().replace(/\s+/g, '-')}`,
			name: condition,
			icon: getConditionIcon(condition),
			description: CONDITIONS[condition].description,
		}));

		CONFIG.statusEffects.push(...conditionEffects);
	}

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

		const actor = actorLike || getActorData(currentActorId);

		// Get character props using robust method with multiple fallbacks
		const props = actor ? parseCharacterProps(actor) : {};
		const characterSheet = actor ? parseCharacterSheet(actor) : undefined;

		// Ensure actor data persistence for future token creation
		if (actor && !characterSheet) {
			await ensureActorDataPersistence(actor);
		}

		// Use centralized character parsing logic
		const resources: Record<string, { current: number; max: number }> = {};
		let resourcesArray: Array<{ key: string; name: string; shortName: string; current: number; max: number }> = [];
		let statTreeData: unknown = null;

		try {
			if (characterSheet) {
				// Configure default token bars (one-time setup)
				await configureDefaultTokenBars(actor);

				// Sync resources to actor system data for token bars
				await syncResourcesToSystemData(actor, characterSheet);

				// Load conditions from actor
				this.loadConditionsFromActor();

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
			characterSheet,
			props,
			resources,
			resourcesArray,
			conditionsData: this.prepareConditionsData(),
			derivedStatsData,
			statTreeData,
			featsData: this.prepareFeatsData(characterSheet),
			equipmentData: this.prepareEquipmentData(characterSheet),
			actionsData: this.prepareActionsData(characterSheet),
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isFeatsTabActive: this.#activeTab === 'feats',
			isEquipmentTabActive: this.#activeTab === 'equipment',
			isActionsTabActive: this.#activeTab === 'actions',
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

	prepareActionsData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}

		try {
			// Prepare action types as tabs
			const actionTypes = Object.values(ActionType);
			const actionTabs = actionTypes.map(type => ({
				key: type,
				label: type,
				icon: this.getActionTypeIcon(type),
				active: this.#actionsUIState.activeTab === type,
				actions: this.prepareActionsForType(type, characterSheet),
				header: this.getActionTypeHeader(type, characterSheet),
			}));

			return {
				showAll: this.#actionsUIState.showAll,
				tabs: actionTabs,
				uiState: this.#actionsUIState,
			};
		} catch (err) {
			console.warn('Failed to prepare actions data:', err);
			return null;
		}
	}

	private getActionTypeIcon(type: ActionType): string {
		switch (type) {
			case ActionType.Movement:
				return 'fas fa-running';
			case ActionType.Attack:
				return 'fas fa-fist-raised';
			case ActionType.Defense:
				return 'fas fa-shield';
			case ActionType.Support:
				return 'fas fa-hand-holding';
			case ActionType.Heroic:
				return 'fas fa-star';
			case ActionType.Meta:
				return 'fas fa-cog';
			default:
				return 'fas fa-star';
		}
	}

	private prepareActionsForType(type: ActionType, characterSheet: CharacterSheet): unknown[] {
		let actions = Object.values(ACTIONS).filter(action => action.type === type);

		// Apply resource-based filtering
		if (!this.#actionsUIState.showAll) {
			actions = actions.filter(action =>
				action.costs.every(cost => characterSheet.getResource(cost.resource).current >= cost.amount),
			);
		}

		// Apply contextual filtering based on selected weapon mode and defense realm (only when showAll is disabled)
		if (!this.#actionsUIState.showAll) {
			actions = actions.filter(action => {
				// Filter based on weapon mode for attack actions
				if (type === ActionType.Attack) {
					const selectedWeaponIndex = this.#actionsUIState.selectedWeaponIndex;
					if (selectedWeaponIndex !== null && selectedWeaponIndex >= 0) {
						const weaponModes = buildWeaponModesList(characterSheet);
						const selectedWeaponMode = weaponModes.find(w => w.index === selectedWeaponIndex);

						if (selectedWeaponMode?.mode) {
							const mode = selectedWeaponMode.mode;
							const isRangedMode = mode.rangeType === Trait.Ranged;
							// Hide ranged actions if melee weapon selected, and vice versa
							if (action.traits.includes(Trait.Ranged) && !isRangedMode) {
								return false;
							}
							if (action.traits.includes(Trait.Melee) && isRangedMode) {
								return false;
							}
						}
					} else {
						// For unarmed (-1) or shield bash (-2), treat as melee
						if (action.traits.includes(Trait.Ranged)) {
							return false;
						}
					}
				}

				// Filter based on defense realm for defense actions
				if (type === ActionType.Defense) {
					const selectedDefenseRealm = this.#actionsUIState.selectedDefenseRealm;
					if (selectedDefenseRealm) {
						// Always show Basic Defense regardless of realm
						if (action.key === Action.BasicDefense) {
							return true;
						}

						// Hide body-only defense actions if Mind or Soul is selected
						if (selectedDefenseRealm.name !== 'Body') {
							// Check if action is body-only by looking at its parameters
							const hasBodyOnlyParameters = action.parameters.some(param => {
								if (param instanceof ActionCheckParameter) {
									return (
										param.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Armor) ||
										param.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Shield)
									);
								}
								return false;
							});
							if (hasBodyOnlyParameters) {
								return false;
							}
						}

						// Hide Shield Block if show all is false and no shield is selected
						if (action.key === Action.ShieldBlock && !this.#actionsUIState.showAll) {
							if (this.#actionsUIState.selectedShield === null) {
								return false;
							}
						}
					}
				}

				return true;
			});
		}

		return actions.map(action => this.prepareActionItem(action, characterSheet));
	}

	private wouldActionBeHiddenByTraitFiltering(action: ActionDefinition, characterSheet: CharacterSheet): boolean {
		// This function determines if an action WOULD be hidden by trait filtering
		// regardless of the showAll setting (used for red text indication)

		// Check weapon trait filtering for attack actions
		if (action.type === ActionType.Attack) {
			const selectedWeaponIndex = this.#actionsUIState.selectedWeaponIndex;
			if (selectedWeaponIndex !== null && selectedWeaponIndex >= 0) {
				const weaponModes = buildWeaponModesList(characterSheet);
				const selectedWeaponMode = weaponModes.find(w => w.index === selectedWeaponIndex);

				if (selectedWeaponMode?.mode) {
					const mode = selectedWeaponMode.mode;
					const isRangedMode = mode.rangeType === Trait.Ranged;
					// Action would be hidden if it has ranged trait but melee weapon selected, or vice versa
					if (action.traits.includes(Trait.Ranged) && !isRangedMode) {
						return true;
					}
					if (action.traits.includes(Trait.Melee) && isRangedMode) {
						return true;
					}
				}
			} else {
				// For unarmed (-1) or shield bash (-2), treat as melee - ranged actions would be hidden
				if (action.traits.includes(Trait.Ranged)) {
					return true;
				}
			}
		}

		// Check defense realm filtering for defense actions
		if (action.type === ActionType.Defense) {
			const selectedDefenseRealm = this.#actionsUIState.selectedDefenseRealm;
			if (selectedDefenseRealm) {
				// Always show Basic Defense regardless of realm
				if (action.key === Action.BasicDefense) {
					return false; // Basic Defense is never hidden
				}

				// Hide body-only defense actions if Mind or Soul is selected
				if (selectedDefenseRealm.name !== 'Body') {
					// Check if action is body-only by looking at its parameters
					const hasBodyOnlyParameters = action.parameters.some(param => {
						if (param instanceof ActionCheckParameter) {
							return (
								param.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Armor) ||
								param.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Shield)
							);
						}
						return false;
					});
					if (hasBodyOnlyParameters) {
						return true; // Would be hidden because it's body-only but non-body realm selected
					}
				}

				// Also check Shield Block specifically
				if (action.key === Action.ShieldBlock) {
					if (this.#actionsUIState.selectedShield === null) {
						return true; // Would be hidden because no shield is selected
					}
				}
			}
		}

		return false;
	}

	private prepareConditionsData(): unknown[] {
		return Object.values(Condition).map(condition => ({
			key: condition,
			name: condition,
			description: CONDITIONS[condition].description,
			active: this.#conditions.has(condition),
			icon: this.getConditionIcon(condition),
		}));
	}

	private getConditionIcon(condition: Condition): string {
		const iconMap: Record<Condition, string> = {
			[Condition.Blessed]: 'fas fa-sun',
			[Condition.Blinded]: 'fas fa-eye-slash',
			[Condition.Distracted]: 'fas fa-dizzy',
			[Condition.Distraught]: 'fas fa-heart-broken',
			[Condition.Frightened]: 'fas fa-ghost',
			[Condition.Immobilized]: 'fas fa-chain',
			[Condition.Incapacitated]: 'fas fa-skull',
			[Condition.OffGuard]: 'fas fa-shield-slash',
			[Condition.Prone]: 'fas fa-person-falling',
			[Condition.Silenced]: 'fas fa-volume-mute',
			[Condition.Unconscious]: 'fas fa-bed',
		};
		return iconMap[condition] || 'fas fa-exclamation-triangle';
	}

	private prepareActionItem(action: ActionDefinition, characterSheet: CharacterSheet): unknown {
		const costs = action.costs.map(cost => {
			const resource = RESOURCES[cost.resource];
			const current = characterSheet.getResource(cost.resource).current;
			return {
				value: `${cost.amount}${cost.variable ? '+' : ''} ${resource.shortName}`,
				insufficient: current < cost.amount,
			};
		});

		const costTooltip = costs.map(c => c.value).join('\n');
		const canAfford = costs.every(c => !c.insufficient);

		const parameters = action.parameters
			.map(param => {
				if (param instanceof ActionValueParameter) {
					const tree = characterSheet.getStatTree();
					const result = param.compute(tree);

					// Convert result to appropriate value type
					const computeValueForUnit = (value: number, unit: ActionValueUnit) => {
						switch (unit) {
							case ActionValueUnit.Modifier:
								return new Bonus({ value });
							case ActionValueUnit.Hex:
								return new Distance({ value });
						}
					};

					const value = computeValueForUnit(result.value, param.unit);
					const tooltip = [param.name, result.tooltip].filter(Boolean).join('\n');

					return {
						type: 'value',
						title: param.name,
						value: value.description,
						tooltip: tooltip,
					};
				} else if (param instanceof ActionCheckParameter) {
					const tree = characterSheet.getStatTree();
					const resolvedStatType = computeStatType(param.statType, this.#actionsUIState, characterSheet);

					// Compute included modifiers based on current UI state
					const cms = param.includeEquipmentModifiers.flatMap(includeModifierFor =>
						computeIncludedModifiers(includeModifierFor.toString(), characterSheet, this.#actionsUIState),
					);
					const circumstanceModifiers = [param.circumstanceModifier, ...cms].filter(
						e => e !== undefined,
					) as CircumstanceModifier[];

					const statModifier = tree.getModifier(resolvedStatType, circumstanceModifiers);
					const wouldBeHidden = this.wouldActionBeHiddenByTraitFiltering(action, characterSheet);

					return {
						type: 'check',
						title: resolvedStatType.toString(),
						value: statModifier.value.description,
						tooltip: `${statModifier.description} • Click for advanced options • Shift+Click for quick roll`,
						wouldBeHidden,
						checkData: {
							stat: resolvedStatType.toString(),
							modifier: statModifier.value.value,
							description: statModifier.description,
							parameter: param,
						},
					};
				}
				return null;
			})
			.filter(Boolean);

		// Show only first paragraph of description
		const firstParagraph = action.description.split('\n\n')[0] || action.description;

		return {
			key: action.key,
			name: action.name,
			description: processDescriptionText(firstParagraph),
			traits: action.traits,
			costs,
			costTooltip,
			canAfford,
			parameters,
		};
	}

	private getActionTypeHeader(type: ActionType, characterSheet: CharacterSheet): Record<string, unknown> | null {
		switch (type) {
			case ActionType.Movement: {
				// No header needed for movement - movement stat is already shown in derived stats
				return null;
			}
			case ActionType.Attack: {
				// Build weapon modes list
				const weaponModes = buildWeaponModesList(characterSheet);

				const selectedWeaponData =
					this.#actionsUIState.selectedWeaponIndex !== null
						? weaponModes.find(w => w.index === this.#actionsUIState.selectedWeaponIndex)
						: weaponModes[0]; // Default to Unarmed

				return {
					type: 'attack',
					weaponModes,
					selectedWeapon: selectedWeaponData,
					hasRangedWeapon: selectedWeaponData?.mode?.rangeType === Trait.Ranged,
					selectedRange: this.#actionsUIState.selectedRange,
					heightIncrements: this.#actionsUIState.heightIncrements,
					passiveCoverOptions: Object.values(PassiveCoverType),
					selectedPassiveCover: this.#actionsUIState.selectedPassiveCover,
				};
			}
			case ActionType.Defense: {
				const equipment = characterSheet.equipment;
				const armors = equipment.items.filter(item => item instanceof Armor) as Armor[];
				const shields = equipment.items.filter(item => item instanceof Shield) as Shield[];

				return {
					type: 'defense',
					defenseRealms: StatType.realms,
					selectedDefenseRealm: this.#actionsUIState.selectedDefenseRealm,
					armors,
					shields,
					selectedArmor:
						this.#actionsUIState.selectedArmor !== null
							? {
									index: this.#actionsUIState.selectedArmor,
									...armors[this.#actionsUIState.selectedArmor],
								}
							: null,
					selectedShield:
						this.#actionsUIState.selectedShield !== null
							? {
									index: this.#actionsUIState.selectedShield,
									...shields[this.#actionsUIState.selectedShield],
								}
							: null,
				};
			}
			default:
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
				const actor = getActorById(currentActorId!);
				if (!actor) {
					return getUI().notifications?.warn('Actor not found');
				}

				await importActorPropsFromShareString(actor);
				// Re-render the sheet to show updated data
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		}
		const exportBtn = root.querySelector('[data-action="sw-export"]') as HTMLButtonElement | null;
		if (exportBtn) {
			exportBtn.addEventListener('click', async () => {
				const actor = getActorById(currentActorId);
				if (!actor) {
					return getUI().notifications?.warn('Actor not found');
				}

				const shareString = exportActorPropsToShareString(actor);
				await navigator.clipboard.writeText(shareString);

				getUI().notifications?.info('Share string copied to clipboard');
			});
		}

		// Add condition toggle handlers
		const conditionCheckboxes = root.querySelectorAll(
			'[data-action="toggle-condition"]',
		) as NodeListOf<HTMLInputElement>;
		conditionCheckboxes.forEach(checkbox => {
			checkbox.addEventListener('change', async () => {
				const condition = checkbox.dataset.condition as Condition;
				if (!condition) return;

				if (checkbox.checked) {
					this.#conditions.add(condition);
				} else {
					this.#conditions.delete(condition);
				}

				await this.saveConditionsToActor();
			});
		});

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

		const longRestBtn = root.querySelector('[data-action="long-rest"]') as HTMLButtonElement | null;
		if (longRestBtn) {
			longRestBtn.addEventListener('click', async () => {
				const confirmed = await confirmAction({
					title: 'Long Rest',
					message:
						'Are you sure you want to take a Long Rest? This will refill all points except Heroism, and add 1 Heroism Point.',
				});

				if (confirmed) {
					await this.handleLongRest();
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
						await this.handleWeaponAttackRoll(weaponName, attackStat, modeBonus);
					} else {
						// Normal click opens the dice modal for weapon attack
						await this.handleWeaponAttackRollModal(weaponName, attackStat, modeBonus);
					}
				}
			});
		});

		// Add tab switching handlers
		// Add Actions-specific event handlers
		this.addActionsEventHandlers(root);

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

	private addActionsEventHandlers(root: HTMLElement): void {
		// Actions sub-tab switching
		const actionTabButtons = root.querySelectorAll('.actions-tab-button') as NodeListOf<HTMLButtonElement>;
		actionTabButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				const tabKey = btn.dataset.tab;
				if (!tabKey) return;

				// Update Actions UI state
				this.#actionsUIState.activeTab = tabKey;

				// Re-render to update content (preserve main tab state)
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		// Show All checkbox
		const showAllCheckbox = root.querySelector('[data-action="toggle-actions-show-all"]') as HTMLInputElement | null;
		if (showAllCheckbox) {
			showAllCheckbox.addEventListener('change', () => {
				this.#actionsUIState.showAll = showAllCheckbox.checked;
				// Re-render to update filtered actions
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		}

		// Action cost consumption
		const costBoxes = root.querySelectorAll('[data-action="consume-action-cost"]') as NodeListOf<HTMLElement>;
		costBoxes.forEach(box => {
			box.addEventListener('click', async () => {
				const actionKey = box.dataset.actionKey;
				if (!actionKey) return;

				const action = Object.values(ACTIONS).find(a => a.key === actionKey);
				if (!action) return;

				const characterSheet = this.getCharacterSheet();
				const actorId = this.getCurrentActorId();
				if (!characterSheet || !actorId) return;

				try {
					// Check if modal is supported
					if (!ConsumeResourceModal.isSupported()) {
						getUI().notifications?.warn('Resource consumption modal not supported in this Foundry version');
						return;
					}

					// Open the consume resource modal
					await ConsumeResourceModal.open(characterSheet, action.costs, action.name, actorId);
				} catch (error) {
					console.error('Failed to open consume resource modal:', error);
					getUI().notifications?.error('Failed to open resource consumption modal');
				}
			});
		});

		// Header control handlers
		const weaponSelects = root.querySelectorAll('[data-action="select-weapon"]') as NodeListOf<HTMLSelectElement>;
		weaponSelects.forEach(select => {
			select.addEventListener('change', () => {
				const weaponIndex = parseInt(select.value);
				this.#actionsUIState.selectedWeaponIndex = weaponIndex;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const defenseRealmSelects = root.querySelectorAll(
			'[data-action="select-defense-realm"]',
		) as NodeListOf<HTMLSelectElement>;
		defenseRealmSelects.forEach(select => {
			select.addEventListener('change', () => {
				// Find the StatType by name
				const realmName = select.value;
				const realm = StatType.realms.find(r => r.name === realmName);
				if (realm) {
					this.#actionsUIState.selectedDefenseRealm = realm;
					// Clear armor and shield selections when switching away from Body realm
					if (realm.name !== 'Body') {
						this.#actionsUIState.selectedArmor = null;
						this.#actionsUIState.selectedShield = null;
					}
					(this as unknown as { render: (force?: boolean) => void }).render(false);
				}
			});
		});

		const passiveCoverSelects = root.querySelectorAll(
			'[data-action="select-passive-cover"]',
		) as NodeListOf<HTMLSelectElement>;
		passiveCoverSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#actionsUIState.selectedPassiveCover = select.value as unknown as PassiveCoverType;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const rangeInputs = root.querySelectorAll('[data-action="set-range"]') as NodeListOf<HTMLInputElement>;
		rangeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const value = parseInt(input.value);
				this.#actionsUIState.selectedRange = value > 0 ? Distance.of(value) : null;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const heightInputs = root.querySelectorAll('[data-action="set-height"]') as NodeListOf<HTMLInputElement>;
		heightInputs.forEach(input => {
			input.addEventListener('change', () => {
				this.#actionsUIState.heightIncrements = input.value;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const armorSelects = root.querySelectorAll('[data-action="select-armor"]') as NodeListOf<HTMLSelectElement>;
		armorSelects.forEach(select => {
			select.addEventListener('change', () => {
				const armorIndex = parseInt(select.value);
				this.#actionsUIState.selectedArmor = armorIndex >= 0 ? armorIndex : null;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const shieldSelects = root.querySelectorAll('[data-action="select-shield"]') as NodeListOf<HTMLSelectElement>;
		shieldSelects.forEach(select => {
			select.addEventListener('change', () => {
				const shieldIndex = parseInt(select.value);
				this.#actionsUIState.selectedShield = shieldIndex >= 0 ? shieldIndex : null;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		// Action check rolls
		const actionCheckButtons = root.querySelectorAll('[data-action="roll-action-check"]') as NodeListOf<HTMLElement>;
		actionCheckButtons.forEach(btn => {
			const handleClick = async (event: MouseEvent) => {
				const actionKey = btn.dataset.actionKey;
				const parameterIndex = btn.dataset.parameterIndex;

				if (!actionKey || parameterIndex === undefined) return;

				const action = Object.values(ACTIONS).find(a => a.key === actionKey);
				if (!action) return;

				const paramIndex = parseInt(parameterIndex);
				const parameter = action.parameters[paramIndex];

				if (!(parameter instanceof ActionCheckParameter)) return;

				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				try {
					// Build the check with current character state and UI modifiers
					const tree = characterSheet.getStatTree();
					const resolvedStatType = computeStatType(parameter.statType, this.#actionsUIState, characterSheet);

					// Compute included modifiers based on current UI state
					const cms = parameter.includeEquipmentModifiers.flatMap(includeModifierFor =>
						computeIncludedModifiers(includeModifierFor.toString(), characterSheet, this.#actionsUIState),
					);
					const circumstanceModifiers = [parameter.circumstanceModifier, ...cms].filter(
						e => e !== undefined,
					) as CircumstanceModifier[];

					const statModifier = tree.getModifier(resolvedStatType, circumstanceModifiers);

					// Build detailed modifier breakdown
					const modifierBreakdown = this.buildActionModifierBreakdown(
						resolvedStatType,
						circumstanceModifiers,
						characterSheet,
					);

					if (event.shiftKey) {
						// Quick roll - directly execute
						const rollRequest: DiceRollRequest = {
							name: `${action.name} - ${resolvedStatType.toString()}`,
							characterName: characterSheet.name,
							modifiers: modifierBreakdown,
							extra: undefined,
							luck: undefined,
							targetDC: parameter.targetDc,
						};
						await executeEnhancedRoll(rollRequest);
					} else {
						// Open modal for advanced options
						if (!DiceRollModal.isSupported()) {
							getUI().notifications?.warn('Dice modal not supported in this Foundry version');
							return;
						}

						await DiceRollModal.open({
							statType: resolvedStatType.toString(),
							modifier: statModifier.value.value,
							modifierBreakdown,
							actorId: this.getCurrentActorId()!,
							...(parameter.targetDc !== undefined && { targetDC: parameter.targetDc }),
						});
					}
				} catch (err) {
					console.error('Failed to roll action check:', err);
					getUI().notifications?.error('Failed to roll action check');
				}
			};

			btn.addEventListener('click', handleClick);
		});
	}

	private async handleResourceChange(resource: Resource, delta: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return getUI().notifications?.warn('Actor not found');
		}
		const props = getCharacterProps(actor);

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

			// Update actor flags and system data using shared utility
			const updatedProps = { ...props, [resource]: newValue.toString() };
			const { updateActorResources } = await import('./update-actor-resources.js');
			await updateActorResources(actor, updatedProps);

			// DO NOT call render() here - we've already updated the DOM directly
			// getUI().notifications?.info(`${RESOURCES[resource].shortName} updated`);
		} catch (err) {
			console.error('Failed to update resource:', err);
			getUI().notifications?.error('Failed to update resource');
		}
	}

	private async handleLongRest(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return getUI().notifications?.warn('Actor not found');
		}

		const props = getCharacterProps(actor);
		const sheet = CharacterSheet.from(props);

		try {
			const updatedProps = { ...props };
			Object.values(Resource).forEach(resource => {
				const { current, max } = sheet.getResource(resource);

				const updatedValue = resource === Resource.HeroismPoint ? (current < max ? current + 1 : max) : max;
				updatedProps[resource] = updatedValue.toString();
			});

			const { updateActorResources } = await import('./update-actor-resources.js');
			await updateActorResources(actor, updatedProps);

			getUI().notifications?.info('Long rest complete: all points refilled except heroism, +1 heroism point');
		} catch (err) {
			console.error('Failed to perform long rest:', err);
			getUI().notifications?.error('Failed to perform long rest');
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

	private buildActionModifierBreakdown(
		statType: StatType,
		circumstanceModifiers: CircumstanceModifier[],
		characterSheet: CharacterSheet,
	): Record<string, number> {
		const modifiers: Record<string, number> = {};
		const tree = characterSheet.getStatTree();

		// Get the base stat value (without any circumstance modifiers)
		const baseStatModifier = tree.getModifier(statType, []);
		if (baseStatModifier.value.value !== 0) {
			modifiers['Base'] = baseStatModifier.value.value;
		}

		// Add each circumstance modifier separately
		for (const cm of circumstanceModifiers) {
			if (cm.value.value !== 0) {
				// Use a more descriptive name based on the modifier source
				let modifierName = cm.name;
				if (cm.source === ModifierSource.Circumstance) {
					modifierName = 'CM';
				} else if (cm.source === ModifierSource.Equipment) {
					modifierName = 'Equipment';
				}

				// If we already have a modifier with this name, combine them
				const existingValue = modifiers[modifierName];
				if (existingValue !== undefined) {
					modifiers[modifierName] = existingValue + cm.value.value;
				} else {
					modifiers[modifierName] = cm.value.value;
				}
			}
		}

		return modifiers;
	}

	private async handleWeaponAttackRoll(weaponName: string, attackStat: string, weaponBonus: number): Promise<void> {
		// Quick weapon attack roll using centralized dice system - treat as stat check with weapon modifier
		const rollRequest: DiceRollRequest = {
			name: `${attackStat} Check`,
			characterName: this.getCharacterSheet()?.name ?? 'Unknown',
			modifiers: this.buildWeaponAttackModifiers(attackStat, weaponBonus, weaponName),
			extra: undefined,
			luck: undefined,
			targetDC: undefined,
		};

		await executeEnhancedRoll(rollRequest);
	}

	private async handleWeaponAttackRollModal(
		weaponName: string,
		attackStat: string,
		weaponBonus: number,
	): Promise<void> {
		if (!DiceRollModal.isSupported()) {
			getUI().notifications?.warn('Dice modal not supported in this Foundry version');
			return this.handleWeaponAttackRoll(weaponName, attackStat, weaponBonus);
		}

		// Get the detailed modifier breakdown for weapon attacks
		const modifierBreakdown = this.buildWeaponAttackModifiers(attackStat, weaponBonus, weaponName);
		const totalModifier = Object.values(modifierBreakdown).reduce((sum: number, val: number) => sum + val, 0);

		await DiceRollModal.open({
			statType: attackStat, // Use the stat name instead of weapon name
			modifier: totalModifier,
			modifierBreakdown, // Pass the detailed breakdown
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
	): Record<string, number> {
		const modifiers: Record<string, number> = {};

		// Get the stat breakdown to separate base from other modifiers
		const statBreakdown = this.getStatBreakdown(attackStat);
		if (statBreakdown) {
			// Add base stat points as "Base" modifier
			if (statBreakdown.baseValue > 0) {
				modifiers['Base'] = statBreakdown.baseValue;
			}

			// Add individual stat modifiers (feats, equipment, etc.)
			for (const mod of statBreakdown.modifiers) {
				modifiers[mod.source] = mod.value;
			}
		} else {
			console.warn(`Failed to get stat breakdown for ${attackStat}`);
		}

		// Add weapon bonus as a separate equipment modifier
		if (weaponBonus !== 0) {
			modifiers[weaponName] = weaponBonus;
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
