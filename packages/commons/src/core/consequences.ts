import { Bonus } from '../stats/value.js';

export enum Consequence {
	Exhaustion = 'Exhaustion',
	Poisoned = 'Poisoned',
	Death = 'Death',
}

export class ConsequenceDefinition {
	name: Consequence;
	ranked: boolean;
	description: string;
	descriptionForRank: ((rank: number) => string) | undefined;

	constructor({
		name,
		ranked,
		description,
		descriptionForRank,
	}: {
		name: Consequence;
		ranked: boolean;
		description: string;
		descriptionForRank?: ((rank: number) => string) | undefined;
	}) {
		this.name = name;
		this.ranked = ranked;
		this.description = description;
		this.descriptionForRank = descriptionForRank;
	}
}

export type ExhaustionData = {
	rank: number;
	bonus: Bonus;
	cmText: string;
};

export const Exhaustion = {
	fromRank: (rank: number): ExhaustionData => {
		if (rank >= 10) {
			return { rank, bonus: Bonus.zero(), cmText: 'Death' };
		}

		let modifier;

		if (rank < 3) {
			modifier = 0;
		} else if (rank === 3) {
			modifier = -1;
		} else if (rank === 4) {
			modifier = -2;
		} else if (rank === 5) {
			modifier = -4;
		} else if (rank === 6) {
			modifier = -8;
		} else if (rank === 7) {
			modifier = -16;
		} else if (rank === 8) {
			modifier = -32;
		} else {
			modifier = -64;
		}

		return { rank, bonus: Bonus.of(modifier), cmText: `CM: ${modifier}` };
	},
};

export const CONSEQUENCES: Record<Consequence, ConsequenceDefinition> = {
	[Consequence.Exhaustion]: new ConsequenceDefinition({
		name: Consequence.Exhaustion,
		ranked: true,
		description: `Represents a longer term form of tiredness and fatigue that cannot be healed by a simple [[Short Rest]].

Several different circumstances can increase the _rank_; initially, just accumulating without causing harm, but further _ranks_ will incur negative consequences. Up to \`3\` ranks of **Exhaustion** are cleared on each [[Long Rest]].

Circumstances that cause the _rank_ of Exhaustion to increase include:

* Completing a [[Short Rest]];
* Being cleared from [[Incapacitated]];
* Failing to perform a [[Long Rest]] at the end of the day.

Exhaustion _ranks_ and their effects:

* _Ranks_ 0-2: No effects.
* _Ranks_ 3: -1 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 4: -2 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 5: -4 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 6: -8 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 7: -16 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 8: -32 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 9: -64 [[Circumstance Modifier | CM]] to all [[Check | Checks]].
* _Ranks_ 10+: [[Death]].`,
		descriptionForRank: rank => Exhaustion.fromRank(rank).cmText,
	}),
	[Consequence.Poisoned]: new ConsequenceDefinition({
		name: Consequence.Poisoned,
		ranked: true,
		description: `A non-trivial amount of toxin lingers on your system. Your maximum [[Vitality_Point | VP]] is reduced by your [[Poisoned]] _rank_ (if it reaches \`0\`, you die from the poison).

In order to treat it, a more advanced level of medical care is required than a simple [[Short Rest]], but the exact requirements depend on the nature of the poison. Typically, during a [[Long Rest]], you or someone can attempt to use a Healer's Kit ([[Intuition]] Check DC 20 (Medium)) to reduce the _rank_ of Poisoned by 1 + **Shifts**.`,
	}),
	[Consequence.Death]: new ConsequenceDefinition({
		name: Consequence.Death,
		ranked: false,
		description: `Death is the ultimate consequence. In Shattered Wilds, there is no revival - once your [[Soul]] is severed from your [[Body]], they can never go back. That means stakes are always high and some decisions are final (not only regarding the players, but more importantly, NPCs and enemies).

Death doesn't just come from just reaching zero [[Resource | resources]] - and in fact doesn't come (necessarily) from the accumulation of [[Consequence | Consequences]]. However, a totally [[Incapacitated]] creature (thus helpless) could be executed with a _Coup de Grace_, which will still require a contested check (failing will cause severe injuries instead). This is a longer action that cannot be taken during a combat, but it is typically considered that after the danger has passed, the winners will execute the losers, or leave them to die, unless otherwise specified by the victors.`,
	}),
};
