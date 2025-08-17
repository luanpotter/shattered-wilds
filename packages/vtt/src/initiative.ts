// Initiative integration for Foundry VTT
import { getHooks, getRollCtor } from './foundry-shim.js';
import { getCharacterProps, type ActorLike } from './actor-data-manager.js';
import { CharacterSheet, DerivedStatType, StatType } from '@shattered-wilds/commons';

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
		const initiativeModifier = statTree.getModifier(DerivedStatType.Initiative);

		// Roll 2d12 + initiative modifier with full Shattered Wilds mechanics
		const totalModifier = initiativeModifier.value.value;
		const formula = `2d12 + ${totalModifier}`;

		const roll = await getRollCtor().create(formula);
		await roll.evaluate();

		// Get the dice results for crit calculation
		const rollData = roll as unknown as {
			dice?: Array<{ results?: Array<{ result: number }> }>;
		};
		const diceResults = rollData.dice?.[0]?.results?.map((r: { result: number }) => r.result) || [];

		// Process Shattered Wilds mechanics (crit modifiers, auto-fail, etc.)
		const result = processShatteredWildsRollResult(roll.total, diceResults);

		// Get breakdown for chat message
		const awarenessNode = statTree.getNode(StatType.Awareness);
		const awarenessModifier = statTree.getNodeModifier(awarenessNode);
		const agilityNode = statTree.getNode(StatType.Agility);
		const agilityModifier = statTree.getNodeModifier(agilityNode);

		// Create detailed chat message with mechanics
		const mechanicsHtml = createInitiativeMechanicsHtml(
			result,
			awarenessModifier.value.value,
			agilityModifier.value.value,
			totalModifier,
		);

		await roll.toMessage({
			flavor: `<strong>Initiative Check</strong><br><strong>${actor.name || 'Character'}</strong>${mechanicsHtml}`,
		});

		return result.finalTotal;
	} catch (err) {
		console.warn('Failed to roll Shattered Wilds initiative:', err);
		return null;
	}
}

interface ShatteredWildsRollResult {
	baseTotal: number;
	critModifier: number;
	finalTotal: number;
	hasTwelve: boolean;
	hasPair: boolean;
}

function processShatteredWildsRollResult(baseTotal: number, diceResults: number[]): ShatteredWildsRollResult {
	// Calculate crit modifier according to Shattered Wilds rules
	let critModifier = 0;
	let hasTwelve = false;
	let hasPair = false;

	// Check for at least one 12
	if (diceResults.includes(12)) {
		hasTwelve = true;
		critModifier += 6;
	}

	// Check for pairs (at least two dice with the same value)
	const counts = new Map<number, number>();
	for (const die of diceResults) {
		counts.set(die, (counts.get(die) || 0) + 1);
	}

	for (const count of counts.values()) {
		if (count >= 2) {
			hasPair = true;
			critModifier += 6;
			break; // Only one +6 for pairs, regardless of how many pairs
		}
	}

	const finalTotal = baseTotal + critModifier;

	return {
		baseTotal,
		critModifier,
		finalTotal,
		hasTwelve,
		hasPair,
	};
}

function createInitiativeMechanicsHtml(
	result: ShatteredWildsRollResult,
	awarenessValue: number,
	agilityValue: number,
	totalModifier: number,
): string {
	let html = `
		<div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px;">
			<div style="margin-bottom: 4px;">
				<strong>Base Roll:</strong> ${result.baseTotal}
	`;

	if (result.critModifier > 0) {
		html += ` + <span style="color: #4a9; font-weight: bold;">${result.critModifier} (Crit</span>`;

		// Show what caused the crit modifier
		const critReasons = [];
		if (result.hasTwelve) critReasons.push('12');
		if (result.hasPair) critReasons.push('Pair');

		if (critReasons.length > 0) {
			html += `: ${critReasons.join(', ')}`;
		}
		html += `<span style="color: #4a9; font-weight: bold;">)</span>`;
	}

	html += ` = <strong style="font-size: 1.1em;">${result.finalTotal}</strong>`;

	html += `
			</div>
			<div style="font-size: 0.9em; color: rgba(255,255,255,0.8);">
				<strong>Breakdown:</strong><br>
				• Awareness: +${awarenessValue}<br>
				• Agility: +${agilityValue}<br>
				<strong>Total Modifier: +${totalModifier}</strong>
			</div>
		</div>
	`;

	return html;
}
