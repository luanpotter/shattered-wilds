import {
	ActionRow,
	ActionRowBox,
	ActionRowCheckBox,
	ACTIONS,
	ActionsSection,
	ActionTabInputValues,
	ActionType,
	ArcaneSection,
	ArcaneSectionDefaults,
	ArcaneSectionInputValues,
	ArcaneSpellComponentType,
	Armor,
	CharacterSheet,
	Check,
	CheckMode,
	CheckNature,
	CircumstanceModifier,
	Condition,
	CONDITIONS,
	DerivedStatType,
	Distance,
	DistanceInput,
	DropdownInput,
	FeatsSection,
	NodeStatModifier,
	NumberInput,
	OtherItem,
	PassiveCoverType,
	PRIMARY_WEAPON_TYPES,
	Resource,
	RESOURCES,
	Shield,
	StatModifier,
	StatNode,
	StatType,
	Weapon,
	WeaponModeOption,
} from '@shattered-wilds/commons';
import {
	ensureActorDataPersistence,
	getActorData,
	getCharacterConditions,
	getCharacterProps,
	getRawCharacterFlags,
} from './actor-data-manager.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { parseCharacterProps, parseCharacterSheet } from './characters.js';
import { ConsumeResourceModal } from './consume-resource-modal.js';
import { rollDice } from './dices.js';
import {
	ActorLike,
	confirmAction,
	getActorById,
	getActorSheetV2Ctor,
	getFoundryConfig,
	getHandlebarsApplicationMixin,
	showNotification,
} from './foundry-shim.js';
import { prepareInputForTemplate } from './input-renderer.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { processDescriptionText, prepareActionRow } from './action-row-renderer.js';

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

const V2Base = getActorSheetV2Ctor();
const HbsMixin = getHandlebarsApplicationMixin();

if (!V2Base || !HbsMixin) {
	throw new Error('V2 ActorSheet or HandlebarsApplicationMixin not available');
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
		selectedWeaponIndex: 0, // Index into weapon modes array (0 = Unarmed)
		selectedArmor: null as number | null,
		selectedShield: null as number | null,
	};

	// Arcane-specific UI state
	#arcaneUIState = {
		selectedRange: Distance.of(0),
		selectedSchoolIndex: 0, // Index into allSchoolOptions (0 = All Schools)
		selectedAttackOptionIndex: 0, // Index into allAttackOptions (0 = All Spells)
		selectedCastingTimeIndex: ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX,
		selectedFocusCostIndex: ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX,
		selectedSomaticComponentIndex: 0,
		selectedVerbalComponentIndex: 0,
		selectedFocalComponentIndex: 0,
		spellAugmentationValues: {} as Record<string, Record<string, number>>,
	};

	#conditions = new Set<Condition>();
	#conditionsLoaded = false;
	#exhaustionRank = 0;
	#exhaustionLoaded = false;

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

	private loadExhaustionFromActor(): void {
		const actor = this.getCurrentActor();
		if (!actor) return;

		if (this.#exhaustionLoaded) return;

		const flags = getRawCharacterFlags(actor) as { exhaustionRank?: number } | undefined;
		this.#exhaustionRank = flags?.exhaustionRank ?? 0;
		this.#exhaustionLoaded = true;
	}

	private async saveExhaustionToActor(): Promise<void> {
		const actor = this.getCurrentActor() as
			| {
					flags?: Record<string, unknown>;
					setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
			  }
			| undefined;

		if (!actor?.setFlag) {
			console.warn('Cannot save exhaustion: actor not found or missing setFlag');
			return;
		}

		await actor.setFlag('shattered-wilds', 'exhaustionRank', this.#exhaustionRank);
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
		const CONFIG = getFoundryConfig();

		const getConditionIcon = (condition: Condition): string => {
			const iconMap: Record<Condition, string> = {
				[Condition.Blessed]: 'icons/svg/angel.svg',
				[Condition.Blinded]: 'icons/svg/blind.svg',
				[Condition.Distracted]: 'icons/svg/daze.svg',
				[Condition.Distraught]: 'icons/svg/aura.svg',
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

		CONFIG.statusEffects = Object.values(Condition).map(condition => ({
			id: `sw-${condition.toLowerCase().replace(/\s+/g, '-')}`,
			name: condition,
			img: getConditionIcon(condition),
			description: CONDITIONS[condition].description,
		}));
	}

	private getCurrentActor(): ActorLike {
		return (this as unknown as { actor: ActorLike }).actor;
	}

	private getCurrentActorId(): string | undefined {
		return this.getCurrentActor()?.id;
	}

	private getCharacterSheet(): CharacterSheet | undefined {
		const actor = this.getCurrentActor();
		return actor ? parseCharacterSheet(actor) : undefined;
	}

	private getSelectedWeapon(): WeaponModeOption | null {
		const characterSheet = this.getCharacterSheet();
		if (!characterSheet) return null;

		const weaponModes = characterSheet.equipment.weaponModes();
		return weaponModes[this.#actionsUIState.selectedWeaponIndex] || null;
	}

	private getSelectedArmor(): Armor | 'None' {
		const characterSheet = this.getCharacterSheet();
		if (!characterSheet) return 'None';

		const equipment = characterSheet.equipment;
		const armors = equipment.items.filter(item => item instanceof Armor) as Armor[];

		if (this.#actionsUIState.selectedArmor !== null && this.#actionsUIState.selectedArmor < armors.length) {
			const armor = armors[this.#actionsUIState.selectedArmor];
			return armor || 'None';
		}
		return 'None';
	}

	private getSelectedShield(): Shield | 'None' {
		const characterSheet = this.getCharacterSheet();
		if (!characterSheet) return 'None';

		const equipment = characterSheet.equipment;
		const shields = equipment.items.filter(item => item instanceof Shield) as Shield[];

		if (this.#actionsUIState.selectedShield !== null && this.#actionsUIState.selectedShield < shields.length) {
			const shield = shields[this.#actionsUIState.selectedShield];
			return shield || 'None';
		}
		return 'None';
	}

	private createActionTabInputValues(): ActionTabInputValues {
		const selectedWeapon = this.getSelectedWeapon();
		return new ActionTabInputValues({
			selectedWeaponMode: selectedWeapon || Weapon.unarmed(),
			selectedRangeValue: this.#actionsUIState.selectedRange?.value ?? 0,
			selectedDefenseRealm: this.#actionsUIState.selectedDefenseRealm,
			selectedPassiveCover: this.#actionsUIState.selectedPassiveCover,
			heightIncrements: Number(this.#actionsUIState.heightIncrements) || 0,
			selectedArmor: this.getSelectedArmor(),
			selectedShield: this.getSelectedShield(),
		});
	}

	private createActionsSectionUpdateCallback(
		characterSheet: CharacterSheet,
	): (updatedValues: ActionTabInputValues) => void {
		return updatedValues => {
			// Update the UI state with the new values
			const weaponModes = characterSheet.equipment.weaponModes();
			const weaponIndex = weaponModes.findIndex(
				w => w.weapon === updatedValues.selectedWeaponMode.weapon && w.mode === updatedValues.selectedWeaponMode.mode,
			);
			if (weaponIndex >= 0) {
				this.#actionsUIState.selectedWeaponIndex = weaponIndex;
			}

			this.#actionsUIState.selectedRange = Distance.of(updatedValues.selectedRangeValue);
			this.#actionsUIState.selectedDefenseRealm = updatedValues.selectedDefenseRealm;
			this.#actionsUIState.selectedPassiveCover = updatedValues.selectedPassiveCover;
			this.#actionsUIState.heightIncrements = String(updatedValues.heightIncrements);

			// Update armor and shield indices
			const armors = characterSheet.equipment.items.filter(item => item instanceof Armor) as Armor[];
			const shields = characterSheet.equipment.items.filter(item => item instanceof Shield) as Shield[];

			if (updatedValues.selectedArmor !== 'None') {
				const armorIndex = armors.findIndex(a => a === updatedValues.selectedArmor);
				if (armorIndex >= 0) {
					this.#actionsUIState.selectedArmor = armorIndex;
				}
			} else {
				this.#actionsUIState.selectedArmor = null;
			}

			if (updatedValues.selectedShield !== 'None') {
				const shieldIndex = shields.findIndex(s => s === updatedValues.selectedShield);
				if (shieldIndex >= 0) {
					this.#actionsUIState.selectedShield = shieldIndex;
				}
			} else {
				this.#actionsUIState.selectedShield = null;
			}
		};
	}

	private createActionsSection(characterSheet: CharacterSheet, readOnly: boolean = false): ActionsSection {
		const inputValues = this.createActionTabInputValues();
		return ActionsSection.create({
			characterId: this.getCurrentActorId() || '',
			characterSheet,
			showAll: this.#actionsUIState.showAll,
			inputValues,
			update: readOnly ? () => {} : this.createActionsSectionUpdateCallback(characterSheet),
		});
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

				// Load exhaustion from actor
				this.loadExhaustionFromActor();

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
			exhaustionData: this.prepareExhaustionData(),
			derivedStatsData,
			statTreeData,
			featsData: this.prepareFeatsData(characterSheet),
			personalityData: this.preparePersonalityData(characterSheet),
			miscData: this.prepareMiscData(characterSheet),
			equipmentData: this.prepareEquipmentData(characterSheet),
			actionsData: this.prepareActionsData(characterSheet),
			arcaneData: this.prepareArcaneData(characterSheet),
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isFeatsTabActive: this.#activeTab === 'feats',
			isPersonalityTabActive: this.#activeTab === 'personality',
			isMiscTabActive: this.#activeTab === 'misc',
			isEquipmentTabActive: this.#activeTab === 'equipment',
			isActionsTabActive: this.#activeTab === 'actions',
			isArcaneTabActive: this.#activeTab === 'arcane',
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

	preparePersonalityData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}

		// Get the actor to access props
		const actorLike = (this as unknown as { actor?: ActorLike }).actor;
		const currentActorId = actorLike?.id;
		const actor = actorLike || getActorData(currentActorId);

		if (!actor) {
			return null;
		}

		// Extract personality traits from character props
		const props = parseCharacterProps(actor);
		const personalityTraits = [
			{
				key: 'calling',
				label: 'Calling',
				value: props['calling'] ?? '',
				description: "Your character's motivation for reaching the Citadel",
			},
			{
				key: 'vice',
				label: 'Vice',
				value: props['vice'] ?? '',
				description: 'An indulgence, temptation, or flaw your character has difficulty resisting',
			},
			{
				key: 'aversion',
				label: 'Aversion',
				value: props['aversion'] ?? '',
				description: 'Something your character cannot bring themselves to do',
			},
			{
				key: 'tenet',
				label: 'Tenet',
				value: props['tenet'] ?? '',
				description: 'Rules and edicts your character must always follow',
			},
			{
				key: 'leanings',
				label: 'Leanings',
				value: props['leanings'] ?? '',
				description: "Personality traits that guide your character's behavior",
			},
		];

		// Check if all personality traits are empty
		const isEmpty = personalityTraits.every(trait => !trait.value.trim());

		return {
			isEmpty,
			traits: personalityTraits,
		};
	}

	prepareMiscData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}

		// Get the actor to access props
		const actorLike = (this as unknown as { actor?: ActorLike }).actor;
		const currentActorId = actorLike?.id;
		const actor = actorLike || getActorData(currentActorId);

		if (!actor) {
			return null;
		}

		// Extract misc prop
		const props = parseCharacterProps(actor);
		const miscValue = props['misc']?.trim() ?? '';

		return {
			value: miscValue,
			isEmpty: !miscValue,
		};
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

			const weaponModes = equipment.weaponModes().map((mode, idx) => ({
				idx,
				mode,
			}));

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
								idx: weaponModes.find(wm => wm.mode.weapon === item && wm.mode.mode === mode)?.idx ?? 0,
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
			const actionsSection = this.createActionsSection(characterSheet);

			// Prepare action types as tabs for VTT template compatibility
			const actionTypes = Object.values(ActionType);
			const actionTabs = actionTypes.map(type => {
				const tab = actionsSection.tabs[type];

				// Use generic input renderer for all inputs
				const inputs = tab.inputs.map(input => prepareInputForTemplate(input)).filter(input => !input.hidden);

				return {
					key: type,
					label: type,
					icon: this.getActionTypeIcon(type),
					active: this.#actionsUIState.activeTab === type,
					actions: tab.actions.map(actionTabItem => prepareActionRow(actionTabItem, characterSheet)),
					inputs: inputs.length > 0 ? inputs : null,
				};
			});

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

	prepareArcaneData(characterSheet: CharacterSheet | undefined) {
		if (!characterSheet) {
			return null;
		}

		// Check if character is a caster
		const { primaryAttribute } = characterSheet.characterClass.definition;
		if (!StatType.mindAttributes.includes(primaryAttribute.name)) {
			return null; // not a caster
		}

		try {
			const componentOptions = ArcaneSection.getComponentsForFlavor(characterSheet);

			// Build selected components from indices
			const selectedSomaticComponent =
				componentOptions[ArcaneSpellComponentType.Somatic]?.[this.#arcaneUIState.selectedSomaticComponentIndex] ?? null;
			const selectedVerbalComponent =
				componentOptions[ArcaneSpellComponentType.Verbal]?.[this.#arcaneUIState.selectedVerbalComponentIndex] ?? null;
			const selectedFocalComponent =
				componentOptions[ArcaneSpellComponentType.Focal]?.[this.#arcaneUIState.selectedFocalComponentIndex] ?? null;

			const selectedSchool =
				ArcaneSection.allSchoolOptions[this.#arcaneUIState.selectedSchoolIndex] ?? ArcaneSectionDefaults.INITIAL_SCHOOL;
			const selectedAttackOption =
				ArcaneSection.allAttackOptions[this.#arcaneUIState.selectedAttackOptionIndex] ??
				ArcaneSectionDefaults.INITIAL_ATTACK_OPTION;
			const selectedCastingTime =
				ArcaneSection.allCastingTimeOptions[this.#arcaneUIState.selectedCastingTimeIndex] ??
				ArcaneSection.allCastingTimeOptions[ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX]!;
			const selectedFocusCost =
				ArcaneSection.getAvailableFocusCostOptions(selectedCastingTime)[this.#arcaneUIState.selectedFocusCostIndex] ??
				ArcaneSection.allFocusCostOptions[ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX]!;

			const inputValues: ArcaneSectionInputValues = {
				selectedRange: this.#arcaneUIState.selectedRange,
				selectedSchool,
				selectedAttackOption,
				selectedCastingTime,
				selectedFocusCost,
				selectedSomaticComponent,
				selectedVerbalComponent,
				selectedFocalComponent,
				spellAugmentationValues: this.#arcaneUIState.spellAugmentationValues,
			};

			const arcaneSection = ArcaneSection.create({
				characterId: this.getCurrentActorId() || '',
				sheet: characterSheet,
				inputValues,
			});

			// Prepare header controls
			const header = {
				baseModifier: {
					name: arcaneSection.baseModifier.name,
					value: arcaneSection.baseModifier.value.description,
					description: arcaneSection.baseModifier.description,
				},
				influenceRange: {
					value: arcaneSection.influenceRange.value.description,
					description: arcaneSection.influenceRange.description,
				},
				selectedRange: this.#arcaneUIState.selectedRange.value,
				combinedModifier: {
					value: arcaneSection.combinedModifier.value.description,
					description: arcaneSection.combinedModifier.description,
				},
				// Dropdown options
				schoolOptions: arcaneSection.schoolOptions.map((school, index) => ({
					value: index,
					label: school,
					selected: index === this.#arcaneUIState.selectedSchoolIndex,
				})),
				attackOptions: arcaneSection.attackOptions.map((option, index) => ({
					value: index,
					label: option,
					selected: index === this.#arcaneUIState.selectedAttackOptionIndex,
				})),
				castingTimeOptions: arcaneSection.castingTimeOptions.map((option, index) => ({
					value: index,
					label: option.name,
					selected: index === this.#arcaneUIState.selectedCastingTimeIndex,
				})),
				focusCostOptions: ArcaneSection.getAvailableFocusCostOptions(selectedCastingTime).map((option, index) => ({
					value: index,
					label: option.name,
					selected: index === this.#arcaneUIState.selectedFocusCostIndex,
				})),
				somaticComponentOptions: componentOptions[ArcaneSpellComponentType.Somatic]?.map((comp, index) => ({
					value: index,
					label: comp.name,
					selected: index === this.#arcaneUIState.selectedSomaticComponentIndex,
				})),
				verbalComponentOptions: componentOptions[ArcaneSpellComponentType.Verbal]?.map((comp, index) => ({
					value: index,
					label: comp.name,
					selected: index === this.#arcaneUIState.selectedVerbalComponentIndex,
				})),
				focalComponentOptions: componentOptions[ArcaneSpellComponentType.Focal]?.map((comp, index) => ({
					value: index,
					label: comp.name,
					selected: index === this.#arcaneUIState.selectedFocalComponentIndex,
				})),
			};

			// Prepare costs
			const costs = arcaneSection.fundamentalSpellCost.actionCosts.map(cost => {
				const resource = characterSheet.getResource(cost.resource);
				const insufficient = resource.current < cost.amount;
				return {
					resource: cost.resource,
					amount: cost.amount,
					value: `${cost.amount} ${RESOURCES[cost.resource as Resource].shortName}`,
					insufficient,
				};
			});

			const costTooltip = costs.map(c => c.value).join('\n');
			const canAfford = costs.every(c => !c.insufficient);

			const fundamentalCheck = arcaneSection.fundamentalCheck;

			const spells = arcaneSection.spells.map(row => prepareActionRow(row, characterSheet));

			return {
				arcaneSection,
				header,
				costs,
				costTooltip,
				canAfford,
				fundamentalCheck,
				spells,
			};
		} catch (err) {
			console.warn('Failed to prepare arcane data:', err);
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

	private modifierTextForRank(rank: number): { modifier: number; text: string } {
		if (rank >= 10) {
			return { modifier: 0, text: 'Death' };
		}

		let modifier;

		if (rank < 3) modifier = 0;
		else if (rank === 3) modifier = -1;
		else if (rank === 4) modifier = -2;
		else if (rank === 5) modifier = -4;
		else if (rank === 6) modifier = -8;
		else if (rank === 7) modifier = -16;
		else if (rank === 8) modifier = -32;
		else modifier = -64;

		return { modifier, text: `CM: ${modifier}` };
	}

	private prepareExhaustionData(): {
		rank: number;
		maxRank: number;
		hasRanks: boolean;
		modifier: number;
		modifierText: string;
	} {
		const rank = this.#exhaustionRank;
		const { modifier, text } = this.modifierTextForRank(rank);

		return {
			rank,
			maxRank: 10, // Death at 10+
			hasRanks: rank > 0,
			modifier,
			modifierText: text,
		};
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
					return showNotification('warn', 'Actor not found');
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
					return showNotification('warn', 'Actor not found');
				}

				const shareString = exportActorPropsToShareString(actor);
				await navigator.clipboard.writeText(shareString);

				showNotification('info', 'Share string copied to clipboard');
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
						'Are you sure you want to take a Long Rest? This will refill all points except Heroism, add 1 Heroism Point, and clear 3 ranks of Exhaustion.',
				});

				if (confirmed) {
					await this.handleLongRest();
				}
			});
		}

		// Add short rest button handler
		const shortRestBtn = root.querySelector('[data-action="short-rest"]') as HTMLButtonElement | null;
		if (shortRestBtn) {
			shortRestBtn.addEventListener('click', async () => {
				const confirmed = await confirmAction({
					title: 'Short Rest',
					message:
						'Are you sure you want to take a Short Rest? This will refill all points except Heroism and add 1 rank of Exhaustion.',
				});

				if (confirmed) {
					await this.handleShortRest();
				}
			});
		}

		// Add exhaustion change handlers
		const exhaustionButtons = root.querySelectorAll('[data-action="exhaustion-change"]') as NodeListOf<HTMLElement>;
		exhaustionButtons.forEach(btn => {
			btn.addEventListener('click', async () => {
				const delta = parseInt(btn.dataset.delta || '0');
				await this.handleExhaustionChange(delta);
			});
		});

		// Add stat roll handlers
		const statButtons = root.querySelectorAll('[data-action="roll-stat"]') as NodeListOf<HTMLElement>;
		statButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const statTypeName = btn.dataset.statType;
				if (!statTypeName) {
					return;
				}

				const statType = this.parseStatType(statTypeName);
				const useModal = event.shiftKey === false;
				await this.handleRawStatRoll({
					statType,
					useModal,
				});
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
						const useModal = event.shiftKey === false;
						await this.handleRawStatRoll({
							statType: DerivedStatType.Initiative,
							useModal,
						});
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
				const sheet = this.getCharacterSheet();
				if (!sheet) {
					showNotification('warn', 'Character sheet data not found');
					return;
				}
				const weaponModeOptionIdx = parseInt(btn.dataset.weaponModeOptionIdx || '0');
				const weaponMode = sheet.equipment.weaponModes()[weaponModeOptionIdx];
				if (!weaponMode) {
					showNotification('warn', `Weapon mode not found for idx ${weaponModeOptionIdx}`);
					return;
				}
				const useModal = event.shiftKey === false;
				await this.handleWeaponAttack({ weaponMode, useModal });
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

		// Add misc textarea event handler
		const miscTextarea = root.querySelector('[data-action="update-misc"]') as HTMLTextAreaElement;
		if (miscTextarea) {
			miscTextarea.addEventListener('blur', async () => {
				await this.handleMiscUpdate(miscTextarea.value);
			});
		}
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
						showNotification('warn', 'Resource consumption modal not supported in this Foundry version');
						return;
					}

					// Open the consume resource modal
					await ConsumeResourceModal.open(characterSheet, action.costs, action.name, actorId);
				} catch (error) {
					console.error('Failed to open consume resource modal:', error);
					showNotification('error', 'Failed to open resource consumption modal');
				}
			});
		});

		// Generic input update handler for all input types
		// This uses the input's own setter to update state, keeping the VTT code truly generic
		const inputElements = root.querySelectorAll('[data-action="update-input"]') as NodeListOf<
			HTMLInputElement | HTMLSelectElement
		>;
		inputElements.forEach(element => {
			const eventType = element.tagName === 'SELECT' ? 'change' : 'change';
			element.addEventListener(eventType, () => {
				const inputKey = element.dataset.inputKey;
				if (!inputKey) return;

				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				// Recreate the actions section to get access to input setters
				const actionsSection = this.createActionsSection(characterSheet);

				// Find the input by key across all action type tabs
				let foundInput = null;
				for (const actionType of Object.values(ActionType)) {
					const tab = actionsSection.tabs[actionType];
					foundInput = tab.inputs.find(inp => inp.key === inputKey);
					if (foundInput) break;
				}

				if (foundInput) {
					// Call the input's setter with the value from the DOM
					if (foundInput instanceof DropdownInput) {
						const selectedIndex = parseInt((element as HTMLSelectElement).value);
						const selectedValue = foundInput.options[selectedIndex];
						if (selectedValue !== undefined) {
							foundInput.setter(selectedValue);
						}
					} else if (foundInput instanceof DistanceInput) {
						const value = parseInt((element as HTMLInputElement).value) || 0;
						foundInput.setter(Distance.of(value));
					} else if (foundInput instanceof NumberInput) {
						const value = parseInt((element as HTMLInputElement).value) || 0;
						foundInput.setter(value);
					}
				}

				// Re-render to update content
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		// Arcane control handlers
		const arcaneSchoolSelects = root.querySelectorAll(
			'[data-action="select-arcane-school"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneSchoolSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedSchoolIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneAttackOptionSelects = root.querySelectorAll(
			'[data-action="select-arcane-attack-option"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneAttackOptionSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedAttackOptionIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneCastingTimeSelects = root.querySelectorAll(
			'[data-action="select-arcane-casting-time"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneCastingTimeSelects.forEach(select => {
			select.addEventListener('change', () => {
				const newIndex = parseInt(select.value);
				this.#arcaneUIState.selectedCastingTimeIndex = newIndex;
				// Reset focus cost index when casting time changes (available options may have changed)
				this.#arcaneUIState.selectedFocusCostIndex = 0;
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneFocusCostSelects = root.querySelectorAll(
			'[data-action="select-arcane-focus-cost"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneFocusCostSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedFocusCostIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneRangeInputs = root.querySelectorAll('[data-action="set-arcane-range"]') as NodeListOf<HTMLInputElement>;
		arcaneRangeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const value = parseInt(input.value);
				this.#arcaneUIState.selectedRange = Distance.of(value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneSomaticSelects = root.querySelectorAll(
			'[data-action="select-arcane-somatic-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneSomaticSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedSomaticComponentIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneVerbalSelects = root.querySelectorAll(
			'[data-action="select-arcane-verbal-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneVerbalSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedVerbalComponentIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const arcaneFocalSelects = root.querySelectorAll(
			'[data-action="select-arcane-focal-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneFocalSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedFocalComponentIndex = parseInt(select.value);
				(this as unknown as { render: (force?: boolean) => void }).render(false);
			});
		});

		const spellAugmentationInputs = root.querySelectorAll(
			'[data-action="set-spell-augmentation"]',
		) as NodeListOf<HTMLInputElement>;
		spellAugmentationInputs.forEach(input => {
			input.addEventListener('change', () => {
				const spellSlug = input.dataset.spellSlug;
				const augmentationKey = input.dataset.augmentationKey;
				console.log(`HERE`, spellSlug, augmentationKey, input.value);
				if (spellSlug && augmentationKey) {
					if (!this.#arcaneUIState.spellAugmentationValues[spellSlug]) {
						this.#arcaneUIState.spellAugmentationValues[spellSlug] = {};
					}
					this.#arcaneUIState.spellAugmentationValues[spellSlug]![augmentationKey] = parseInt(input.value) || 0;
					console.log(this.#arcaneUIState.spellAugmentationValues);
					(this as unknown as { render: (force?: boolean) => void }).render(false);
				}
			});
		});

		// Arcane spell cost consumption
		const spellCostBoxes = root.querySelectorAll('[data-action="consume-spell-cost"]') as NodeListOf<HTMLElement>;
		spellCostBoxes.forEach(box => {
			box.addEventListener('click', async () => {
				const characterSheet = this.getCharacterSheet();
				const actorId = this.getCurrentActorId();
				if (!characterSheet || !actorId) return;

				try {
					// Get arcane data to find current cost configuration
					const arcaneData = this.prepareArcaneData(characterSheet);
					if (!arcaneData) return;

					// Check if modal is supported
					if (!ConsumeResourceModal.isSupported()) {
						showNotification('warn', 'Resource consumption modal not supported in this Foundry version');
						return;
					}

					// Open the consume resource modal with spell costs
					await ConsumeResourceModal.open(
						characterSheet,
						arcaneData.arcaneSection.fundamentalSpellCost.actionCosts,
						'Fundamental Arcane Spell',
						actorId,
					);
				} catch (error) {
					console.error('Failed to open spell cost modal:', error);
					showNotification('error', 'Failed to open spell cost modal');
				}
			});
		});

		// Fundamental spell roll
		const fundamentalSpellButtons = root.querySelectorAll(
			'[data-action="fundamental-spell-roll"]',
		) as NodeListOf<HTMLElement>;
		fundamentalSpellButtons.forEach(btn => {
			btn.addEventListener('click', async (event: MouseEvent) => {
				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				try {
					// Get arcane data to find fundamental spell modifier
					const arcaneData = this.prepareArcaneData(characterSheet);
					if (!arcaneData) return;

					const useModal = event.shiftKey === false;
					await this.rollDice({
						check: arcaneData.fundamentalCheck,
						targetDC: 15, // TODO: reconsider
						useModal,
					});
				} catch (error) {
					console.error('Failed to roll fundamental spell:', error);
					showNotification('error', 'Failed to roll fundamental spell');
				}
			});
		});

		// Individual spell rolls
		const spellRollButtons = root.querySelectorAll('[data-action="spell-roll"]') as NodeListOf<HTMLElement>;
		spellRollButtons.forEach(btn => {
			btn.addEventListener('click', async (event: MouseEvent) => {
				const spellSlug = btn.dataset.spellSlug;
				if (!spellSlug) return;

				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				try {
					// Get arcane data to find the specific spell
					const arcaneData = this.prepareArcaneData(characterSheet);
					if (!arcaneData) return;

					const spell = arcaneData.arcaneSection.spells.find(s => s.slug === spellSlug);
					if (!spell) return;

					const spellCheck = spell.boxes.map(box => box.data).find(data => data instanceof ActionRowCheckBox) as
						| ActionRowCheckBox
						| undefined;
					if (spellCheck === undefined) {
						showNotification('warn', 'No check data found for spell');
						return;
					}
					const useModal = event.shiftKey === false;

					await this.rollDice({
						check: spellCheck.check,
						targetDC: spellCheck.targetDC,
						useModal,
					});
				} catch (error) {
					console.error('Failed to roll spell:', error);
					showNotification('error', 'Failed to roll spell');
				}
			});
		});

		// Action check rolls
		const actionCheckButtons = root.querySelectorAll('[data-action="roll-action-check"]') as NodeListOf<HTMLElement>;
		actionCheckButtons.forEach(btn => {
			const handleClick = async (event: MouseEvent) => {
				const actionSlug = btn.dataset.actionSlug;
				const parameterIndex = btn.dataset.parameterIndex;

				if (!actionSlug || parameterIndex === undefined) return;

				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				try {
					// Recreate the actions section with current UI state to get pre-computed data
					const actionsSection = this.createActionsSection(characterSheet, true);

					// Find the action and parameter in the pre-computed data
					const paramIndex = parseInt(parameterIndex);
					let actionTabItem: ActionRow | undefined;
					let actionTabParameter: ActionRowBox | undefined;

					// Search through all action types to find the matching action and parameter
					for (const actionType of Object.values(ActionType)) {
						const tab = actionsSection.tabs[actionType];
						actionTabItem = tab.actions.find(item => item.slug === actionSlug);
						if (actionTabItem) {
							actionTabParameter = actionTabItem.boxes[paramIndex];
							break;
						}
					}

					if (!actionTabItem || !actionTabParameter) {
						console.warn('Could not find action or parameter in pre-computed data');
						return;
					}

					// Check if this is actually a check parameter
					if (!(actionTabParameter.data instanceof ActionRowCheckBox)) {
						console.warn('Parameter is not a check parameter');
						return;
					}

					const checkData = actionTabParameter.data;
					const { check, targetDC } = checkData;

					const useModal = event.shiftKey === false;
					await this.rollDice({
						check,
						targetDC,
						useModal,
					});
				} catch (err) {
					console.error('Failed to roll action check:', err);
					showNotification('error', 'Failed to roll action check');
				}
			};

			btn.addEventListener('click', handleClick);
		});
	}

	private async handleResourceChange(resource: Resource, delta: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const { changeActorResource } = await import('./update-actor-resources.js');
			const newValue = await changeActorResource(actor, resource, delta);

			// Update the resource value directly in the DOM for instant feedback
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (root) {
				const resourceValueElement = root
					.querySelector(`[data-resource="${resource}"]`)
					?.closest('.resource-control')
					?.querySelector('.resource-value');
				if (resourceValueElement) {
					const props = getCharacterProps(actor);
					const updatedCharacterSheet = CharacterSheet.from({ ...props, [resource]: newValue.toString() });
					const updatedResourceInfo = updatedCharacterSheet.getResource(resource);
					resourceValueElement.textContent = `${updatedResourceInfo.current}/${updatedResourceInfo.max}`;
				}
			}
		} catch (err) {
			console.error('Failed to update resource:', err);
			showNotification('error', 'Failed to update resource');
		}
	}

	private async handleLongRest(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const { performLongRest } = await import('./update-actor-resources.js');
			await performLongRest(actor);

			// Clear 3 ranks of exhaustion
			this.#exhaustionRank = Math.max(0, this.#exhaustionRank - 3);
			await this.saveExhaustionToActor();

			showNotification(
				'info',
				'Long rest complete: all points refilled except heroism, +1 heroism point, -3 exhaustion ranks',
			);
		} catch (err) {
			console.error('Failed to perform long rest:', err);
			showNotification('error', 'Failed to perform long rest');
		}
	}

	private async handleShortRest(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			// Restore all resources except heroism
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const updatedProps = { ...currentProps };

			Object.values(Resource).forEach(resource => {
				if (resource !== Resource.HeroismPoint) {
					const { max } = characterSheet.getResource(resource);
					updatedProps[resource] = max.toString();
				}
			});

			const { updateActorResources } = await import('./update-actor-resources.js');
			await updateActorResources(actor, updatedProps);

			// Add 1 rank of exhaustion
			this.#exhaustionRank += 1;
			await this.saveExhaustionToActor();

			showNotification('info', 'Short rest complete: all points refilled except heroism, +1 exhaustion rank');
		} catch (err) {
			console.error('Failed to perform short rest:', err);
			showNotification('error', 'Failed to perform short rest');
		}
	}

	private async handleExhaustionChange(delta: number): Promise<void> {
		const newRank = Math.max(0, this.#exhaustionRank + delta);

		if (newRank === this.#exhaustionRank) {
			return; // No change needed
		}

		const action = delta > 0 ? 'increase' : 'decrease';
		const confirmed = await confirmAction({
			title: `${action === 'increase' ? 'Increase' : 'Decrease'} Exhaustion`,
			message: `Are you sure you want to ${action} exhaustion from ${this.#exhaustionRank} to ${newRank} ranks?`,
		});

		if (confirmed) {
			this.#exhaustionRank = newRank;
			await this.saveExhaustionToActor();

			// Update the UI immediately
			const root = (this as unknown as { element?: HTMLElement }).element;
			if (root) {
				const exhaustionValueElement = root.querySelector('.exhaustion-value');
				if (exhaustionValueElement) {
					exhaustionValueElement.textContent = this.#exhaustionRank.toString();
				}
			}
		}
	}

	private async handleMiscUpdate(value: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const { updateActorResources } = await import('./update-actor-resources.js');
			const currentProps = parseCharacterProps(actor);
			const updatedProps = { ...currentProps, misc: value.trim() };
			await updateActorResources(actor, updatedProps);
		} catch (err) {
			console.error('Failed to update misc:', err);
			showNotification('error', 'Failed to update misc notes');
		}
	}

	private async handleRawStatRoll({
		statType,
		useModal,
	}: {
		statType: StatType | DerivedStatType;
		useModal: boolean;
	}): Promise<void> {
		const statModifier = this.getStatModifier(statType);
		if (!statModifier) {
			return showNotification('warn', `Failed to get stat modifier for ${statType}`);
		}
		await this.rollDice({
			check: new Check({
				mode: CheckMode.Static,
				nature: CheckNature.Active,
				descriptor: statType.toString(),
				statModifier,
			}),
			targetDC: undefined,
			useModal: useModal,
		});
	}

	private async handleWeaponAttack({
		weaponMode,
		useModal,
	}: {
		weaponMode: WeaponModeOption;
		useModal: boolean;
	}): Promise<void> {
		const attackStat = weaponMode.mode.statType;
		const weaponModifier = weaponMode.getEquipmentModifier();
		const cms = weaponModifier ? [weaponModifier] : [];
		const statModifier = this.getStatModifier(attackStat, cms);
		if (!statModifier) {
			return showNotification('warn', 'Failed to get stat modifier for weapon attack');
		}

		const check = new Check({
			mode: CheckMode.Contested,
			nature: CheckNature.Active,
			descriptor: weaponMode.weapon.name,
			statModifier,
		});

		await this.rollDice({
			check,
			targetDC: undefined,
			useModal,
		});
	}

	private getStatModifier(
		stat: StatType | DerivedStatType,
		cms: CircumstanceModifier[] = [],
	): StatModifier | undefined {
		try {
			const characterSheet = this.getCharacterSheet();
			if (!characterSheet) return undefined;

			const statTree = characterSheet.getStatTree();
			return statTree.getModifier(stat, cms);
		} catch (err) {
			console.warn('Failed to get stat breakdown:', err);
			return undefined;
		}
	}

	private parseStatType(statTypeName: string): StatType | DerivedStatType {
		const stats = StatType.values;
		const candidate = stats.filter(s => s.name === statTypeName)[0];
		return candidate ?? (statTypeName as DerivedStatType);
	}

	private async rollDice({
		check,
		targetDC,
		useModal,
	}: {
		check: Check;
		targetDC: number | undefined;
		useModal: boolean;
	}): Promise<void> {
		await rollDice({
			actorId: this.getCurrentActorId()!,
			characterName: this.getCharacterSheet()?.name ?? 'Unknown',
			check,
			targetDC,
			useModal,
		});
	}
}
