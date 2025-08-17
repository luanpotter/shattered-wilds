// Dice roll modal for Shattered Wilds system
import { getApplicationV2Ctor, getHandlebarsApplicationMixin, getActorById } from './foundry-shim.js';
import { CharacterSheet, StatType, StatHierarchy } from '@shattered-wilds/commons';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';
import { parseCharacterSheet } from './characters.js';

export interface DiceRollOptions {
	statType: string;
	modifier: number;
	actorId: string;
	modifierBreakdown?: Record<string, number>;
	targetDC?: number;
}

export interface DiceRollModalOptions extends DiceRollOptions {
	onCancel?: () => void;
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
			const { statType, modifier, actorId, targetDC } = this.#options;

			// Get character data for extra die options
			const actor = getActorById(actorId);
			const characterSheet = actor ? parseCharacterSheet(actor) : undefined;

			let attributeOptions: Array<{ key: string; name: string; value: number }> = [];
			let canUseExtra = false;
			let canUseLuck = true;

			try {
				if (characterSheet) {
					const statTree = characterSheet.getStatTree();

					// Determine if this is a skill roll and which attribute to exclude
					const isSkillRoll = this.isSkillRoll(statType);
					canUseExtra = isSkillRoll;

					// Disable luck die for LCK attribute or LCK skills
					canUseLuck = !this.isLuckBasedRoll(statType);

					if (isSkillRoll) {
						const parentAttribute = this.getParentAttribute(statType);

						// Get all attributes except the parent attribute of this skill
						attributeOptions = StatType.values
							.filter(statType => statType.hierarchy === StatHierarchy.Attribute)
							.filter(statType => statType.name !== parentAttribute)
							.map(statType => {
								const modifier = statTree.getNodeModifier(statTree.getNode(statType));
								return {
									key: statType.name,
									name: statType.name,
									value: modifier.value.value,
								};
							});
					}
				}
			} catch (err) {
				console.warn('Failed to create CharacterSheet from props:', err);
			}

			const fortuneValue = characterSheet
				? characterSheet.getStatTree().getNodeModifier(characterSheet.getStatTree().getNode(StatType.Fortune)).value
						.value
				: 0;

			// Prepare modifier display text
			let modifierDisplay = `+${modifier}`;
			if (this.#options.modifierBreakdown) {
				// Show detailed breakdown as comma-separated list
				const modifierParts = Object.entries(this.#options.modifierBreakdown)
					.filter(([, value]) => value !== 0)
					.map(([name, value]) => `${name} ${value >= 0 ? '+' : ''}${value}`);
				modifierDisplay = modifierParts.length > 0 ? modifierParts.join(', ') : `+${modifier}`;
			}

			return {
				statType,
				modifier,
				modifierDisplay,
				actorId,
				attributeOptions,
				fortuneValue,
				canUseExtra,
				canUseLuck,
				targetDC,
			};
		}

		private isSkillRoll(statTypeName: string): boolean {
			try {
				const statType = StatType.fromString(statTypeName, StatType.Level);
				return statType.hierarchy === StatHierarchy.Skill;
			} catch {
				return false;
			}
		}

		private isLuckBasedRoll(statTypeName: string): boolean {
			try {
				const statType = StatType.fromString(statTypeName, StatType.Level);
				// LCK attribute or any skill that has LCK as parent
				return statType === StatType.LCK || statType.parent === StatType.LCK;
			} catch {
				return false;
			}
		}

		private getParentAttribute(skillTypeName: string): string {
			try {
				const statType = StatType.fromString(skillTypeName, StatType.Level);
				// For skills, return the parent attribute name
				return statType.parent?.name || '';
			} catch {
				return '';
			}
		}

		private async getAttributeValue(attributeName: string): Promise<number> {
			const actor = getActorById(this.#options.actorId);
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

		private async buildModifiersMap(
			baseModifier: number,
			circumstanceModifier: number,
		): Promise<Record<string, number>> {
			// If we have a detailed breakdown (e.g., for weapon attacks), use that instead
			if (this.#options.modifierBreakdown) {
				return {
					...this.#options.modifierBreakdown,
					...(circumstanceModifier !== 0 ? { Circumstance: circumstanceModifier } : {}),
				};
			}

			// Fallback to simple base + circumstance for regular stat rolls
			return {
				Base: baseModifier,
				...(circumstanceModifier !== 0 ? { Circumstance: circumstanceModifier } : {}),
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

			const useExtra = formData.get('useExtra') === 'on';
			const useLuck = formData.get('useLuck') === 'on';
			const extraAttribute = (formData.get('extraAttribute') as string) || undefined;
			const circumstanceModifier = parseInt((formData.get('circumstanceModifier') as string) || '0');
			const targetDC = formData.get('targetDC') ? parseInt(formData.get('targetDC') as string) : undefined;

			const actor = getActorById(this.#options.actorId);
			const characterSheet = actor ? parseCharacterSheet(actor) : undefined;

			// Use centralized dice system directly
			const rollRequest: DiceRollRequest = {
				name: this.#options.statType,
				characterName: characterSheet?.name ?? 'Unknown',
				modifiers: await this.buildModifiersMap(this.#options.modifier, circumstanceModifier),
				extra:
					useExtra && extraAttribute
						? {
								name: extraAttribute,
								value: await this.getAttributeValue(extraAttribute),
							}
						: undefined,
				luck: useLuck
					? {
							value: await this.getAttributeValue('Fortune'),
						}
					: undefined,
				targetDC,
			};

			// Execute the centralized dice roll
			await executeEnhancedRoll(rollRequest);

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
