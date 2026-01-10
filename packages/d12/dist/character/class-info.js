import { CharacterClass, CLASS_DEFINITIONS } from '../core/classes.js';
import { FeatInfo, FEATS, FeatType } from '../core/feats.js';
export class ClassInfo {
    characterClass;
    constructor(characterClass) {
        this.characterClass = characterClass;
    }
    static from(props) {
        const characterClass = props['class'] ?? CharacterClass.Fighter;
        return new ClassInfo(characterClass);
    }
    get definition() {
        return CLASS_DEFINITIONS[this.characterClass];
    }
    getCoreFeats(customCoreFeatParameters) {
        const classFeats = Object.values(FEATS)
            .filter(feat => feat.fitsClass(this.definition))
            .filter(feat => feat.type === FeatType.Core);
        const classDefinition = CLASS_DEFINITIONS[this.characterClass];
        const parameters = {
            'class-role': classDefinition.role,
            stat: classDefinition.primaryAttribute.name,
            ...customCoreFeatParameters,
        };
        return FeatInfo.hydrateFeatDefinitions(classFeats, parameters);
    }
    toString() {
        return this.characterClass;
    }
}
//# sourceMappingURL=class-info.js.map