import { CharacterSheet } from '../../character/character-sheet.js';
import { StatModifier } from '../../stats/stat-tree.js';
import { Distance } from '../../stats/value.js';
import { ActionRow } from '../common/action-row.js';
export declare class DivineSection {
    baseModifier: StatModifier;
    influenceRange: {
        value: Distance;
        description: string;
    };
    pureDivineChanneling: ActionRow;
    constructor({ baseModifier, influenceRange, pureDivineChanneling, }: {
        baseModifier: StatModifier;
        influenceRange: {
            value: Distance;
            description: string;
        };
        pureDivineChanneling: ActionRow;
    });
    static create({ characterId, characterSheet, }: {
        characterId: string;
        characterSheet: CharacterSheet;
    }): DivineSection | undefined;
}
//# sourceMappingURL=divine-section.d.ts.map