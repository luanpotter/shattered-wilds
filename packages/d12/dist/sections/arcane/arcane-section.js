import { firstParagraph, lastOrNull, numberToOrdinal, slugify } from '@shattered-wilds/commons';
import { ARCANE_SPELL_COMPONENTS, ArcaneSpellComponentType, ArcaneSpellSchool, PREDEFINED_ARCANE_SPELLS, } from '../../core/arcane.js';
import { Trait } from '../../core/traits.js';
import { CheckFactory } from '../../engine/check-factory.js';
import { DerivedStatType } from '../../stats/derived-stat.js';
import { Resource, ResourceCost } from '../../stats/resources.js';
import { CircumstanceModifier, ModifierSource } from '../../stats/stat-tree.js';
import { Bonus, Distance } from '../../stats/value.js';
import { ActionRow, ActionRowBox, ActionRowCost, ActionRowValueBox, ActionRowVariableBox, } from '../common/action-row.js';
export class ArcaneSectionDefaults {
    static INITIAL_RANGE = Distance.of(0);
    static INITIAL_SCHOOL = 'All Schools';
    static INITIAL_ATTACK_OPTION = 'All Spells';
    static INITIAL_CASTING_TIME_INDEX = 1; // 2 AP
    static INITIAL_FOCUS_COST_INDEX = 0; // 1 FP
    static createDefaultInputValues(componentOptions) {
        return {
            selectedRange: ArcaneSectionDefaults.INITIAL_RANGE,
            selectedSchool: ArcaneSectionDefaults.INITIAL_SCHOOL,
            selectedAttackOption: ArcaneSectionDefaults.INITIAL_ATTACK_OPTION,
            selectedCastingTime: ArcaneSection.allCastingTimeOptions[ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX],
            selectedFocusCost: ArcaneSection.allFocusCostOptions[ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX],
            selectedSomaticComponent: lastOrNull(componentOptions[ArcaneSpellComponentType.Somatic]),
            selectedVerbalComponent: lastOrNull(componentOptions[ArcaneSpellComponentType.Verbal]),
            selectedFocalComponent: lastOrNull(componentOptions[ArcaneSpellComponentType.Focal]),
            spellAugmentationValues: {},
        };
    }
}
// TODO: we should remove this once the migration is complete
export class ArcaneSectionSpellAugmentation {
    key;
    type;
    typeValue;
    shortDescription;
    variable;
    value;
    bonus;
    tooltip;
    constructor({ key, type, typeValue, shortDescription, variable, value, bonus, tooltip, }) {
        this.key = key;
        this.type = type;
        this.typeValue = typeValue;
        this.shortDescription = shortDescription;
        this.variable = variable;
        this.value = value;
        this.bonus = bonus;
        this.tooltip = tooltip;
    }
    get description() {
        return `Augmentation [${this.type}: ${this.shortDescription}]`;
    }
    toModifier() {
        return new CircumstanceModifier({
            source: ModifierSource.Augmentation,
            name: this.description,
            value: this.bonus,
        });
    }
    toBox() {
        return new ActionRowBox({
            key: this.key,
            labels: [`${this.type}:`, this.typeValue],
            tooltip: this.tooltip,
            data: this.variable
                ? new ActionRowVariableBox({ value: this.bonus, inputValue: this.value })
                : new ActionRowValueBox({ value: this.bonus }),
        });
    }
}
export class ArcaneSection {
    static allSchoolOptions = [
        'All Schools',
        ...Object.values(ArcaneSpellSchool),
    ];
    static allAttackOptions = [
        'All Spells',
        'Only Attacks',
        'Only Utility',
    ];
    static allCastingTimeOptions = [
        { name: '1 AP', value: 1, modifier: Bonus.of(-12), maxFocusCost: 1 },
        { name: '2 AP', value: 2, modifier: Bonus.zero(), maxFocusCost: 2 },
        { name: '3 AP', value: 3, modifier: Bonus.of(2), maxFocusCost: 3 },
        { name: '4 AP', value: 4, modifier: Bonus.of(4), maxFocusCost: 4 },
        { name: 'Ritual', value: 0, modifier: Bonus.of(6) },
    ];
    static allFocusCostOptions = [
        { name: '1 FP', value: 1, modifier: Bonus.zero() },
        { name: '2 FP', value: 2, modifier: Bonus.of(1) },
        { name: '3 FP', value: 3, modifier: Bonus.of(2) },
        { name: '4 FP', value: 4, modifier: Bonus.of(3) },
    ];
    static getAvailableFocusCostOptions(selectedCastingTime) {
        return ArcaneSection.allFocusCostOptions.filter(option => !('maxFocusCost' in selectedCastingTime) ||
            !selectedCastingTime.maxFocusCost ||
            selectedCastingTime.maxFocusCost >= option.value);
    }
    static componentsForFlavor = ({ sheet, }) => {
        const flavor = sheet.characterClass.definition.flavor;
        const intrinsicComponents = ARCANE_SPELL_COMPONENTS.filter(component => component.flavors.includes(flavor));
        const equipmentComponents = sheet.equipment.arcaneComponentModes().map(item => item.toOption());
        const allComponents = [...intrinsicComponents, ...equipmentComponents];
        return Object.groupBy(allComponents, component => component.type);
    };
    static getComponentsForFlavor(sheet) {
        return ArcaneSection.componentsForFlavor({ sheet });
    }
    static computeInfluenceRange = ({ sheet, inputValues, }) => {
        const tree = sheet.getStatTree();
        const { value, description } = tree.getDistance(DerivedStatType.InfluenceRange);
        const { selectedRange } = inputValues;
        const rangeIncrements = Math.max(0, Math.floor((selectedRange.value - 1) / value.value));
        const rangeIncrementModifier = new CircumstanceModifier({
            source: ModifierSource.Circumstance,
            name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
            value: Bonus.of(rangeIncrements * -3),
        });
        return { value, description, rangeIncrementModifier };
    };
    static filterSpells = (inputValues) => {
        const { selectedSchool, selectedAttackOption } = inputValues;
        const attackTraits = [Trait.BodyAttack, Trait.MindAttack, Trait.SoulAttack, Trait.SpecialAttack];
        return Object.values(PREDEFINED_ARCANE_SPELLS)
            .filter(spell => {
            if (selectedSchool === 'All Schools') {
                return true;
            }
            return spell.school === selectedSchool;
        })
            .filter(spell => {
            switch (selectedAttackOption) {
                case 'All Spells':
                    return true;
                case 'Only Attacks':
                    return spell.traits.some(trait => attackTraits.includes(trait));
                case 'Only Utility':
                    return spell.traits.every(trait => !attackTraits.includes(trait));
                default:
                    throw selectedAttackOption;
            }
        });
    };
    static computeSpells = ({ sheet, inputValues, fundamentalModifiers, }) => {
        const tree = sheet.getStatTree();
        const primaryAttribute = sheet.characterClass.definition.primaryAttribute;
        const filteredSpells = ArcaneSection.filterSpells(inputValues);
        return filteredSpells.map(spell => {
            const slug = slugify(spell.name);
            const augmentations = spell.augmentations.map(augmentation => {
                const value = inputValues.spellAugmentationValues[slug]?.[augmentation.key] ?? 1;
                const bonus = Bonus.of(augmentation.computeBonus(value));
                return new ArcaneSectionSpellAugmentation({
                    key: augmentation.key,
                    type: augmentation.type,
                    typeValue: augmentation.value,
                    shortDescription: augmentation.shortDescription,
                    variable: augmentation.variable,
                    value,
                    bonus,
                    tooltip: augmentation.getTooltip(value),
                });
            });
            const spellModifiers = [...fundamentalModifiers, ...augmentations.map(aug => aug.toModifier())];
            const finalModifier = tree.getModifier(primaryAttribute, spellModifiers);
            const checkFactory = new CheckFactory({ characterSheet: sheet });
            const check = checkFactory.spell({
                spellName: spell.name,
                statModifier: finalModifier,
            });
            return new ActionRow({
                slug,
                title: spell.name,
                traits: [spell.school, ...spell.traits],
                description: firstParagraph(spell.description),
                cost: undefined, // we only show the cost boxes on the fundamental spell row
                boxes: [
                    ...augmentations.map(aug => aug.toBox()),
                    ActionRowBox.fromCheck({
                        key: 'check',
                        check,
                        targetDC: undefined, // TODO: reconsider
                        errors: [],
                    }),
                ],
            });
        });
    };
    schoolOptions;
    castingTimeOptions;
    focusCostOptions;
    componentOptions;
    attackOptions;
    influenceRange;
    baseModifier;
    combinedModifier;
    fundamentalCheck;
    fundamentalSpellCost;
    spells;
    constructor({ schoolOptions, castingTimeOptions, focusCostOptions, componentOptions, influenceRange, baseModifier, combinedModifier, fundamentalCheck, fundamentalSpellCost, spells, }) {
        this.schoolOptions = schoolOptions;
        this.castingTimeOptions = castingTimeOptions;
        this.focusCostOptions = focusCostOptions;
        this.componentOptions = componentOptions;
        this.attackOptions = ArcaneSection.allAttackOptions;
        this.influenceRange = influenceRange;
        this.baseModifier = baseModifier;
        this.combinedModifier = combinedModifier;
        this.fundamentalCheck = fundamentalCheck;
        this.fundamentalSpellCost = fundamentalSpellCost;
        this.spells = spells;
    }
    static create({ characterId, sheet, inputValues, }) {
        const tree = sheet.getStatTree();
        const primaryAttribute = sheet.characterClass.definition.primaryAttribute;
        const influenceRange = ArcaneSection.computeInfluenceRange({ sheet, inputValues });
        // Extract component modifiers
        const somaticModifier = inputValues.selectedSomaticComponent?.toComponentModifier();
        const verbalModifier = inputValues.selectedVerbalComponent?.toComponentModifier();
        const focalModifier = inputValues.selectedFocalComponent?.toComponentModifier();
        const combinedModifiers = [
            influenceRange.rangeIncrementModifier,
            somaticModifier,
            verbalModifier,
            focalModifier,
        ].filter((e) => e !== undefined);
        const fundamentalModifiers = [
            ...combinedModifiers,
            inputValues.selectedCastingTime.modifier.value !== 0
                ? new CircumstanceModifier({
                    source: ModifierSource.Augmentation,
                    name: `Casting Time: ${inputValues.selectedCastingTime.name}`,
                    value: inputValues.selectedCastingTime.modifier,
                })
                : undefined,
            inputValues.selectedFocusCost.modifier.value !== 0
                ? new CircumstanceModifier({
                    source: ModifierSource.Augmentation,
                    name: `Focus Cost: ${inputValues.selectedFocusCost.name}`,
                    value: inputValues.selectedFocusCost.modifier,
                })
                : undefined,
        ].filter((e) => e !== undefined);
        const baseModifier = tree.getModifier(primaryAttribute);
        const combinedModifier = tree.getModifier(primaryAttribute, combinedModifiers);
        const fundamentalModifier = tree.getModifier(primaryAttribute, fundamentalModifiers);
        const checkFactory = new CheckFactory({ characterSheet: sheet });
        const fundamentalCheck = checkFactory.spell({
            spellName: 'Fundamental Arcane Spell',
            statModifier: fundamentalModifier,
        });
        const costs = [
            new ResourceCost({ resource: Resource.ActionPoint, amount: inputValues.selectedCastingTime.value }),
            new ResourceCost({ resource: Resource.FocusPoint, amount: inputValues.selectedFocusCost.value }),
        ];
        const fundamentalSpellCost = new ActionRowCost({
            characterId: characterId,
            characterSheet: sheet,
            name: 'Arcane Spell',
            actionCosts: costs,
        });
        const spells = ArcaneSection.computeSpells({ sheet, inputValues, fundamentalModifiers });
        return new ArcaneSection({
            schoolOptions: ArcaneSection.allSchoolOptions,
            castingTimeOptions: ArcaneSection.allCastingTimeOptions,
            focusCostOptions: ArcaneSection.allFocusCostOptions,
            componentOptions: ArcaneSection.componentsForFlavor({ sheet }),
            influenceRange,
            baseModifier,
            combinedModifier,
            fundamentalCheck,
            fundamentalSpellCost,
            spells,
        });
    }
}
//# sourceMappingURL=arcane-section.js.map