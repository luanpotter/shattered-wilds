import { FeatDefinition, FeatInfo, FEATS, FeatSlot } from '@shattered-wilds/commons';

import { CharacterSheet } from './character-sheet';

// each "card" we want to show in the feats section; either:
// - a core (non-slotted) feat
// - a slotted feat (which has a slot)
// - a feat slot (which has no info, just a slot)
export interface FeatOrSlot {
	info?: FeatInfo<string | void>;
	slot?: FeatSlot;
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

	availableFeatsForSlot(slot: FeatSlot): FeatDefinition<string | void>[] {
		return (
			Object.values(FEATS)
				// fits the slot
				.filter(feat => feat.level === slot.level && feat.type === slot.type)
				// not already slotted
				.filter(feat => feat.parameter || !this.hasFeat(feat))
		);
	}

	static create = (sheet: CharacterSheet): FeatsSection => {
		const coreFeats = sheet.feats.getCoreFeats();
		const slottedFeats = sheet.feats.getSlottedFeats();
		const currentFeatSlots = sheet.getFeatSlots();

		const maxLevel = Math.max(
			...slottedFeats.map(feat => feat.slot!.level), //
			...currentFeatSlots.map(slot => slot.level), //
		);

		const featsOrSlotsByLevel: FeatsLevelSection[] = [];
		for (let level = 0; level <= maxLevel; level++) {
			const slottedFeatsForLevel = slottedFeats.filter(feat => feat.slot!.level === level);
			const slottedSlots = slottedFeatsForLevel.map(feat => feat.slot!).map(slot => slot.toProp());
			const missingSlots = currentFeatSlots
				.filter(slot => slot.level === level)
				.filter(slot => !slottedSlots.includes(slot.toProp()))
				.map(slot => ({ slot }));
			featsOrSlotsByLevel.push(
				new FeatsLevelSection(level, [
					...coreFeats.filter(info => info.feat.level === level).map(feat => ({ info: feat })),
					...slottedFeatsForLevel.map(feat => ({ info: feat })),
					...missingSlots,
				]),
			);
		}

		return new FeatsSection(featsOrSlotsByLevel);
	};
}
