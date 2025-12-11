import {
	ActionRow,
	ActionRowCheckBox,
	ActionsSection,
	ActionTabInputValues,
	ActionType,
	ArcaneSection,
	ArcaneSectionDefaults,
	ArcaneSectionInputValues,
	ArcaneSpellComponentType,
	ArcaneFocus,
	Armor,
	CharacterSheet,
	Check,
	CheckFactory,
	CheckMode,
	CheckNature,
	CircumstanceModifier,
	CircumstancesSection,
	Condition,
	CONDITIONS,
	Consequence,
	CONSEQUENCES,
	DerivedStatType,
	Distance,
	DistanceInput,
	DivineSection,
	DropdownInput,
	FeatsSection,
	firstParagraph,
	NodeStatModifier,
	NumberInput,
	OtherItem,
	PassiveCoverType,
	PRIMARY_WEAPON_TYPES,
	Resource,
	RESOURCES,
	Shield,
	StatNode,
	StatType,
	Weapon,
	WeaponModeOption,
	ResourceCost,
} from '@shattered-wilds/commons';
import { prepareActionRow } from '../action-row-renderer.js';
import { ActorLike, createHandlebarsActorSheetBase, getActorById, showNotification } from '../foundry-shim.js';
import {
	ensureActorDataPersistence,
	exportActorPropsToShareString,
	getCharacterProps,
	importActorPropsFromShareString,
	parseCharacterProps,
	parseCharacterSheet,
} from '../helpers/character.js';
import { rollDice } from '../helpers/dice.js';
import {
	changeActorResource,
	updateActorProps,
	performLongRest,
	syncResourcesToSystemData,
} from '../helpers/resources.js';
import { prepareInputForTemplate } from '../input-renderer.js';
import { configureDefaultTokenBars } from '../token-bars.js';
import { ConsumeResourceModal } from './consume-resource-modal.js';
import { syncConditionsToTokens } from '../helpers/conditions.js';
import { confirmAction } from './modals.js';
import { addConditionModal } from './condition-modal.js';
import { addConsequenceModal } from './consequence-modal.js';
import { EquipmentEditorModal } from './equipment-editor-modal.js';

const HandlebarsActorSheetBase = createHandlebarsActorSheetBase();

export class SWActorSheetV2 extends HandlebarsActorSheetBase {
	#activeTab: string = 'stats'; // Store the current active tab
	#context: Record<string, unknown> | null = null; // Cache the prepared context

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

	private getCurrentActor(): ActorLike {
		return this.actor;
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
		const armors = equipment.armors();

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
		const shields = equipment.shields();

		if (this.#actionsUIState.selectedShield !== null && this.#actionsUIState.selectedShield < shields.length) {
			const shield = shields[this.#actionsUIState.selectedShield];
			return shield || 'None';
		}
		return 'None';
	}

	private createActionTabInputValues(): ActionTabInputValues {
		const selectedWeapon = this.getSelectedWeapon();
		return new ActionTabInputValues({
			selectedWeaponMode: selectedWeapon || Weapon.unarmed,
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
			const armors = characterSheet.equipment.armors();
			const shields = characterSheet.equipment.shields();

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

	static override get DEFAULT_OPTIONS() {
		return { window: { title: 'Shattered Wilds' } } as Record<string, unknown>;
	}

	static PARTS = {
		content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
	};

	override async _prepareContext(): Promise<Record<string, unknown>> {
		const actorLike = this.actor;
		const currentActorId = actorLike?.id;

		const actor = actorLike || getActorById(currentActorId);

		// Get character props using robust method with multiple fallbacks
		const props = actor ? parseCharacterProps(actor) : {};
		const characterSheet = actor ? parseCharacterSheet(actor) : undefined;

		// Ensure actor data persistence for future token creation
		if (actor && !characterSheet) {
			await ensureActorDataPersistence(actor);
		}

		// Use centralized character parsing logic
		const resources: Record<string, { current: number; max: number }> = {};
		let resourcesArray: Array<{ key: string; fullName: string; shortCode: string; current: number; max: number }> = [];
		let statTreeData: unknown = null;

		try {
			if (characterSheet) {
				// Configure default token bars (one-time setup)
				await configureDefaultTokenBars(actor);

				// Sync resources to actor system data for token bars
				await syncResourcesToSystemData(actor, characterSheet);

				// Sync conditions to token status effects
				syncConditionsToTokens(actor, characterSheet);

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
						fullName: definition.fullName,
						shortCode: definition.shortCode,
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
					realms: StatType.realms.map(realmType => {
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

		const context = {
			actor,
			flags: actor?.flags ?? {},
			characterSheet,
			props,
			resources,
			resourcesArray,
			derivedStatsData,
			statTreeData,
			featsData: this.prepareFeatsData(characterSheet),
			personalityData: this.preparePersonalityData(characterSheet),
			miscData: this.prepareMiscData(characterSheet),
			equipmentData: this.prepareEquipmentData(characterSheet),
			actionsData: this.prepareActionsData(characterSheet),
			arcaneData: this.prepareArcaneData(characterSheet),
			divineData: this.prepareDivineData(characterSheet),
			circumstanceData: this.prepareCircumstanceData(characterSheet),
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isCircumstancesTabActive: this.#activeTab === 'circumstances',
			isFeatsTabActive: this.#activeTab === 'feats',
			isPersonalityTabActive: this.#activeTab === 'personality',
			isMiscTabActive: this.#activeTab === 'misc',
			isEquipmentTabActive: this.#activeTab === 'equipment',
			isActionsTabActive: this.#activeTab === 'actions',
			isArcaneTabActive: this.#activeTab === 'arcane',
			isDivineTabActive: this.#activeTab === 'divine',
			isDebugTabActive: this.#activeTab === 'debug',
		};
		this.#context = context;
		return context;
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
		const actorLike = this.actor;
		const currentActorId = actorLike?.id;
		const actor = actorLike || getActorById(currentActorId);

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
		const actorLike = this.actor;
		const currentActorId = actorLike?.id;
		const actor = actorLike || getActorById(currentActorId);

		if (!actor) {
			return null;
		}

		// Extract misc prop
		const props = parseCharacterProps(actor);
		const miscValue = props['misc'] ?? '';

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

			const items = equipment.items.map((item, index) => {
				const baseItem = {
					index,
					name: item.name,
					description: item.displayText,
					traits: [] as string[],
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

				if (item instanceof ArcaneFocus) {
					return {
						...baseItem,
						itemType: 'Arcane Focus',
						headerDisplay: `<strong>${item.name}</strong> - ${item.description}`,
						traits: item.traits,
						arcaneFocusInfo: {
							bonus: item.bonus.description,
							spCost: item.spCost,
							details: item.details || null,
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
					value: `${cost.amount} ${RESOURCES[cost.resource as Resource].shortCode}`,
					insufficient,
				};
			});

			const costTooltip = costs.map(c => c.value).join('\n');
			const canAfford = costs.every(c => !c.insufficient);

			const fundamentalCheck = arcaneSection.fundamentalCheck;

			const spells = arcaneSection.spells.map(row => {
				const variableValues = this.#arcaneUIState.spellAugmentationValues[row.slug];
				return prepareActionRow(row, characterSheet, variableValues ? { variableValues } : {});
			});

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

	prepareDivineData(characterSheet: CharacterSheet | undefined) {
		if (!characterSheet) {
			return null;
		}

		try {
			const divineSection = DivineSection.create({
				characterId: this.getCurrentActorId() || '',
				characterSheet,
			});

			if (!divineSection) {
				return null;
			}

			// Prepare header data (base modifier and influence range)
			const header = {
				baseModifier: {
					name: divineSection.baseModifier.name,
					value: divineSection.baseModifier.value.description,
					description: divineSection.baseModifier.description,
				},
				influenceRange: {
					value: divineSection.influenceRange.value.description,
					description: divineSection.influenceRange.description,
				},
			};

			// Prepare the pure divine channeling action row
			const pureDivineChanneling = prepareActionRow(divineSection.pureDivineChanneling, characterSheet);

			return {
				divineSection,
				header,
				pureDivineChanneling,
			};
		} catch (err) {
			console.warn('Failed to prepare divine data:', err);
			return null;
		}
	}

	prepareCircumstanceData(characterSheet: CharacterSheet | undefined): Record<string, unknown> | null {
		if (!characterSheet) {
			return null;
		}

		try {
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			// Prepare resource data
			const resources = Object.values(Resource).map(resource => {
				const value = circumstancesSection.resources[resource];
				const definition = RESOURCES[resource];
				return {
					key: resource,
					shortName: definition.shortName,
					shortCode: definition.shortCode,
					fullName: definition.fullName,
					color: definition.color,
					current: value.current,
					max: value.max,
					progress: value.max > 0 ? value.current / value.max : 0,
				};
			}); // Prepare conditions data with ranks
			const conditions = circumstancesSection.conditions.map(c => {
				const def = CONDITIONS[c.condition];
				return {
					key: c.condition,
					name: c.condition,
					rank: c.rank,
					description: firstParagraph(def.description),
					ranked: def.ranked,
					icon: this.getConditionIcon(c.condition),
				};
			});

			// Prepare consequences data with ranks
			const consequences = circumstancesSection.consequences.map(c => {
				const def = CONSEQUENCES[c.consequence];
				return {
					key: c.consequence,
					name: c.consequence,
					rank: c.rank,
					description: firstParagraph(def.description),
					ranked: def.ranked,
					descriptionForRank: def.descriptionForRank,
				};
			});

			// Prepare other circumstances
			const otherCircumstances = circumstancesSection.otherCircumstances;

			return {
				resources,
				conditions,
				consequences,
				otherCircumstances,
			};
		} catch (err) {
			console.warn('Failed to create circumstances section:', err);
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

	override async _onRender(): Promise<void> {
		const root = this.element;
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
				this.render(false);
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

		// Add resource change handlers
		const resourceBtns = root.querySelectorAll('[data-action="resource-change"]') as NodeListOf<HTMLButtonElement>;
		resourceBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const resource = btn.dataset.resource as Resource;
				const delta = parseInt(btn.dataset.delta || '0');
				if (!resource || delta === 0) return;

				await this.handleResourceChange(resource, delta);
			});
		});

		// Add end turn button handler
		const endTurnBtn = root.querySelector('[data-action="end-turn"]') as HTMLButtonElement | null;
		if (endTurnBtn) {
			endTurnBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				await this.handleEndTurn();
			});
		}

		const longRestBtn = root.querySelector('[data-action="long-rest"]') as HTMLButtonElement | null;
		if (longRestBtn) {
			longRestBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
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
			shortRestBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
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

		// Add condition handlers
		const addConditionBtn = root.querySelector('[data-action="add-condition"]') as HTMLButtonElement | null;
		if (addConditionBtn) {
			addConditionBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				await this.handleAddCondition();
			});
		}

		const removeConditionBtns = root.querySelectorAll(
			'[data-action="remove-condition"]',
		) as NodeListOf<HTMLButtonElement>;
		removeConditionBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const condition = btn.dataset.condition;
				if (condition) {
					await this.handleRemoveCondition(condition);
				}
			});
		});

		const adjustConditionRankBtns = root.querySelectorAll(
			'[data-action="adjust-condition-rank"]',
		) as NodeListOf<HTMLButtonElement>;
		adjustConditionRankBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const condition = btn.dataset.condition;
				const delta = parseInt(btn.dataset.delta || '0');
				if (condition && delta !== 0) {
					await this.handleAdjustConditionRank(condition, delta);
				}
			});
		});

		// Add consequence handlers
		const addConsequenceBtn = root.querySelector('[data-action="add-consequence"]') as HTMLButtonElement | null;
		if (addConsequenceBtn) {
			addConsequenceBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				await this.handleAddConsequence();
			});
		}

		const removeConsequenceBtns = root.querySelectorAll(
			'[data-action="remove-consequence"]',
		) as NodeListOf<HTMLButtonElement>;
		removeConsequenceBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const consequence = btn.dataset.consequence;
				if (consequence) {
					await this.handleRemoveConsequence(consequence);
				}
			});
		});

		const adjustConsequenceRankBtns = root.querySelectorAll(
			'[data-action="adjust-consequence-rank"]',
		) as NodeListOf<HTMLButtonElement>;
		adjustConsequenceRankBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const consequence = btn.dataset.consequence;
				const delta = parseInt(btn.dataset.delta || '0');
				if (consequence && delta !== 0) {
					await this.handleAdjustConsequenceRank(consequence, delta);
				}
			});
		});

		// Add other circumstances handlers
		const addOtherCircumstanceBtn = root.querySelector(
			'[data-action="add-other-circumstance"]',
		) as HTMLButtonElement | null;
		if (addOtherCircumstanceBtn) {
			addOtherCircumstanceBtn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const input = root.querySelector('[data-new-circumstance]') as HTMLInputElement | null;
				if (input?.value.trim()) {
					await this.handleAddOtherCircumstance(input.value.trim());
					input.value = '';
				}
			});
		}

		const removeOtherCircumstanceBtns = root.querySelectorAll(
			'[data-action="remove-other-circumstance"]',
		) as NodeListOf<HTMLButtonElement>;
		removeOtherCircumstanceBtns.forEach(btn => {
			btn.addEventListener('click', async event => {
				event.preventDefault();
				event.stopPropagation();
				const index = parseInt(btn.dataset.circumstanceIndex || '-1');
				if (index >= 0) {
					await this.handleRemoveOtherCircumstance(index);
				}
			});
		});

		// Handle other circumstance input changes
		const otherCircumstanceInputs = root.querySelectorAll(
			'.other-circumstance-input[data-circumstance-index]',
		) as NodeListOf<HTMLInputElement>;
		otherCircumstanceInputs.forEach(input => {
			input.addEventListener('change', async () => {
				const index = parseInt(input.dataset.circumstanceIndex || '-1');
				if (index >= 0) {
					await this.handleUpdateOtherCircumstance(index, input.value.trim());
				}
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

		// Add shield block roll handlers
		const shieldBlockButtons = root.querySelectorAll('[data-action="roll-shield-block"]') as NodeListOf<HTMLElement>;
		shieldBlockButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const sheet = this.getCharacterSheet();
				if (!sheet) {
					showNotification('warn', 'Character sheet data not found');
					return;
				}
				const parentItem = btn.closest('.equipment-item') as HTMLElement | null;
				const indexAttr = btn.dataset.itemIndex ?? parentItem?.dataset.itemId;
				const itemIndex = indexAttr ? parseInt(indexAttr, 10) : NaN;
				if (Number.isNaN(itemIndex)) {
					showNotification('warn', 'Shield not found for this entry');
					return;
				}
				const item = sheet.equipment.items[itemIndex];
				if (!(item instanceof Shield)) {
					showNotification('warn', 'Selected item is not a shield');
					return;
				}
				const useModal = event.shiftKey === false;
				await this.handleShieldBlock({ shield: item, useModal });
			});
		});

		// Add shield bash roll handlers
		const shieldBashButtons = root.querySelectorAll('[data-action="roll-shield-bash"]') as NodeListOf<HTMLElement>;
		shieldBashButtons.forEach(btn => {
			btn.addEventListener('click', async event => {
				const useModal = event.shiftKey === false;
				await this.handleShieldBash({ useModal });
			});
		});

		const addEquipmentButton = root.querySelector('[data-action="add-equipment-item"]') as HTMLButtonElement | null;
		if (addEquipmentButton) {
			addEquipmentButton.addEventListener('click', async () => {
				await this.openEquipmentEditor();
			});
		}

		const editEquipmentButtons = root.querySelectorAll(
			'[data-action="edit-equipment-item"]',
		) as NodeListOf<HTMLButtonElement>;
		editEquipmentButtons.forEach(btn => {
			btn.addEventListener('click', async () => {
				const indexAttr = btn.dataset.itemIndex;
				const itemIndex = indexAttr ? parseInt(indexAttr, 10) : NaN;
				if (Number.isNaN(itemIndex)) {
					showNotification('warn', 'Could not determine equipment entry to edit');
					return;
				}
				await this.openEquipmentEditor(itemIndex);
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
			// Get the value from the prepared context
			const miscData = this.#context?.miscData as { value: string } | undefined;
			if (miscData?.value !== undefined) {
				miscTextarea.value = miscData.value;
			}
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
				this.render(false);
			});
		});

		// Show All checkbox
		const showAllCheckbox = root.querySelector('[data-action="toggle-actions-show-all"]') as HTMLInputElement | null;
		if (showAllCheckbox) {
			showAllCheckbox.addEventListener('change', () => {
				this.#actionsUIState.showAll = showAllCheckbox.checked;
				// Re-render to update filtered actions
				this.render(false);
			});
		}

		// Action cost consumption
		const costBoxes = root.querySelectorAll('[data-action="consume-action-cost"]') as NodeListOf<HTMLElement>;
		costBoxes.forEach(box => {
			box.addEventListener('click', async () => {
				const actionSlug = box.dataset.actionSlug;
				if (!actionSlug) return;

				const characterSheet = this.getCharacterSheet();
				const actorId = this.getCurrentActorId();
				if (!characterSheet || !actorId) return;

				let actionName: string | undefined;
				let actionCosts: ResourceCost[] | undefined;

				// Try to find the action in all sections by slug
				// Check actions tab - note: actions are already prepared for template
				const actionsData = this.prepareActionsData(characterSheet);
				if (actionsData) {
					for (const tab of actionsData.tabs as Array<{
						key: string;
						actions: Array<{
							slug: string;
							name: string;
							costs: Array<{ value: string; resource: Resource; insufficient: boolean }>;
						}>;
					}>) {
						const action = tab.actions.find(a => a.slug === actionSlug);
						if (action) {
							actionName = action.name;
							// Need to get the original ActionRow to access cost.actionCosts
							// Find it in the ActionsSection
							const actionsSection = this.createActionsSection(characterSheet);
							const actionType = tab.key as ActionType;
							const originalAction = actionsSection.tabs[actionType]?.actions.find(
								(a: ActionRow) => a.slug === actionSlug,
							);
							actionCosts = originalAction?.cost?.actionCosts || [];
							break;
						}
					}
				}

				// Check divine tab
				if (!actionName) {
					const divineData = this.prepareDivineData(characterSheet);
					if (divineData && divineData.pureDivineChanneling.slug === actionSlug) {
						const divineSection = divineData.divineSection;
						actionName = divineSection.pureDivineChanneling.title;
						actionCosts = divineSection.pureDivineChanneling.cost?.actionCosts || [];
					}
				}

				// Check arcane tab
				if (!actionName) {
					const arcaneData = this.prepareArcaneData(characterSheet);
					if (arcaneData) {
						const spell = arcaneData.arcaneSection.spells.find((s: ActionRow) => s.slug === actionSlug);
						if (spell) {
							actionName = spell.title;
							actionCosts = spell.cost?.actionCosts || [];
						}
					}
				}

				if (!actionName || !actionCosts) {
					console.warn('Action not found:', actionSlug);
					return;
				}

				try {
					// Check if modal is supported

					// Open the consume resource modal
					await ConsumeResourceModal.open(characterSheet, actionCosts, actionName, actorId);
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
				this.render(false);
			});
		});

		// Arcane control handlers
		const arcaneSchoolSelects = root.querySelectorAll(
			'[data-action="select-arcane-school"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneSchoolSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedSchoolIndex = parseInt(select.value);
				this.render(false);
			});
		});

		const arcaneAttackOptionSelects = root.querySelectorAll(
			'[data-action="select-arcane-attack-option"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneAttackOptionSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedAttackOptionIndex = parseInt(select.value);
				this.render(false);
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
				this.render(false);
			});
		});

		const arcaneFocusCostSelects = root.querySelectorAll(
			'[data-action="select-arcane-focus-cost"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneFocusCostSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedFocusCostIndex = parseInt(select.value);
				this.render(false);
			});
		});

		const arcaneRangeInputs = root.querySelectorAll('[data-action="set-arcane-range"]') as NodeListOf<HTMLInputElement>;
		arcaneRangeInputs.forEach(input => {
			input.addEventListener('change', () => {
				const value = parseInt(input.value);
				this.#arcaneUIState.selectedRange = Distance.of(value);
				this.render(false);
			});
		});

		const arcaneSomaticSelects = root.querySelectorAll(
			'[data-action="select-arcane-somatic-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneSomaticSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedSomaticComponentIndex = parseInt(select.value);
				this.render(false);
			});
		});

		const arcaneVerbalSelects = root.querySelectorAll(
			'[data-action="select-arcane-verbal-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneVerbalSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedVerbalComponentIndex = parseInt(select.value);
				this.render(false);
			});
		});

		const arcaneFocalSelects = root.querySelectorAll(
			'[data-action="select-arcane-focal-component"]',
		) as NodeListOf<HTMLSelectElement>;
		arcaneFocalSelects.forEach(select => {
			select.addEventListener('change', () => {
				this.#arcaneUIState.selectedFocalComponentIndex = parseInt(select.value);
				this.render(false);
			});
		});

		// Variable parameter inputs (for spell augmentation, etc.)
		const variableInputs = root.querySelectorAll(
			'[data-action="set-variable-parameter"]',
		) as NodeListOf<HTMLInputElement>;
		variableInputs.forEach(input => {
			input.addEventListener('change', () => {
				const actionSlug = input.dataset.actionSlug;
				const parameterKey = input.dataset.parameterKey;
				if (actionSlug && parameterKey) {
					// Store in arcane state for now (could be extended for other types)
					if (!this.#arcaneUIState.spellAugmentationValues[actionSlug]) {
						this.#arcaneUIState.spellAugmentationValues[actionSlug] = {};
					}
					this.#arcaneUIState.spellAugmentationValues[actionSlug]![parameterKey] = parseInt(input.value) || 0;
					this.render(false);
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

		// Unified check roll handler for all action rows (actions, spells, divine channeling)
		const checkButtons = root.querySelectorAll('[data-action="roll-check"]') as NodeListOf<HTMLElement>;
		checkButtons.forEach(btn => {
			btn.addEventListener('click', async (event: MouseEvent) => {
				const actionSlug = btn.dataset.actionSlug;
				const parameterIndex = btn.dataset.parameterIndex;

				if (!actionSlug || parameterIndex === undefined) return;

				const characterSheet = this.getCharacterSheet();
				if (!characterSheet) return;

				try {
					const useModal = event.shiftKey === false;
					const paramIndex = parseInt(parameterIndex);

					// Try to find the action in different sections
					let checkData: ActionRowCheckBox | undefined;

					// First, try divine channeling
					const divineData = this.prepareDivineData(characterSheet);
					if (divineData && divineData.divineSection.pureDivineChanneling.slug === actionSlug) {
						const checkBox = divineData.divineSection.pureDivineChanneling.boxes[paramIndex];
						if (checkBox && checkBox.data instanceof ActionRowCheckBox) {
							checkData = checkBox.data;
						}
					}

					// If not found, try arcane spells
					if (!checkData) {
						const arcaneData = this.prepareArcaneData(characterSheet);
						if (arcaneData) {
							const spell = arcaneData.arcaneSection.spells.find(s => s.slug === actionSlug);
							if (spell) {
								const checkBox = spell.boxes[paramIndex];
								if (checkBox && checkBox.data instanceof ActionRowCheckBox) {
									checkData = checkBox.data;
								}
							}
						}
					}

					// If still not found, try actions section
					if (!checkData) {
						const actionsSection = this.createActionsSection(characterSheet, true);
						for (const actionType of Object.values(ActionType)) {
							const tab = actionsSection.tabs[actionType];
							const action = tab.actions.find(item => item.slug === actionSlug);
							if (action) {
								const checkBox = action.boxes[paramIndex];
								if (checkBox && checkBox.data instanceof ActionRowCheckBox) {
									checkData = checkBox.data;
									break;
								}
							}
						}
					}

					if (!checkData) {
						console.warn('Could not find check data for action:', actionSlug);
						return;
					}

					await this.rollDice({
						check: checkData.check,
						targetDC: checkData.targetDC,
						useModal,
					});
				} catch (err) {
					console.error('Failed to roll check:', err);
					showNotification('error', 'Failed to roll check');
				}
			});
		});
	}

	private async handleResourceChange(resource: Resource, delta: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const newValue = await changeActorResource(actor, resource, delta);

			// Update the resource value directly in the DOM for instant feedback
			const root = this.element;
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

	private async handleEndTurn(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			// Restore Action Points to max
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const { max } = characterSheet.getResource(Resource.ActionPoint);

			const updatedProps = {
				...currentProps,
				[Resource.ActionPoint]: max.toString(),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', 'Turn ended: Action Points restored');
		} catch (err) {
			console.error('Failed to end turn:', err);
			showNotification('error', 'Failed to end turn');
		}
	}

	private async handleLongRest(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			await performLongRest(actor);

			// Clear all conditions and adjust Exhaustion
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			// Remove 3 ranks of Exhaustion
			const newConsequences = circumstancesSection.consequences
				.map(c => {
					if (c.consequence === Consequence.Exhaustion) {
						const newRank = Math.max(0, c.rank - 3);
						return { ...c, rank: newRank };
					}
					return c;
				})
				.filter(c => c.rank > 0);

			const updatedProps = {
				...currentProps,
				conditions: '', // Clear all conditions
				consequences: CircumstancesSection.serializeConsequences(
					newConsequences.map(c => ({ name: c.consequence, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			// Note: Token conditions will be synced automatically when the sheet re-renders

			showNotification(
				'info',
				'Long rest complete: all points refilled, +1 heroism, cleared conditions, -3 exhaustion',
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
			const circumstancesSection = CircumstancesSection.create({ characterSheet });
			const updatedProps = { ...currentProps };

			Object.values(Resource).forEach(resource => {
				if (resource !== Resource.HeroismPoint) {
					const { max } = characterSheet.getResource(resource);
					updatedProps[resource] = max.toString();
				}
			});

			// Clear all conditions
			updatedProps.conditions = '';

			// Add 1 rank of Exhaustion
			const existingExhaustion = circumstancesSection.consequences.find(c => c.consequence === Consequence.Exhaustion);
			const newConsequences = circumstancesSection.consequences.filter(c => c.consequence !== Consequence.Exhaustion);
			if (existingExhaustion) {
				newConsequences.push({ ...existingExhaustion, rank: existingExhaustion.rank + 1 });
			} else {
				newConsequences.push({ consequence: Consequence.Exhaustion, rank: 1 });
			}

			updatedProps.consequences = CircumstancesSection.serializeConsequences(
				newConsequences.map(c => ({ name: c.consequence, rank: c.rank })),
			);

			await updateActorProps(actor, updatedProps);

			// Note: Token conditions will be synced automatically when the sheet re-renders

			showNotification(
				'info',
				'Short rest complete: all points refilled except heroism, cleared conditions, +1 exhaustion',
			);
		} catch (err) {
			console.error('Failed to perform short rest:', err);
			showNotification('error', 'Failed to perform short rest');
		}
	}

	private async handleAddCondition(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const existingConditions = new Set(circumstancesSection.conditions.map(c => c.condition));

			const result = await addConditionModal(existingConditions);
			if (!result?.condition) {
				return;
			}

			const conditionKey = result.condition as Condition;
			const conditionDef = CONDITIONS[conditionKey];
			const rank = conditionDef.ranked ? Math.max(1, result.rank ?? 1) : 0;

			const newConditions = [...circumstancesSection.conditions, { condition: conditionKey, rank }];

			const updatedProps = {
				...currentProps,
				conditions: CircumstancesSection.serializeConditions(
					newConditions.map(c => ({ name: c.condition, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', `Added: ${conditionKey}${rank > 0 ? ` (Rank ${rank})` : ''}`);
		} catch (err) {
			console.error('Failed to add condition:', err);
			showNotification('error', 'Failed to add condition');
		}
	}

	private async handleRemoveCondition(conditionKey: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const newConditions = circumstancesSection.conditions.filter(c => c.condition !== conditionKey);

			const updatedProps = {
				...currentProps,
				conditions: CircumstancesSection.serializeConditions(
					newConditions.map(c => ({ name: c.condition, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', `Removed condition: ${conditionKey}`);
		} catch (err) {
			console.error('Failed to remove condition:', err);
			showNotification('error', 'Failed to remove condition');
		}
	}

	private async handleAdjustConditionRank(conditionKey: string, delta: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			// Find the condition being adjusted
			let wasRemoved = false;
			const newConditions = circumstancesSection.conditions
				.map(c => {
					if (c.condition === conditionKey) {
						const newRank = Math.max(0, c.rank + delta);
						if (newRank === 0) {
							wasRemoved = true;
							return null; // Mark for removal
						}
						return { ...c, rank: newRank };
					}
					return c;
				})
				.filter(c => c !== null) as typeof circumstancesSection.conditions;

			const updatedProps = {
				...currentProps,
				conditions: CircumstancesSection.serializeConditions(
					newConditions.map(c => ({ name: c.condition, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			// Show notification
			if (wasRemoved) {
				showNotification('info', `Removed: ${conditionKey}`);
			} else {
				const updatedCondition = newConditions.find(c => c.condition === conditionKey);
				showNotification('info', `Updated ${conditionKey} rank to ${updatedCondition?.rank ?? 0}`);
			}
		} catch (err) {
			console.error('Failed to adjust condition rank:', err);
			showNotification('error', 'Failed to adjust condition rank');
		}
	}

	private async handleAddConsequence(): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			// Get list of consequences not already applied
			const existingConsequences = new Set(circumstancesSection.consequences.map(c => c.consequence));

			const result = await addConsequenceModal(existingConsequences);
			if (!result?.consequence) {
				return;
			}

			const consequenceKey = result.consequence as Consequence;
			const consequenceDef = CONSEQUENCES[consequenceKey];
			const rank = consequenceDef.ranked ? Math.max(1, result.rank ?? 1) : 0;

			const newConsequences = [...circumstancesSection.consequences, { consequence: consequenceKey, rank }];

			const updatedProps = {
				...currentProps,
				consequences: CircumstancesSection.serializeConsequences(
					newConsequences.map(c => ({ name: c.consequence, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', `Added: ${consequenceKey}${rank > 0 ? ` (Rank ${rank})` : ''}`);
		} catch (err) {
			console.error('Failed to add consequence:', err);
			showNotification('error', 'Failed to add consequence');
		}
	}

	private async handleRemoveConsequence(consequenceKey: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const newConsequences = circumstancesSection.consequences.filter(c => c.consequence !== consequenceKey);

			const updatedProps = {
				...currentProps,
				consequences: CircumstancesSection.serializeConsequences(
					newConsequences.map(c => ({ name: c.consequence, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', `Removed consequence: ${consequenceKey}`);
		} catch (err) {
			console.error('Failed to remove consequence:', err);
			showNotification('error', 'Failed to remove consequence');
		}
	}

	private async handleAdjustConsequenceRank(consequenceKey: string, delta: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			// Find the consequence being adjusted
			let wasRemoved = false;
			const newConsequences = circumstancesSection.consequences
				.map(c => {
					if (c.consequence === consequenceKey) {
						const newRank = Math.max(0, c.rank + delta);
						if (newRank === 0) {
							wasRemoved = true;
							return null; // Mark for removal
						}
						return { ...c, rank: newRank };
					}
					return c;
				})
				.filter(c => c !== null) as typeof circumstancesSection.consequences;

			const updatedProps = {
				...currentProps,
				consequences: CircumstancesSection.serializeConsequences(
					newConsequences.map(c => ({ name: c.consequence, rank: c.rank })),
				),
			};

			await updateActorProps(actor, updatedProps);

			// Show notification
			if (wasRemoved) {
				showNotification('info', `Removed: ${consequenceKey}`);
			} else {
				const updatedConsequence = newConsequences.find(c => c.consequence === consequenceKey);
				showNotification('info', `Updated ${consequenceKey} rank to ${updatedConsequence?.rank ?? 0}`);
			}
		} catch (err) {
			console.error('Failed to adjust consequence rank:', err);
			showNotification('error', 'Failed to adjust consequence rank');
		}
	}

	private async handleAddOtherCircumstance(value: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const newOtherCircumstances = [...circumstancesSection.otherCircumstances, value];

			const updatedProps = {
				...currentProps,
				otherCircumstances: CircumstancesSection.serializeOtherCircumstances(newOtherCircumstances),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', 'Added circumstance');
		} catch (err) {
			console.error('Failed to add other circumstance:', err);
			showNotification('error', 'Failed to add circumstance');
		}
	}

	private async handleRemoveOtherCircumstance(index: number): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const newOtherCircumstances = circumstancesSection.otherCircumstances.filter((_, i) => i !== index);

			const updatedProps = {
				...currentProps,
				otherCircumstances: CircumstancesSection.serializeOtherCircumstances(newOtherCircumstances),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', 'Removed circumstance');
		} catch (err) {
			console.error('Failed to remove other circumstance:', err);
			showNotification('error', 'Failed to remove circumstance');
		}
	}

	private async handleUpdateOtherCircumstance(index: number, value: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const characterSheet = CharacterSheet.from(currentProps);
			const circumstancesSection = CircumstancesSection.create({ characterSheet });

			const newOtherCircumstances = circumstancesSection.otherCircumstances.map((item, i) =>
				i === index ? value : item,
			);

			const updatedProps = {
				...currentProps,
				otherCircumstances: CircumstancesSection.serializeOtherCircumstances(newOtherCircumstances),
			};

			await updateActorProps(actor, updatedProps);

			showNotification('info', 'Updated circumstance');
		} catch (err) {
			console.error('Failed to update other circumstance:', err);
			showNotification('error', 'Failed to update circumstance');
		}
	}

	private async handleMiscUpdate(value: string): Promise<void> {
		const actor = this.getCurrentActor();
		if (!actor) {
			return showNotification('warn', 'Actor not found');
		}

		try {
			const currentProps = parseCharacterProps(actor);
			const updatedProps = { ...currentProps, misc: value.trim() };
			await updateActorProps(actor, updatedProps);
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
		const check = this.getStatCheck(statType);
		if (!check) {
			return showNotification('warn', `Failed to get stat check for ${statType}`);
		}

		await this.rollDice({
			check,
			targetDC: undefined,
			useModal: useModal,
		});
	}

	private getStatCheck(statType: StatType | DerivedStatType): Check | undefined {
		try {
			const characterSheet = this.getCharacterSheet();
			if (!characterSheet) return undefined;

			const checkFactory = new CheckFactory({ characterSheet });
			return checkFactory.stat({
				statType,
				mode: CheckMode.Static,
				nature: CheckNature.Active,
			});
		} catch (err) {
			console.warn('Failed to get stat breakdown:', err);
			return undefined;
		}
	}

	private async handleShieldBlock({ shield, useModal }: { shield: Shield; useModal: boolean }): Promise<void> {
		const characterSheet = this.getCharacterSheet();
		if (!characterSheet) {
			showNotification('warn', 'Character sheet data not found');
			return;
		}

		const checkFactory = new CheckFactory({ characterSheet });
		const armor = this.getSelectedArmor();
		const check = checkFactory.shield({ armor, shield });

		await this.rollDice({
			check,
			targetDC: undefined,
			useModal,
		});
	}

	private async handleShieldBash({ useModal }: { useModal: boolean }): Promise<void> {
		await this.handleWeaponAttack({ weaponMode: Weapon.shieldBash, useModal });
	}

	private async openEquipmentEditor(itemIndex?: number): Promise<void> {
		const actorId = this.getCurrentActorId();
		if (!actorId) {
			showNotification('warn', 'Actor not found');
			return;
		}

		try {
			await EquipmentEditorModal.open({
				actorId,
				...(itemIndex !== undefined ? { itemIndex } : {}),
				onUpdate: () => {
					void this.render(false);
				},
			});
		} catch (error) {
			console.error('Failed to open equipment editor modal:', error);
			showNotification('error', 'Failed to open equipment editor');
		}
	}

	private async handleWeaponAttack({
		weaponMode,
		useModal,
	}: {
		weaponMode: WeaponModeOption;
		useModal: boolean;
	}): Promise<void> {
		const check = this.getWeaponCheck(weaponMode);
		if (!check) {
			return showNotification('warn', `Failed to get weapon check for ${weaponMode.toString()}`);
		}

		await this.rollDice({
			check,
			targetDC: undefined,
			useModal,
		});
	}

	private getWeaponCheck(weaponMode: WeaponModeOption): Check | undefined {
		try {
			const characterSheet = this.getCharacterSheet();
			if (!characterSheet) return undefined;

			const checkFactory = new CheckFactory({ characterSheet });
			return checkFactory.weapon({ weaponMode });
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
