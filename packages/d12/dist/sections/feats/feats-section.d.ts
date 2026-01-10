import { FeatDefinition, FeatInfo, FeatSlot } from '../../core/feats.js';
import { CharacterSheet } from '../../character/character-sheet.js';
export declare class FeatOrSlot {
    info: FeatInfo<string | void> | undefined;
    slot: FeatSlot | undefined;
    warning: FeatSlotWarning | undefined;
    constructor({ info, slot, warning, }: {
        info?: FeatInfo<string | void> | undefined;
        slot?: FeatSlot | undefined;
        warning?: FeatSlotWarning | undefined;
    });
    get isEmpty(): boolean;
    get hasSlot(): boolean;
    get hasFeat(): boolean;
    get level(): number;
}
export declare enum FeatSlotWarning {
    Empty = "Empty",
    InvalidExtra = "InvalidExtra",
    InvalidFeatUnfit = "InvalidFeatUnfit",
    InvalidSlotUnfit = "InvalidSlotUnfit"
}
export declare class FeatsLevelSection {
    level: number;
    featsOrSlots: FeatOrSlot[];
    constructor(level: number, featsOrSlots: FeatOrSlot[]);
    get warnings(): FeatSlotWarning[];
    get hasWarnings(): boolean;
}
export declare class FeatsSection {
    featsOrSlotsByLevel: FeatsLevelSection[];
    private constructor();
    get warnings(): FeatSlotWarning[];
    get hasWarnings(): boolean;
    get isEmpty(): boolean;
    hasFeat(feat: FeatDefinition<string | void>): boolean;
    availableFeatsForSlot(slot: FeatSlot, sheet: CharacterSheet): FeatDefinition<string | void>[];
    static create: (sheet: CharacterSheet) => FeatsSection;
    private static computeWarningsForFeatAndSlot;
}
//# sourceMappingURL=feats-section.d.ts.map