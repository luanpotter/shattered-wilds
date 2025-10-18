import { createHandlebarsApplicationBase, getActorById, getHandlebars, showNotification } from './foundry-shim.js';
import { ActionCost, CharacterSheet, RESOURCES } from '@shattered-wilds/commons';

interface AdjustedCost extends ActionCost {
	adjustedAmount: number;
}

interface ConsumeResourceModalOptions {
	characterSheet: CharacterSheet;
	actionCosts: ActionCost[];
	actionName: string;
	actorId: string;
	onConfirm?: () => void;
}

const HandlebarsAppBase = createHandlebarsApplicationBase();

class ConsumeResourceModalImpl extends HandlebarsAppBase {
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
		const handlebars = getHandlebars();
		if (handlebars) {
			handlebars.registerHelper(name, fn);
		}
	}

	static override get DEFAULT_OPTIONS() {
		return {
			id: 'sw-consume-resource-modal',
			template: 'systems/shattered-wilds/templates/consume-resource-modal.html',
		};
	}

	static get PARTS() {
		return {
			content: { template: 'systems/shattered-wilds/templates/consume-resource-modal.html' },
		};
	}

	override async _prepareContext(): Promise<Record<string, unknown>> {
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

	override async _onRender(): Promise<void> {
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
				showNotification('error', 'Insufficient resources!');
				return;
			}

			// Consume the resources
			await this.consumeResources();

			// Call the onConfirm callback if provided
			this.#options.onConfirm?.();

			// Show success message
			showNotification('info', `Resources consumed for ${this.#options.actionName}`);

			// Close the modal
			this.close();
		} catch (error) {
			console.error('Failed to consume resources:', error);
			showNotification('error', 'Failed to consume resources');
		}
	}

	private async consumeResources(): Promise<void> {
		const actor = getActorById(this.#options.actorId);
		if (!actor) {
			throw new Error(`Actor not found for ${this.#options.actorId}`);
		}

		// Convert adjusted costs to the expected format
		const resourceCosts = this.adjustedCosts
			.filter(cost => cost.adjustedAmount > 0)
			.map(cost => ({
				resource: cost.resource,
				amount: cost.adjustedAmount,
			}));

		// Use the centralized consumption function
		const { consumeActionResources } = await import('./update-actor-resources.js');
		await consumeActionResources(actor, resourceCosts);
	}
}

export class ConsumeResourceModal {
	static async open(
		characterSheet: CharacterSheet,
		actionCosts: ActionCost[],
		actionName: string,
		actorId: string,
		options: {
			onConfirm?: () => void;
		} = {},
	): Promise<ConsumeResourceModalImpl> {
		const modal = new ConsumeResourceModalImpl({
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
