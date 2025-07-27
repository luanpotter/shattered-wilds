import { FeatCategory, FeatDefinition, FeatInfo, FEATS, FeatSlot, FeatType } from '@shattered-wilds/commons';
import * as TypeComparator from 'type-comparator';

import { CharacterSheet } from './character-sheet';

// each "card" we want to show in the feats section; either:
// - a core (non-slotted) feat
// - a slotted feat (which has a slot)
// - a feat slot (which has no info, just a slot)
export class FeatOrSlot {
	info: FeatInfo<string | void> | undefined;
	slot: FeatSlot | undefined;

	constructor(info: FeatInfo<string | void> | undefined, slot: FeatSlot | undefined) {
		this.info = info;
		this.slot = slot;
	}

	get hasSlot(): boolean {
		return this.slot !== undefined;
	}

	get hasFeat(): boolean {
		return this.info !== undefined;
	}

	get isEmpty(): boolean {
		return this.hasSlot && !this.hasFeat;
	}

	get isExtra(): boolean {
		return !this.slot && !!this.info?.slot;
	}

	get level(): number {
		return (this.slot?.level ?? this.info?.feat.level)!;
	}

	static build = ({
		info,
		slot,
	}: {
		info?: FeatInfo<string | void> | undefined;
		slot?: FeatSlot | undefined;
	}): FeatOrSlot => {
		return new FeatOrSlot(info, slot);
	};
}

export class FeatsLevelSection {
	level: number;
	featsOrSlots: FeatOrSlot[];

	constructor(level: number, featsOrSlots: FeatOrSlot[]) {
		this.level = level;
		this.featsOrSlots = featsOrSlots;
	}

	countMissingSlots(): number {
		return this.featsOrSlots.filter(featOrSlot => !featOrSlot.info && !!featOrSlot.slot).length;
	}

	get hasMissingSlots(): boolean {
		return this.countMissingSlots() > 0;
	}

	get hasExtraSlots(): boolean {
		return this.featsOrSlots.some(featOrSlot => featOrSlot.isExtra);
	}

	get hasMissingOrExtraSlots(): boolean {
		return this.hasMissingSlots || this.hasExtraSlots;
	}
}

export class FeatsSection {
	featsOrSlotsByLevel: FeatsLevelSection[];

	private constructor(featsOrSlotsByLevel: FeatsLevelSection[]) {
		this.featsOrSlotsByLevel = featsOrSlotsByLevel;
	}

	countMissingSlots(): number {
		return this.featsOrSlotsByLevel.reduce((total, section) => total + section.countMissingSlots(), 0);
	}

	get hasMissingFeats(): boolean {
		return this.countMissingSlots() > 0;
	}

	get isEmpty(): boolean {
		return this.featsOrSlotsByLevel.length === 0;
	}

	hasFeat(feat: FeatDefinition<string | void>): boolean {
		return this.featsOrSlotsByLevel.some(section =>
			section.featsOrSlots.some(featOrSlot => featOrSlot.info?.feat?.key === feat.key),
		);
	}

	availableFeatsForSlot(slot: FeatSlot, sheet: CharacterSheet): FeatDefinition<string | void>[] {
		const comparator = TypeComparator.queue([
			TypeComparator.map((x: FeatDefinition<string | void>) => x.level, TypeComparator.desc),
			TypeComparator.map((x: FeatDefinition<string | void>) => x.type === FeatType.Major, TypeComparator.desc),
			TypeComparator.map(
				(x: FeatDefinition<string | void>) => (x.category === FeatCategory.General ? 1 : 0),
				TypeComparator.asc,
			),
		]);
		return (
			Object.values(FEATS)
				// fits the slot
				.filter(feat => feat.fitsSlot(slot))
				// fits the character sheet
				.filter(feat => feat.fitsClass(sheet.characterClass.definition))
				// not already slotted
				.filter(feat => feat.parameter || !this.hasFeat(feat))
				.sort(comparator)
		);
	}

	static create = (sheet: CharacterSheet): FeatsSection => {
		const coreFeats = sheet.feats.getCoreFeats();
		const currentFeatSlots = sheet.getFeatSlots();
		const slottedFeats = sheet.feats.getSlottedFeats();
		const slottedSlots = slottedFeats
			.map(feat => feat.slot)
			.filter(slot => !!slot)
			.map(slot => slot.toProp());
		const missingSlots = currentFeatSlots.filter(slot => !slottedSlots.includes(slot.toProp()));

		const coreFeatOrSlots = coreFeats
			// core feats have no slots
			.map(feat => FeatOrSlot.build({ info: feat }));
		const slottedFeatOrSlots = slottedFeats
			// slotted feats must be re-paired with the sheet slots
			// it is possible for example that the Specialized Training feat was removed
			.map(feat => {
				const featSlot = feat.slot!; // slotted feats have a slot
				const sheetSlot = currentFeatSlots.find(slot => slot.toProp() === featSlot.toProp());
				return FeatOrSlot.build({ info: feat, slot: sheetSlot });
			});
		const missingFeatOrSlots = missingSlots.map(slot => FeatOrSlot.build({ slot }));

		const featOrSlots = [...coreFeatOrSlots, ...slottedFeatOrSlots, ...missingFeatOrSlots];

		const maxLevel = Math.max(...featOrSlots.map(featOrSlot => featOrSlot.level));
		const featsOrSlotsByLevel = Array.from({ length: maxLevel + 1 }, (_, level) => {
			return new FeatsLevelSection(
				level,
				featOrSlots.filter(featOrSlot => featOrSlot.level === level),
			);
		});
		return new FeatsSection(featsOrSlotsByLevel);
	};
}
