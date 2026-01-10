import { FeatDefinition, FeatInfo, FeatSlot, FeatSource } from '../core/feats.js';
import { Size } from '../core/size.js';
import { Resource, ResourceValue } from '../stats/resources.js';
import { InherentModifier, StatNode, StatTree } from '../stats/stat-tree.js';
import { Circumstances } from './circumstances.js';
import { ClassInfo } from './class-info.js';
import { Equipment } from './equipment.js';
import { Personality } from './personality.js';
import { RaceInfo } from './race-info.js';
export declare class CharacterFeats {
    featInfos: FeatInfo<string | void>[];
    constructor(coreFeats: FeatInfo<string | void>[], feats: FeatInfo<string | void>[]);
    getCoreFeats(): FeatInfo<string | void>[];
    getSlottedFeats(): FeatInfo<string | void>[];
    getFeatModifiers(): InherentModifier[];
    get hasSpecializedTraining(): boolean;
    static from(props: Record<string, string>, race: RaceInfo, characterClass: ClassInfo): CharacterFeats;
}
export declare class CharacterSheet {
    name: string;
    race: RaceInfo;
    characterClass: ClassInfo;
    feats: CharacterFeats;
    attributeRoot: StatNode;
    circumstances: Circumstances;
    equipment: Equipment;
    personality: Personality;
    constructor({ name, race, characterClass, feats, attributeRoot, equipment, circumstances, personality, }: {
        name: string;
        race: RaceInfo;
        characterClass: ClassInfo;
        feats: CharacterFeats;
        attributeRoot: StatNode;
        equipment: Equipment;
        circumstances: Circumstances;
        personality: Personality;
    });
    get size(): Size;
    get level(): number;
    fitsFeat(feat: FeatDefinition<string | void>): boolean;
    applicableSource(feat: FeatDefinition<string | void>): FeatSource | undefined;
    getResource(resource: Resource): ResourceValue;
    updateResourceToValue(resource: Resource, value: number): number;
    updateResourceToMax(resource: Resource): number;
    updateResourceByDelta(resource: Resource, delta: number): number;
    getStatTree(): StatTree;
    getFeatSlots(): FeatSlot[];
    getAllModifiers(): InherentModifier[];
    static from(props: Record<string, string>): CharacterSheet;
    private static encode;
    private static decode;
    static parsePropsFromShareString(shareString: string): Record<string, string> & {
        name: string;
    };
    static toShareString(props: Record<string, string>): string;
}
export declare const extractCustomCoreParameters: (props: Record<string, string>) => Record<string, string>;
//# sourceMappingURL=character-sheet.d.ts.map