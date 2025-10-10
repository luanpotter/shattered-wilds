import {
	Action,
	ActionCheckParameter,
	ACTIONS,
	ActionTabInputValues,
	ActionTabParameterCalculator,
	ActionType,
	CharacterSheet,
	Check,
	CheckFactory,
	DEFENSE_TRAITS,
	DefenseTrait,
	Distance,
	PassiveCoverType,
} from '@shattered-wilds/commons';

export interface BasicAttack {
	name: string;
	check: Check;
	range: Distance;
}

export interface BasicDefense {
	action: Action;
	name: string;
	check: Check;
}

export const getBasicAttacksFor = (character: CharacterSheet): BasicAttack[] => {
	const checkFactory = new CheckFactory({ characterSheet: character });
	return character.equipment.weaponModes().map(weaponMode => ({
		name: weaponMode.name,
		check: checkFactory.weapon({ weaponMode }),
		range: weaponMode.mode.range,
	}));
};

export const getBasicDefensesForRealm = (character: CharacterSheet, realm: DefenseTrait): BasicDefense[] => {
	const checkFactory = new CheckFactory({ characterSheet: character });
	return Object.values(ACTIONS)
		.filter(action => action.type === ActionType.Defense)
		.filter(action => action.traits.some(trait => trait === realm))
		.map(action => {
			const defenseCheckParameter = action.parameters.findLast(param => param instanceof ActionCheckParameter);
			if (!defenseCheckParameter) {
				throw `Defense action ${action.name} is missing a check parameter`;
			}
			const equipment = character.equipment;
			const inputValues = new ActionTabInputValues({
				selectedWeaponMode: equipment.defaultWeaponMode(),
				selectedRangeValue: 0, // not relevant for defenses
				selectedDefenseRealm: DEFENSE_TRAITS[realm],
				selectedPassiveCover: PassiveCoverType.None, // not relevant for defenses
				heightIncrements: 0, // not relevant for defenses
				selectedArmor: equipment.defaultArmor(),
				selectedShield: equipment.defaultShield(),
			});
			const check = ActionTabParameterCalculator.computeCheck({
				checkFactory,
				action,
				parameter: defenseCheckParameter,
				inputValues,
			});
			return { action: action.key, name: action.name, check };
		});
};
