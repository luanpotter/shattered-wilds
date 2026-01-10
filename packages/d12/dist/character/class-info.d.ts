import { CharacterClass, ClassDefinition } from '../core/classes.js';
import { FeatInfo } from '../core/feats.js';
export declare class ClassInfo {
    characterClass: CharacterClass;
    constructor(characterClass: CharacterClass);
    static from(props: Record<string, string>): ClassInfo;
    get definition(): ClassDefinition;
    getCoreFeats(customCoreFeatParameters: Record<string, string>): FeatInfo<string | void>[];
    toString(): string;
}
//# sourceMappingURL=class-info.d.ts.map