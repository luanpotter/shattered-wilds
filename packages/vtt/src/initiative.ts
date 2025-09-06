import { DerivedStatType } from '@shattered-wilds/commons';
import { parseCharacterSheet } from './characters.js';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';
import { ActorLike, getHooks, getCombatCtor } from './foundry-shim.js';

export function registerInitiativeHooks(): void {
	const hooks = getHooks();
	if (!hooks?.on) return;

	// Override Combat.rollInitiative method entirely to prevent Foundry from using its formula
	hooks.once?.('ready', () => {
		const Combat = getCombatCtor();
		if (!Combat) return;

		// Store the original method
		const originalRollInitiative = Combat.prototype.rollInitiative;

		// Override with our custom implementation
		Combat.prototype.rollInitiative = async function (
			this: {
				combatants: Array<{
					id: string;
					actor?: ActorLike;
					update?: (data: Record<string, unknown>) => Promise<unknown>;
				}>;
			},
			ids: string[],
			options?: Record<string, unknown>,
		): Promise<unknown> {
			try {
				const updates: Array<{ _id: string; initiative: number }> = [];

				for (const id of ids) {
					const combatant = this.combatants.find(c => c.id === id);
					if (combatant?.actor) {
						// Check if this is a Shattered Wilds character
						const result = await rollShatteredWildsInitiative(combatant.actor);
						if (result !== undefined) {
							updates.push({ _id: id, initiative: result });
						} else {
							// Fall back to original method for non-SW characters
							console.warn('Falling back to original initiative for actor:', combatant.actor.name);
							return originalRollInitiative.call(this, [id], options);
						}
					}
				}

				// Apply all updates at once using the combat instance
				if (updates.length > 0) {
					const combatInstance = this as unknown as {
						updateEmbeddedDocuments: (
							embeddedName: string,
							updates: Array<{ _id: string; initiative: number }>,
						) => Promise<unknown>;
					};

					if (combatInstance.updateEmbeddedDocuments) {
						await combatInstance.updateEmbeddedDocuments('Combatant', updates);
					}
				}

				return this;
			} catch (error) {
				console.error('Error in custom rollInitiative:', error);
				// Fall back to original method on error
				return originalRollInitiative.call(this, ids, options);
			}
		};
	});
}

async function rollShatteredWildsInitiative(actor: ActorLike): Promise<number | undefined> {
	try {
		const characterSheet = parseCharacterSheet(actor);
		if (!characterSheet) return undefined;
		const statTree = characterSheet.getStatTree();

		const initiativeModifier = statTree.getModifier(DerivedStatType.Initiative);

		// Use centralized dice system for initiative
		const rollRequest: DiceRollRequest = {
			name: 'Initiative',
			characterName: characterSheet.name ?? 'Unknown',
			modifiers: {
				Base: initiativeModifier.value.value,
			},
			extra: undefined, // Initiative doesn't use extra dice through the combat tracker
			luck: undefined, // Initiative doesn't use luck dice through the combat tracker
			targetDC: undefined, // Initiative never has a target DC
		};

		return await executeEnhancedRoll(rollRequest);
	} catch (err) {
		console.warn('Failed to roll Shattered Wilds initiative:', err);
		return undefined;
	}
}
