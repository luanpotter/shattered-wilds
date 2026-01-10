import * as TypeComparator from 'type-comparator';
import { FEATS, FeatType } from '../../core/feats.js';
/// Each precomputed "card" we want to show in the feats section in character sheet; either:
/// - a core (non-slotted) feat
/// - a slotted feat (which has a slot)
/// - a feat slot (which has no info, just a slot)
export class FeatOrSlot {
    info;
    slot;
    warning;
    constructor({ info, slot, warning, }) {
        this.info = info;
        this.slot = slot;
        this.warning = warning;
    }
    get isEmpty() {
        return this.hasSlot && !this.hasFeat;
    }
    get hasSlot() {
        return this.slot !== undefined;
    }
    get hasFeat() {
        return this.info !== undefined;
    }
    get level() {
        return (this.slot?.level ?? this.info?.slot?.level ?? this.info?.feat?.level);
    }
}
export var FeatSlotWarning;
(function (FeatSlotWarning) {
    // a slot that exists but is empty
    FeatSlotWarning["Empty"] = "Empty";
    // an extra slot from Specialized Training that is filled while the character does not have the Specialized Training feat
    FeatSlotWarning["InvalidExtra"] = "InvalidExtra";
    // a feat that does not fit the slot or character
    FeatSlotWarning["InvalidFeatUnfit"] = "InvalidFeatUnfit";
    // a slot that does not exist for the character
    FeatSlotWarning["InvalidSlotUnfit"] = "InvalidSlotUnfit";
})(FeatSlotWarning || (FeatSlotWarning = {}));
export class FeatsLevelSection {
    level;
    featsOrSlots;
    constructor(level, featsOrSlots) {
        this.level = level;
        this.featsOrSlots = featsOrSlots;
    }
    get warnings() {
        return this.featsOrSlots.map(featOrSlot => featOrSlot.warning).filter(warning => !!warning);
    }
    get hasWarnings() {
        return this.warnings.length > 0;
    }
}
export class FeatsSection {
    featsOrSlotsByLevel;
    constructor(featsOrSlotsByLevel) {
        this.featsOrSlotsByLevel = featsOrSlotsByLevel;
    }
    get warnings() {
        return this.featsOrSlotsByLevel.flatMap(section => section.warnings).filter(warning => !!warning);
    }
    get hasWarnings() {
        return this.warnings.length > 0;
    }
    get isEmpty() {
        return this.featsOrSlotsByLevel.length === 0;
    }
    hasFeat(feat) {
        return this.featsOrSlotsByLevel.some(section => section.featsOrSlots.some(featOrSlot => featOrSlot.info?.feat?.key === feat.key));
    }
    availableFeatsForSlot(slot, sheet) {
        const comparator = TypeComparator.queue([
            TypeComparator.map((x) => x.level, TypeComparator.desc),
            TypeComparator.map((x) => x.type === FeatType.Major, TypeComparator.desc),
            TypeComparator.map((x) => (x.isGeneral ? 1 : 0), TypeComparator.asc),
        ]);
        return (Object.values(FEATS)
            // fits the slot
            .filter(feat => feat.fitsSlot(slot))
            // fits the character sheet
            .filter(feat => sheet.fitsFeat(feat))
            // not already slotted
            .filter(feat => feat.parameter || !this.hasFeat(feat))
            .sort(comparator));
    }
    static create = (sheet) => {
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
            const featSlot = feat.slot; // slotted feats have a slot
            const sheetSlot = currentFeatSlots.find(slot => slot.toProp() === featSlot.toProp());
            const warning = FeatsSection.computeWarningsForFeatAndSlot(feat, sheetSlot, sheet);
            return new FeatOrSlot({ info: feat, slot: sheetSlot, warning });
        });
        const missingFeatOrSlots = missingSlots.map(slot => new FeatOrSlot({ slot, warning: FeatSlotWarning.Empty }));
        const featOrSlots = [...coreFeatOrSlots, ...slottedFeatOrSlots, ...missingFeatOrSlots];
        const maxLevel = Math.max(...featOrSlots.map(featOrSlot => featOrSlot.level));
        const featsOrSlotsByLevel = Array.from({ length: maxLevel + 1 }, (_, level) => {
            return new FeatsLevelSection(level, featOrSlots.filter(featOrSlot => featOrSlot.level === level));
        });
        return new FeatsSection(featsOrSlotsByLevel);
    };
    static computeWarningsForFeatAndSlot = (feat, slot, sheet) => {
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
//# sourceMappingURL=feats-section.js.map