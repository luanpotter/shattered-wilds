import { CharacterSheet, Condition, CONDITIONS } from '@shattered-wilds/commons';
import { ActorLike, Foundry } from '../foundry-shim';

export async function syncConditionsToTokens(actor: ActorLike, characterSheet: CharacterSheet): Promise<void> {
	// Get all tokens for this actor
	const tokens = actor.getActiveTokens?.() || (actor.token?.document ? [actor.token] : []);

	// If no tokens, try to update actor directly
	const targets = tokens.length > 0 ? tokens.map(t => t.document?.actor || t.actor) : [actor];

	// Get desired conditions from character sheet
	const desiredConditions = new Set(characterSheet.circumstances.conditions.map(c => c.name));

	for (const target of targets) {
		if (!target?.toggleStatusEffect) continue;

		// Get current SW status effects on the token
		const currentStatuses = target.statuses || new Set<string>();
		const currentSWStatuses = new Set(Array.from(currentStatuses).filter(statusId => statusId.startsWith('sw-')));

		// Get desired SW status effects from current conditions
		const desiredSWStatuses = new Set(
			Array.from(desiredConditions).map(condition => `sw-${condition.toLowerCase().replace(/\s+/g, '-')}`),
		);

		// Find differences
		const statusesToRemove = Array.from(currentSWStatuses).filter(statusId => !desiredSWStatuses.has(statusId));
		const statusesToAdd = Array.from(desiredSWStatuses).filter(statusId => !currentSWStatuses.has(statusId));

		// Apply only the changes needed
		for (const statusId of statusesToRemove) {
			await target.toggleStatusEffect(statusId, { active: false });
		}

		for (const statusId of statusesToAdd) {
			await target.toggleStatusEffect(statusId, { active: true });
		}
	}
}

export function registerConditionStatusEffects(): void {
	const getConditionIcon = (condition: Condition): string => {
		const iconMap: Record<Condition, string> = {
			[Condition.Blessed]: 'icons/svg/angel.svg',
			[Condition.Blinded]: 'icons/svg/blind.svg',
			[Condition.Distracted]: 'icons/svg/daze.svg',
			[Condition.Distraught]: 'icons/svg/aura.svg',
			[Condition.Frightened]: 'icons/svg/terror.svg',
			[Condition.Immobilized]: 'icons/svg/net.svg',
			[Condition.Incapacitated]: 'icons/svg/skull.svg',
			[Condition.OffGuard]: 'icons/svg/downgrade.svg',
			[Condition.Prone]: 'icons/svg/falling.svg',
			[Condition.Silenced]: 'icons/svg/silenced.svg',
			[Condition.Unconscious]: 'icons/svg/unconscious.svg',
		};
		return iconMap[condition] || 'icons/svg/aura.svg';
	};

	const CONFIG = Foundry.CONFIG;

	// Remove any existing SW status effects to avoid duplicates
	const existingSWIds = new Set(
		(CONFIG.statusEffects || [])
			.filter((effect: { id?: string }) => effect.id?.startsWith('sw-'))
			.map((effect: { id?: string }) => effect.id),
	);

	if (existingSWIds.size > 0) {
		CONFIG.statusEffects = (CONFIG.statusEffects || []).filter(
			(effect: { id?: string }) => !effect.id?.startsWith('sw-'),
		);
	}

	// Add SW status effects
	const swStatusEffects = Object.values(Condition).map(condition => ({
		id: `sw-${condition.toLowerCase().replace(/\s+/g, '-')}`,
		name: condition,
		img: getConditionIcon(condition),
		description: CONDITIONS[condition].description,
	}));

	CONFIG.statusEffects = [...(CONFIG.statusEffects || []), ...swStatusEffects];
}
