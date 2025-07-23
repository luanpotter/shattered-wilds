import { FeatInfo, FeatSlot } from '@shattered-wilds/commons';
import { CharacterSheet } from './character-sheet';

// each "card" we want to show in the feats section; either:
// - a core (non-slotted) feat
// - a slotted feat (which has a slot)
// - a feat slot (which has no info, just a slot)
export interface FeatOrSlot {
	info?: FeatInfo<any>;
	slot?: FeatSlot;
}

export class FeatsSection {
	featsOrSlotsByLevel: [number, FeatOrSlot[]][];
	missingFeatSlots: FeatOrSlot[];

	constructor(sheet: CharacterSheet) {
		const { featsOrSlotsByLevel, missingFeatSlots } = FeatsSection.create(sheet);
		this.featsOrSlotsByLevel = featsOrSlotsByLevel;
		this.missingFeatSlots = missingFeatSlots;
	}

    get hasMissingFeats(): boolean {
        return this.missingFeatSlots.length > 0;
    }

	private static create = (sheet: CharacterSheet): FeatsSection => {
		const coreFeats = sheet.feats.getCoreFeats();
		const slottedFeats = sheet.feats.getSlottedFeats();
		const currentFeatSlots = sheet.getFeatSlots();

		const maxLevel = Math.max(
			...slottedFeats.map(feat => feat.slot!.level), //
			...currentFeatSlots.map(slot => slot.level), //
		);

		const featsOrSlotsByLevel: [number, FeatOrSlot[]][] = [];
		const missingFeatSlots: FeatOrSlot[] = [];
		for (let level = 1; level <= maxLevel; level++) {
			const slottedFeatsForLevel = slottedFeats.filter(feat => feat.slot!.level === level);
			const slottedSlots = slottedFeatsForLevel.map(feat => feat.slot!).map(slot => slot.toProp());
			const missingSlots = currentFeatSlots
				.filter(slot => slot.level === level)
				.filter(slot => !slottedSlots.includes(slot.toProp()))
				.map(slot => ({ slot }));
			featsOrSlotsByLevel.push([
				level,
				[
					...coreFeats.filter(info => info.feat.level === level).map(feat => ({ info: feat })),
					...slottedFeatsForLevel.map(feat => ({ info: feat })),
					...missingSlots,
				],
			]);
			missingFeatSlots.push(...missingSlots);
		}

		return {
			featsOrSlotsByLevel,
			missingFeatSlots,
		};
	};
}
