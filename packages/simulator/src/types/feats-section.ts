import { CharacterSheet, FeatDefinition, FeatInfo, FEATS, FeatSlot, FeatType } from '@shattered-wilds/commons';
import * as TypeComparator from 'type-comparator';

// each "card" we want to show in the feats section; either:
// - a core (non-slotted) feat
// - a slotted feat (which has a slot)
// - a feat slot (which has no info, just a slot)
export class FeatOrSlot {
	info: FeatInfo<string | void> | undefined;
	slot: FeatSlot | undefined;
	warning: FeatSlotWarning | undefined;

	constructor({
		info,
		slot,
		warning,
	}: {
		info?: FeatInfo<string | void> | undefined;
		slot?: FeatSlot | undefined;
		warning?: FeatSlotWarning | undefined;
	}) {
		this.info = info;
		this.slot = slot;
		this.warning = warning;
	}

	get isEmpty(): boolean {
		return this.hasSlot && !this.hasFeat;
	}

	get hasSlot(): boolean {
		return this.slot !== undefined;
	}

	get hasFeat(): boolean {
		return this.info !== undefined;
	}

	get level(): number {
		return (this.slot?.level ?? this.info?.slot?.level ?? this.info?.feat?.level)!;
	}
}

export enum FeatSlotWarning {
	// a slot that exists but is empty
	Empty = 'Empty',
	// an extra slot from Specialized Training that is filled while the character does not have the Specialized Training feat
	InvalidExtra = 'InvalidExtra',
	// a feat that does not fit the slot or character
	InvalidFeatUnfit = 'InvalidFeatUnfit',
	// a slot that does not exist for the character
	InvalidSlotUnfit = 'InvalidSlotUnfit',
}

export class FeatsLevelSection {
	level: number;
	featsOrSlots: FeatOrSlot[];

	constructor(level: number, featsOrSlots: FeatOrSlot[]) {
		this.level = level;
		this.featsOrSlots = featsOrSlots;
	}

	get warnings(): FeatSlotWarning[] {
		return this.featsOrSlots.map(featOrSlot => featOrSlot.warning).filter(warning => !!warning);
	}

	get hasWarnings(): boolean {
		return this.warnings.length > 0;
	}
}

export class FeatsSection {
	featsOrSlotsByLevel: FeatsLevelSection[];

	private constructor(featsOrSlotsByLevel: FeatsLevelSection[]) {
		this.featsOrSlotsByLevel = featsOrSlotsByLevel;
	}

	get warnings(): FeatSlotWarning[] {
		return this.featsOrSlotsByLevel.flatMap(section => section.warnings).filter(warning => !!warning);
	}

	get hasWarnings(): boolean {
		return this.warnings.length > 0;
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
			TypeComparator.map((x: FeatDefinition<string | void>) => (x.isGeneral ? 1 : 0), TypeComparator.asc),
		]);
		return (
			Object.values(FEATS)
				// fits the slot
				.filter(feat => feat.fitsSlot(slot))
				// fits the character sheet
				.filter(feat => sheet.fitsFeat(feat))
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
			.map(feat => new FeatOrSlot({ info: feat }));
		const slottedFeatOrSlots = slottedFeats
			// slotted feats must be re-paired with the sheet slots
			// it is possible for example that the Specialized Training feat was removed
			.map(feat => {
				const featSlot = feat.slot!; // slotted feats have a slot
				const sheetSlot = currentFeatSlots.find(slot => slot.toProp() === featSlot.toProp());
				const warning = FeatsSection.computeWarningsForFeatAndSlot(feat, sheetSlot, sheet);
				return new FeatOrSlot({ info: feat, slot: sheetSlot, warning });
			});
		const missingFeatOrSlots = missingSlots.map(slot => new FeatOrSlot({ slot, warning: FeatSlotWarning.Empty }));

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

	private static computeWarningsForFeatAndSlot = (
		feat: FeatInfo<string | void>,
		slot: FeatSlot | undefined,
		sheet: CharacterSheet,
	): FeatSlotWarning | undefined => {
		if (!slot || !feat.feat.fitsSlot(slot)) {
			return FeatSlotWarning.InvalidSlotUnfit;
		}
		if (!sheet.fitsFeat(feat.feat)) {
			return FeatSlotWarning.InvalidFeatUnfit;
		}
		if (slot.isExtra && !sheet.feats.hasSpecializedTraining) {
			return FeatSlotWarning.InvalidExtra;
		}
		return undefined;
	};
}
