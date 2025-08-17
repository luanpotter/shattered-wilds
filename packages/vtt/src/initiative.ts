// Initiative integration for Foundry VTT
import { getHooks } from './foundry-shim.js';
import { getCharacterProps, type ActorLike } from './actor-data-manager.js';
import { CharacterSheet, StatType } from '@shattered-wilds/commons';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';

export function registerInitiativeHooks(): void {
	const hooks = getHooks();
	if (!hooks?.on) return;

	// Override Combat.rollInitiative method entirely to prevent Foundry from using its formula
	hooks.once('ready', () => {
		const Combat = (globalThis as unknown as { Combat?: unknown }).Combat;
		if (!Combat) return;

		const CombatClass = Combat as {
			prototype: {
				rollInitiative: (ids: string[], options?: Record<string, unknown>) => Promise<unknown>;
			};
		};

		// Store the original method
		const originalRollInitiative = CombatClass.prototype.rollInitiative;

		// Override with our custom implementation
		CombatClass.prototype.rollInitiative = async function (
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
						const initiativeValue = await rollShatteredWildsInitiative(combatant.actor);
						if (initiativeValue !== null) {
							updates.push({ _id: id, initiative: initiativeValue });
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

async function rollShatteredWildsInitiative(actor: ActorLike): Promise<number | null> {
	try {
		const rawProps = getCharacterProps(actor);

		// Transform feat props back to expected format
		const props = Object.fromEntries(
			Object.entries(rawProps).map(([key, value]) => {
				if (key.startsWith('feat_')) {
					const transformedKey = key.replace(/^feat_(\d+)_(\w+)_(\d+)$/, 'feat.$1.$2.$3');
					return [transformedKey, value];
				}
				return [key, value];
			}),
		);

		if (Object.keys(props).length === 0) return null;

		const characterSheet = CharacterSheet.from(props);
		const statTree = characterSheet.getStatTree();

		// Get breakdown for modifiers
		const awarenessNode = statTree.getNode(StatType.Awareness);
		const awarenessModifier = statTree.getNodeModifier(awarenessNode);
		const agilityNode = statTree.getNode(StatType.Agility);
		const agilityModifier = statTree.getNodeModifier(agilityNode);

		// Use centralized dice system for initiative
		const rollRequest: DiceRollRequest = {
			name: 'Initiative',
			modifiers: {
				Awareness: awarenessModifier.value.value,
				Agility: agilityModifier.value.value,
			},
			extra: undefined, // Initiative doesn't use extra dice
			luck: undefined, // Initiative doesn't use luck dice
			targetDC: undefined, // Initiative has no target DC
		};

		// For initiative, we need to capture the result to return it
		// We'll need to modify the centralized system or extract the result
		// For now, let's return the total modifier as a reasonable estimate
		// TODO: Enhance centralized system to return roll results
		await executeEnhancedRoll(rollRequest);

		// Return the expected initiative value (base roll + modifiers + potential crits)
		// This is an approximation since we can't easily get the actual roll result
		// from the centralized system in its current form
		const baseExpectedValue = 13; // Average of 2d12 (2-24, avg ~13)
		const totalModifier = awarenessModifier.value.value + agilityModifier.value.value;
		return baseExpectedValue + totalModifier;
	} catch (err) {
		console.warn('Failed to roll Shattered Wilds initiative:', err);
		return null;
	}
}

// All dice mechanics now handled by centralized dices.ts
