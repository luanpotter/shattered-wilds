import { getApplicationV2Ctor, getHandlebarsApplicationMixin, getUI, getActorById } from './foundry-shim.js';
import { ActionCost, CharacterSheet, RESOURCES, Resource } from '@shattered-wilds/commons';

interface AdjustedCost extends ActionCost {
	adjustedAmount: number;
}

interface ConsumeResourceModalData {
	resources: Array<{
		displayName: string;
		current: number;
		max: number;
		adjustedAmount: number;
		variable: boolean;
		insufficient: boolean;
	}>;
	canAfford: boolean;
}

interface ConsumeResourceModalOptions {
	characterSheet: CharacterSheet;
	actionCosts: ActionCost[];
	actionName: string;
	actorId: string;
	onConfirm?: () => void;
}

const AppV2 = getApplicationV2Ctor();
const HbsMixin = getHandlebarsApplicationMixin();

let ConsumeResourceModalImpl: unknown;

if (AppV2 && HbsMixin) {
	const Mixed = HbsMixin(AppV2) as unknown as {
		new (options?: unknown): {
			close(): void;
			element?: HTMLElement;
			render(force?: boolean): Promise<unknown>;
		};
		DEFAULT_OPTIONS?: unknown;
	};

	class Impl extends Mixed {
		#options: ConsumeResourceModalOptions;
		private adjustedCosts: AdjustedCost[];

		constructor(options: ConsumeResourceModalOptions) {
			super({
				window: {
					title: `Consume Resources - ${options.actionName}`,
				},
				width: 450,
				height: 'auto',
				resizable: false,
			});
			this.#options = options;

			// Initialize adjusted costs
			this.adjustedCosts = options.actionCosts.map(cost => ({
				...cost,
				adjustedAmount: cost.amount,
			}));

			// Register Handlebars helpers
			this.registerHelper('eq', (a: unknown, b: unknown) => a === b);
			this.registerHelper('unless', (...args: unknown[]) => {
				const condition = args[0];
				const options = args[1] as { fn: () => string; inverse: () => string };
				if (!condition) {
					return options.fn();
				}
				return options.inverse();
			});
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

		static override get DEFAULT_OPTIONS() {
			const base = Mixed.DEFAULT_OPTIONS ?? {};
			return {
				...base,
				id: 'sw-consume-resource-modal',
				template: 'systems/shattered-wilds/templates/consume-resource-modal.html',
			};
		}

		static get PARTS() {
			return {
				content: { template: 'systems/shattered-wilds/templates/consume-resource-modal.html' },
			};
		}

		async _prepareContext(): Promise<ConsumeResourceModalData> {
			const resources = this.adjustedCosts.map(cost => {
				const resource = RESOURCES[cost.resource];
				const resourceInfo = this.#options.characterSheet.getResource(cost.resource);
				const insufficient = resourceInfo.current < cost.adjustedAmount;

				return {
					displayName: resource.shortName,
					current: resourceInfo.current,
					max: resourceInfo.max,
					adjustedAmount: cost.adjustedAmount,
					variable: cost.variable,
					insufficient,
				};
			});

			const canAfford = resources.every(r => !r.insufficient);

			return {
				resources,
				canAfford,
			};
		}

		async _onRender(): Promise<void> {
			const element = this.element;
			if (!element) return;

			// Add event listeners
			this.addEventListeners(element);
		}

		private addEventListeners(element: HTMLElement): void {
			// Adjust cost buttons
			const adjustButtons = element.querySelectorAll('[data-action="adjust-cost"]') as NodeListOf<HTMLButtonElement>;
			adjustButtons.forEach(btn => {
				btn.addEventListener('click', () => {
					const index = parseInt(btn.dataset.index || '0');
					const delta = parseInt(btn.dataset.delta || '0');
					this.adjustCost(index, delta);
				});
			});

			// Cancel button
			const cancelBtn = element.querySelector('[data-action="cancel"]') as HTMLButtonElement;
			if (cancelBtn) {
				cancelBtn.addEventListener('click', () => {
					this.close();
				});
			}

			// Confirm button
			const confirmBtn = element.querySelector('[data-action="confirm"]') as HTMLButtonElement;
			if (confirmBtn) {
				confirmBtn.addEventListener('click', () => {
					this.handleConfirm();
				});
			}
		}

		private adjustCost(index: number, delta: number): void {
			if (index < 0 || index >= this.adjustedCosts.length) return;

			const cost = this.adjustedCosts[index];
			if (!cost || !cost.variable) return;

			const newAmount = Math.max(0, cost.adjustedAmount + delta);
			this.adjustedCosts[index]!.adjustedAmount = newAmount;

			// Re-render to update the display
			this.render(false);
		}

		private async handleConfirm(): Promise<void> {
			try {
				// Check if we can afford all costs
				const canAfford = this.adjustedCosts.every(cost => {
					const resourceInfo = this.#options.characterSheet.getResource(cost.resource);
					return resourceInfo.current >= cost.adjustedAmount;
				});

				if (!canAfford) {
					getUI().notifications?.error('Insufficient resources!');
					return;
				}

				// Consume the resources
				await this.consumeResources();

				// Call the onConfirm callback if provided
				if (this.#options.onConfirm) {
					this.#options.onConfirm();
				}

				// Show success message
				getUI().notifications?.info(`Resources consumed for ${this.#options.actionName}`);

				// Close the modal
				this.close();
			} catch (error) {
				console.error('Failed to consume resources:', error);
				getUI().notifications?.error('Failed to consume resources');
			}
		}

		private async consumeResources(): Promise<void> {
			const actor = getActorById(this.#options.actorId) as unknown as {
				flags?: Record<string, unknown>;
				setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
			};

			if (!actor?.setFlag) {
				throw new Error('Actor not found or cannot update flags');
			}

			// Get current props
			const flags = actor.flags as Record<string, unknown> | undefined;
			const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
			const props = swFlags?.props ?? {};

			// Calculate new resource values
			const updatedProps = { ...props };
			for (const cost of this.adjustedCosts) {
				if (cost.adjustedAmount > 0) {
					const currentSheet = CharacterSheet.from(updatedProps);
					const newValue = currentSheet.updateResource(cost.resource, -cost.adjustedAmount);
					updatedProps[cost.resource] = newValue.toString();
				}
			}

			// Update the actor's props
			await actor.setFlag('shattered-wilds', 'props', updatedProps);

			// Sync updated resources to system data for token bars (similar to handleResourceChange)
			const updatedCharacterSheet = CharacterSheet.from(updatedProps);
			await this.syncResourcesToSystemData(actor, updatedCharacterSheet);
		}

		private async syncResourcesToSystemData(actor: unknown, characterSheet: CharacterSheet): Promise<void> {
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
	}

	ConsumeResourceModalImpl = Impl;
}

export class ConsumeResourceModal {
	static isSupported(): boolean {
		return ConsumeResourceModalImpl !== undefined;
	}

	static async open(
		characterSheet: CharacterSheet,
		actionCosts: ActionCost[],
		actionName: string,
		actorId: string,
		options: {
			onConfirm?: () => void;
		} = {},
	): Promise<unknown> {
		if (!ConsumeResourceModalImpl) {
			throw new Error('ConsumeResourceModal not supported in this Foundry version');
		}

		const ModalClass = ConsumeResourceModalImpl as new (options: ConsumeResourceModalOptions) => {
			render(force?: boolean): Promise<unknown>;
		};

		const modal = new ModalClass({
			characterSheet,
			actionCosts,
			actionName,
			actorId,
			...(options.onConfirm && { onConfirm: options.onConfirm }),
		});

		await modal.render(true);
		return modal;
	}
}
