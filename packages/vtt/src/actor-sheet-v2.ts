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
import {
	CharacterSheet,
	Resource,
	RESOURCES,
	CurrentResources,
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
	#activeTab: string = 'stats'; // Store the current active tab

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
		let resourcesArray: Array<{ key: string; name: string; shortName: string; current: number; max: number }> = [];
		let statTreeData: unknown = null;

		try {
			if (Object.keys(props).length > 0) {
				characterSheet = CharacterSheet.from(props);

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

		return {
			actor,
			flags: actor.flags ?? {},
			props,
			characterSheet,
			resources,
			resourcesArray,
			statTreeData,
			activeTab: this.#activeTab,
			isStatsTabActive: this.#activeTab === 'stats',
			isDebugTabActive: this.#activeTab === 'debug',
		};
	}

	async _onRender(): Promise<void> {
		const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
		if (!root || !this.#actorId) return;

		// Restore tab state after re-render
		this.restoreTabState(root);
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
						// Shift+click opens the dice modal
						await this.handleStatRollModal(statType, modifier);
					} else {
						// Normal click does a quick roll
						await this.handleStatRoll(statType, modifier);
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
		const actor = getActorById(this.#actorId!) as unknown as {
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

			// DO NOT call render() here - we've already updated the DOM directly
			// getUI().notifications?.info(`${RESOURCES[resource].shortName} updated`);
		} catch (err) {
			console.error('Failed to update resource:', err);
			getUI().notifications?.error('Failed to update resource');
		}
	}

	private async handleRefillAllResources(): Promise<void> {
		const actor = getActorById(this.#actorId!) as unknown as {
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
			actorId: this.#actorId!,
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

				// Show the extra die roll with Dice So Nice
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

				// Show the luck die roll with Dice So Nice
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
			this.processEnhancedShatteredWildsRoll(roll, rollData, extraDice);
		} catch (err) {
			console.error('Failed to roll dice:', err);
			getUI().notifications?.error('Failed to roll dice');
		}
	}

	private async getAttributeValue(attributeName: string): Promise<number> {
		const actor = getActorById(this.#actorId!);
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
}
