import {
	Bonus,
	CharacterSheet,
	Check,
	CircumstanceModifier,
	DerivedStatType,
	ModifierSource,
	StatHierarchy,
	StatType,
} from '@shattered-wilds/commons';
import { getCharacterProps } from './actor-data-manager.js';
import { parseCharacterSheet } from './characters.js';
import { executeEnhancedRoll } from './dices.js';
import { getActorById, getApplicationV2Ctor, getHandlebarsApplicationMixin } from './foundry-shim.js';

export interface DiceRollOptions {
	check: Check;
	actorId: string;
	targetDC: number | undefined;
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
					title: `Roll ${options.check.descriptor} Check`,
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
			const { check, actorId, targetDC } = this.#options;
			const statType = check.statModifier.statType;

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

			const descriptor = check.descriptor;
			const modifiers = check.statModifier.breakdown();
			const totalModifier = check.modifierValue.description;

			return {
				statType,
				descriptor,
				totalModifier,
				check,
				modifiers,
				actorId,
				attributeOptions,
				fortuneValue,
				canUseExtra,
				canUseLuck,
				targetDC,
			};
		}

		private isSkillRoll(statType: StatType | DerivedStatType): boolean {
			return statType instanceof StatType && statType.hierarchy === StatHierarchy.Skill;
		}

		private isLuckBasedRoll(statType: StatType | DerivedStatType): boolean {
			if (statType instanceof StatType) {
				if (statType === StatType.LCK) {
					return true;
				}
				if (statType.parent !== undefined) {
					return this.isLuckBasedRoll(statType.parent);
				}
				return false;
			} else {
				return false;
			}
		}

		private getParentAttribute(skillType: StatType | DerivedStatType): string | undefined {
			if (skillType instanceof StatType) {
				return skillType.parent?.name;
			} else {
				return undefined;
			}
		}

		private async getAttributeValue(attributeName: string): Promise<number> {
			const actor = getActorById(this.#options.actorId);
			const props = actor ? getCharacterProps(actor) : {};

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
			const additionalCircumstanceModifier = parseInt((formData.get('circumstanceModifier') as string) || '0');
			const targetDC = formData.get('targetDC') ? parseInt(formData.get('targetDC') as string) : undefined;

			const actor = getActorById(this.#options.actorId);
			const characterSheet = actor ? parseCharacterSheet(actor) : undefined;
			const characterName = characterSheet?.name ?? 'Unknown';

			const extra =
				useExtra && extraAttribute
					? {
							name: extraAttribute,
							value: await this.getAttributeValue(extraAttribute),
						}
					: undefined;

			const luck = useLuck
				? {
						value: await this.getAttributeValue('Fortune'),
					}
				: undefined;

			const check = additionalCircumstanceModifier
				? this.#options.check.withAdditionalCM(
						new CircumstanceModifier({
							name: 'CM',
							source: ModifierSource.Circumstance,
							value: Bonus.of(additionalCircumstanceModifier),
						}),
					)
				: this.#options.check;

			await executeEnhancedRoll({
				characterName,
				check,
				extra,
				luck,
				targetDC,
			});

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
