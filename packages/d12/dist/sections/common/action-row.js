export class ActionRowCost {
    characterId;
    characterSheet;
    name;
    actionCosts;
    canAfford;
    constructor({ characterId, characterSheet, name, actionCosts, }) {
        this.characterId = characterId;
        this.characterSheet = characterSheet;
        this.name = name;
        this.actionCosts = actionCosts;
        this.canAfford = actionCosts.every(cost => characterSheet.getResource(cost.resource).current >= cost.amount);
    }
}
export class ActionRowValueBox {
    value;
    constructor({ value }) {
        this.value = value;
    }
    hasErrors() {
        return false;
    }
}
export class ActionRowVariableBox {
    inputValue;
    value;
    constructor({ inputValue, value }) {
        this.inputValue = inputValue;
        this.value = value;
    }
    hasErrors() {
        return false;
    }
}
export class ActionRowCheckBoxError {
    title;
    tooltip;
    text;
    constructor({ title, tooltip, text }) {
        this.title = title;
        this.tooltip = tooltip;
        this.text = text;
    }
}
export class ActionRowCheckBox {
    check;
    targetDC;
    errors;
    constructor({ check, targetDC, errors, }) {
        this.check = check;
        this.targetDC = targetDC;
        this.errors = errors;
    }
    hasErrors() {
        return this.errors.length > 0;
    }
}
export class ActionRowBox {
    key;
    labels;
    tooltip;
    data;
    constructor({ key, labels, tooltip, data, }) {
        this.key = key;
        this.labels = labels;
        this.tooltip = tooltip;
        this.data = data;
    }
    hasErrors() {
        return this.data.hasErrors();
    }
    static fromCheck({ key, check, targetDC, errors, }) {
        const tooltip = [
            `Stat: ${check.statModifier.statType}`,
            check.statModifier.description,
            `Check type: ${check.mode}-${check.nature}`,
            targetDC && `Target DC: ${targetDC}`,
        ]
            .filter(Boolean)
            .join('\n');
        const data = new ActionRowCheckBox({ check, targetDC, errors });
        const inherentModifier = check.statModifier.inherentModifier;
        const name = check.statModifier.statType;
        const title = `${name} (${inherentModifier.description})`;
        return new ActionRowBox({
            key,
            labels: [title],
            tooltip,
            data,
        });
    }
}
export class ActionRow {
    slug;
    cost;
    title;
    traits = [];
    description;
    boxes;
    constructor({ slug, cost, title, traits, description, boxes, }) {
        this.slug = slug;
        this.cost = cost;
        this.title = title;
        this.traits = traits;
        this.description = description;
        this.boxes = boxes;
    }
    hasErrors() {
        if (this.cost !== undefined && !this.cost.canAfford) {
            return true;
        }
        return this.boxes.some(box => box.hasErrors());
    }
}
//# sourceMappingURL=action-row.js.map