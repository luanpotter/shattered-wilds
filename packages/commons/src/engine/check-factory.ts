import { CharacterSheet } from '../character/character-sheet.js';
import { WeaponModeOption } from '../character/equipment.js';
import { Check, CheckMode, CheckNature } from '../stats/check.js';
import { DerivedStatType } from '../stats/derived-stat.js';
import { CircumstanceModifier, StatModifier, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';

export class CheckFactory {
	// private characterSheet: CharacterSheet;
	private statTree: StatTree;

	constructor({ characterSheet }: { characterSheet: CharacterSheet }) {
		// this.characterSheet = characterSheet;
		this.statTree = characterSheet.getStatTree();
	}

	initiative() {
		const initiativeModifier = this.statTree.getModifier(DerivedStatType.Initiative);
		return this.create({
			mode: CheckMode.Contested,
			nature: CheckNature.Resisted,
			descriptor: 'Initiative',
			statModifier: initiativeModifier,
		});
	}

	weapon({ weaponMode }: { weaponMode: WeaponModeOption }) {
		const attackStat = weaponMode.mode.statType;
		const weaponModifier = weaponMode.getEquipmentModifier();
		const cms = weaponModifier ? [weaponModifier] : [];
		const statModifier = this.statTree.getModifier(attackStat, cms);

		return this.create({
			mode: CheckMode.Contested,
			nature: CheckNature.Active,
			descriptor: weaponMode.weapon.name,
			statModifier,
		});
	}

	action({
		mode,
		nature,
		descriptor,
		statType,
		circumstanceModifiers = [],
	}: {
		mode: CheckMode;
		nature: CheckNature;
		descriptor: string;
		statType: StatType | DerivedStatType;
		circumstanceModifiers?: CircumstanceModifier[];
	}): Check {
		const statModifier = this.statTree.getModifier(statType, circumstanceModifiers);
		return this.create({ mode, nature, descriptor, statModifier });
	}

	spell({ spellName, statModifier }: { spellName: string; statModifier: StatModifier }): Check {
		return this.create({
			mode: CheckMode.Contested,
			nature: CheckNature.Active,
			descriptor: spellName,
			statModifier,
		});
	}

	divineChanneling({ baseModifier }: { baseModifier: StatModifier }): Check {
		return this.create({
			mode: CheckMode.Contested,
			descriptor: 'Divine Channeling',
			nature: CheckNature.Active,
			statModifier: baseModifier,
		});
	}

	stat({
		mode,
		nature,
		statType,
		circumstanceModifiers = [],
	}: {
		mode: CheckMode;
		nature: CheckNature;
		statType: StatType | DerivedStatType;
		circumstanceModifiers?: CircumstanceModifier[];
	}) {
		const statModifier = this.statTree.getModifier(statType, circumstanceModifiers);
		const descriptor = statType.toString();
		return this.create({ mode, nature, descriptor, statModifier });
	}

	private create({
		mode,
		descriptor,
		nature,
		statModifier,
	}: {
		mode: CheckMode;
		descriptor: string;
		nature: CheckNature;
		statModifier: StatModifier;
	}): Check {
		return new Check({
			mode,
			descriptor,
			nature,
			statModifier,
		});
	}
}
