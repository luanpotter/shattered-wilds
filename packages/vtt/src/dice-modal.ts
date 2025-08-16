// Dice roll modal for Shattered Wilds system
import { getApplicationV2Ctor, getHandlebarsApplicationMixin, getActorById } from './foundry-shim.js';
import { CharacterSheet, StatType } from '@shattered-wilds/commons';

export interface DiceRollOptions {
	statType: string;
	modifier: number;
	actorId: string;
}

export interface DiceRollModalOptions extends DiceRollOptions {
	onRoll?: (rollData: DiceRollData) => Promise<void>;
	onCancel?: () => void;
}

export interface DiceRollData {
	statType: string;
	modifier: number;
	useExtra: boolean;
	useLuck: boolean;
	extraAttribute: string | undefined;
	circumstanceModifier: number;
	targetDC: number | undefined;
}

const AppV2 = getApplicationV2Ctor();
const HbsMixin = getHandlebarsApplicationMixin();

let DiceRollModalImpl: unknown;

if (AppV2 && HbsMixin) {
	const Mixed = HbsMixin(AppV2) as unknown as {
		new (options?: unknown): {
			close(): void;
			element?: HTMLElement;
		};
		DEFAULT_OPTIONS?: unknown;
	};

	class Impl extends Mixed {
		#options: DiceRollModalOptions;

		constructor(options: DiceRollModalOptions) {
			super({
				window: {
					title: `Roll ${options.statType} Check`,
					contentClasses: ['shattered-wilds-dice-modal'],
				},
				width: 400,
				height: 'auto',
				resizable: false,
				...options,
			});
			this.#options = options;
		}

		static override get DEFAULT_OPTIONS() {
			const base = Mixed.DEFAULT_OPTIONS ?? {};
			return {
				...base,
				window: {
					title: 'Dice Roll',
					contentClasses: ['shattered-wilds-dice-modal'],
				},
				width: 400,
				height: 'auto',
				resizable: false,
			};
		}

		static PARTS = {
			content: { template: 'systems/shattered-wilds/templates/dice-modal.html' },
		};

		async _prepareContext(): Promise<Record<string, unknown>> {
			const { statType, modifier, actorId } = this.#options;

			// Get character data for extra die options
			const actor = getActorById(actorId);
			const flags = actor?.flags as Record<string, unknown> | undefined;
			const swFlags = (flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
			const props = swFlags?.props ?? {};

			let characterSheet: CharacterSheet | undefined;
			let attributeOptions: Array<{ key: string; name: string; value: number }> = [];

			try {
				if (Object.keys(props).length > 0) {
					characterSheet = CharacterSheet.from(props);
					const statTree = characterSheet.getStatTree();

					// Get all attributes for extra die selection
					attributeOptions = [
						StatType.STR,
						StatType.DEX,
						StatType.CON,
						StatType.INT,
						StatType.WIS,
						StatType.CHA,
						StatType.Fortune, // For luck die comparison
					].map(statType => {
						const modifier = statTree.getNodeModifier(statTree.getNode(statType));
						return {
							key: statType.name,
							name: statType.name,
							value: modifier.value.value,
						};
					});
				}
			} catch (err) {
				console.warn('Failed to create CharacterSheet from props:', err);
			}

			return {
				statType,
				modifier,
				actorId,
				attributeOptions,
				fortuneValue: attributeOptions.find(attr => attr.key === 'Fortune')?.value || 0,
			};
		}

		async _onRender(): Promise<void> {
			const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
			if (!root) return;

			// Wire up form submission
			const form = root.querySelector('form') as HTMLFormElement | null;
			if (form) {
				form.addEventListener('submit', e => this.handleSubmit(e));
			}

			// Wire up cancel button
			const cancelBtn = root.querySelector('[data-action="cancel"]') as HTMLButtonElement | null;
			if (cancelBtn) {
				cancelBtn.addEventListener('click', () => this.handleCancel());
			}

			// Wire up extra die checkbox to show/hide attribute selection
			const extraCheckbox = root.querySelector('[name="useExtra"]') as HTMLInputElement | null;
			const extraSelect = root.querySelector('[name="extraAttribute"]') as HTMLSelectElement | null;
			if (extraCheckbox && extraSelect) {
				const toggleExtraSelect = () => {
					extraSelect.disabled = !extraCheckbox.checked;
					extraSelect.style.opacity = extraCheckbox.checked ? '1' : '0.5';
				};
				toggleExtraSelect();
				extraCheckbox.addEventListener('change', toggleExtraSelect);
			}
		}

		private async handleSubmit(e: Event): Promise<void> {
			e.preventDefault();

			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);

			const rollData: DiceRollData = {
				statType: this.#options.statType,
				modifier: this.#options.modifier,
				useExtra: formData.get('useExtra') === 'on',
				useLuck: formData.get('useLuck') === 'on',
				extraAttribute: (formData.get('extraAttribute') as string) || undefined,
				circumstanceModifier: parseInt((formData.get('circumstanceModifier') as string) || '0'),
				targetDC: formData.get('targetDC') ? parseInt(formData.get('targetDC') as string) : undefined,
			};

			if (this.#options.onRoll) {
				await this.#options.onRoll(rollData);
			}

			this.close();
		}

		private handleCancel(): void {
			if (this.#options.onCancel) {
				this.#options.onCancel();
			}
			this.close();
		}
	}

	DiceRollModalImpl = Impl;
}

export function createDiceRollModal(options: DiceRollModalOptions): unknown {
	if (!DiceRollModal.isSupported()) {
		throw new Error('ApplicationV2 is not available in this core build.');
	}
	const Ctor = DiceRollModalImpl as { new (opts: DiceRollModalOptions): unknown };
	return new Ctor(options);
}

export class DiceRollModal {
	static isSupported(): boolean {
		return Boolean(AppV2 && HbsMixin);
	}

	static async open(options: DiceRollModalOptions): Promise<void> {
		const modal = createDiceRollModal(options);
		(modal as { render: (force?: boolean) => void }).render(true);
	}
}
