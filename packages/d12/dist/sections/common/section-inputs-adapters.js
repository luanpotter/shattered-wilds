import { Bonus, Distance } from '../../stats/value.js';
export class InputValueAdapter {
    static number;
    static bonus;
    static distance;
}
class NumberInputAdapter extends InputValueAdapter {
    raw(value) {
        return `${value}`;
    }
    format(value) {
        return `${value}`;
    }
    parse(value) {
        const parsed = parseInt(value);
        if (isNaN(parsed)) {
            return 0;
        }
        return parsed;
    }
}
class BonusInputAdapter extends InputValueAdapter {
    raw(value) {
        return InputValueAdapter.number.raw(value.value);
    }
    format(value) {
        return value.description;
    }
    parse(value) {
        return Bonus.of(InputValueAdapter.number.parse(value));
    }
}
class DistanceInputAdapter extends InputValueAdapter {
    raw(value) {
        return InputValueAdapter.number.raw(value.value);
    }
    format(value) {
        return value.description;
    }
    parse(value) {
        return Distance.of(InputValueAdapter.number.parse(value));
    }
}
InputValueAdapter.number = new NumberInputAdapter();
InputValueAdapter.bonus = new BonusInputAdapter();
InputValueAdapter.distance = new DistanceInputAdapter();
//# sourceMappingURL=section-inputs-adapters.js.map