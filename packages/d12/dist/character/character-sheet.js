import { Feat, FeatDefinition, FeatInfo, FeatSlot, FeatStatModifier, FeatType } from '../core/feats.js';
import { RESOURCES } from '../stats/resources.js';
import { InherentModifier, ModifierSource, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Circumstances } from './circumstances.js';
import { ClassInfo } from './class-info.js';
import { Equipment } from './equipment.js';
import { Personality } from './personality.js';
import { RaceInfo } from './race-info.js';
export class CharacterFeats {
    featInfos;
    constructor(coreFeats, feats) {
        this.featInfos = [...coreFeats, ...feats];
    }
    getCoreFeats() {
        return this.featInfos.filter(info => info.feat.type === FeatType.Core);
    }
    getSlottedFeats() {
        return this.featInfos.filter(info => info.slot);
    }
    getFeatModifiers() {
        const modifiers = [];
        for (const info of this.featInfos) {
            const feat = info.feat;
            const effects = feat.effects?.(info) || [];
            const featModifiers = effects
                .filter(e => e instanceof FeatStatModifier)
                .map(e => {
                return new InherentModifier({
                    source: ModifierSource.Feat,
                    name: feat.name,
                    statType: e.statType,
                    value: e.value,
                });
            });
            modifiers.push(...featModifiers);
        }
        return modifiers;
    }
    get hasSpecializedTraining() {
        return this.featInfos.some(info => info.feat.key === Feat.SpecializedTraining);
    }
    static from(props, race, characterClass) {
        const customCoreFeatParameters = extractCustomCoreParameters(props);
        const coreFeats = [
            ...race.getCoreFeats(customCoreFeatParameters),
            ...characterClass.getCoreFeats(customCoreFeatParameters),
        ];
        const feats = Object.entries(props)
            .filter(([key]) => key.startsWith('feat.'))
            .map(prop => FeatInfo.fromProp(prop));
        return new CharacterFeats(coreFeats, feats);
    }
}
export class CharacterSheet {
    name;
    race;
    characterClass;
    feats;
    attributeRoot;
    circumstances;
    equipment;
    personality;
    constructor({ name, race, characterClass, feats, attributeRoot, equipment, circumstances, personality, }) {
        this.name = name;
        this.race = race;
        this.characterClass = characterClass;
        this.feats = feats;
        this.attributeRoot = attributeRoot;
        this.equipment = equipment;
        this.circumstances = circumstances;
        this.personality = personality;
    }
    get size() {
        return this.race.size;
    }
    get level() {
        return this.getStatTree().root.points;
    }
    fitsFeat(feat) {
        return feat.fitsCharacter(this.characterClass.definition, this.race.primaryRace, this.race.upbringing);
    }
    applicableSource(feat) {
        return feat.sources.find(source => FeatDefinition.doesSourceFitCharacter(source, this.characterClass.definition, this.race.primaryRace, this.race.upbringing));
    }
    getResource(resource) {
        return this.circumstances.currentResources.get(this.getStatTree(), resource);
    }
    updateResourceToValue(resource, value) {
        const { max } = this.getResource(resource);
        return Math.max(0, Math.min(max, value));
    }
    updateResourceToMax(resource) {
        const { max } = this.getResource(resource);
        return this.updateResourceToValue(resource, max);
    }
    updateResourceByDelta(resource, delta) {
        const { current } = this.getResource(resource);
        return this.updateResourceToValue(resource, current + delta);
    }
    getStatTree() {
        return new StatTree(this.attributeRoot, this.getAllModifiers());
    }
    getFeatSlots() {
        return FeatSlot.generateSlots({
            maxLevel: this.level,
            hasSpecializedTraining: this.feats.hasSpecializedTraining,
        });
    }
    // Get all modifiers from all sources (feats, equipment, etc.)
    getAllModifiers() {
        const modifiers = [];
        // Add feat modifiers (includes race, class, and upbringing modifiers)
        modifiers.push(...this.feats.getFeatModifiers());
        // Add equipment modifiers (armor DEX penalties)
        this.equipment.armorModes().forEach(({ item, mode }) => {
            if (mode.dexPenalty.isNotZero) {
                modifiers.push(new InherentModifier({
                    source: ModifierSource.Equipment,
                    name: `${item.name} (${mode.type}) DEX Penalty`,
                    statType: StatType.DEX,
                    value: mode.dexPenalty, // dexPenalty is already stored as negative
                }));
            }
        });
        return modifiers;
    }
    static from(props) {
        const race = RaceInfo.from(props);
        const characterClass = ClassInfo.from(props);
        return new CharacterSheet({
            name: props['name'],
            race,
            characterClass,
            feats: CharacterFeats.from(props, race, characterClass),
            attributeRoot: StatTree.buildRootNode(props),
            equipment: Equipment.from(props['equipment']),
            circumstances: Circumstances.from(props),
            personality: Personality.from(props),
        });
    }
    static encode(value) {
        const bytes = new TextEncoder().encode(value);
        const bin = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
        return btoa(bin);
    }
    static decode(value) {
        const bin = atob(value);
        const bytes = Uint8Array.from(bin, char => char.codePointAt(0));
        return new TextDecoder().decode(bytes);
    }
    static parsePropsFromShareString(shareString) {
        const props = {};
        const lines = this.decode(shareString).split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine)
                continue;
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = trimmedLine.substring(0, colonIndex).trim();
            const value = trimmedLine.substring(colonIndex + 1).trim();
            // Skip empty values to avoid parsing issues
            if (value === '')
                continue;
            props[key] = value;
        }
        const fallbackName = 'Imported Character';
        return { name: fallbackName, ...props };
    }
    static toShareString(props) {
        const keyValuePairs = Object.entries(props)
            .filter(([key, value]) => !StatType.values.some(stat => stat.name === key) || value !== '0')
            .filter(([key, value]) => !Object.keys(RESOURCES).some(resource => resource === key) || value !== '-1')
            .filter(([, value]) => value !== '')
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        return this.encode(keyValuePairs);
    }
}
export const extractCustomCoreParameters = (props) => {
    return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('core.')));
};
//# sourceMappingURL=character-sheet.js.map