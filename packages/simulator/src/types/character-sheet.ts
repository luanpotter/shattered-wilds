import {
	StatTree,
	StatNode,
	InherentModifier,
	ModifierSource,
	StatType,
	Size,
	RACE_DEFINITIONS,
	FeatInfo,
	FeatType,
	FeatStatModifier,
	FeatSlot,
	Feat,
	StatModifier,
	Check,
	CheckNature,
	CheckMode,
	CircumstanceModifier,
	RaceInfo,
	ClassInfo,
} from '@shattered-wilds/commons';

import { DerivedStatType } from '../../../commons/dist/stats/derived-stat';

import { DerivedStat, BasicAttack, DefenseType, DEFENSE_TYPE_PROPERTIES } from './core';
import { Equipment, Armor, Shield, Weapon } from './equipment';

export class DerivedStats {
	size: DerivedStat<Size>;
	movement: DerivedStat<number>;
	initiative: DerivedStat<number>;
	maxHeroism: DerivedStat<number>;
	maxVitality: DerivedStat<number>;
	maxFocus: DerivedStat<number>;
	maxSpirit: DerivedStat<number>;

	constructor(race: RaceInfo, statTree: StatTree) {
		this.size = this.computeSize(race);
		this.movement = this.computeMovement(statTree);
		this.initiative = this.computeInitiative(statTree);
		this.maxHeroism = this.computeMaxHeroism(statTree);
		this.maxVitality = this.computeMaxVitality(statTree);
		this.maxFocus = this.computeMaxFocus(statTree);
		this.maxSpirit = this.computeMaxSpirit(statTree);
	}

	get<T>(key: string): DerivedStat<T> {
		return this[key as keyof DerivedStats] as DerivedStat<T>;
	}

	private computeSize(race: RaceInfo): DerivedStat<Size> {
		const size = RACE_DEFINITIONS[race.primaryRace].size;
		return new DerivedStat(size, `Size is determined by your primary race (${size})`);
	}

	private computeMovement(statTree: StatTree): DerivedStat<number> {
		const result = statTree.computeDerivedStat(DerivedStatType.Movement);
		return new DerivedStat(Math.max(result.value, 1), `Movement = ${result.tooltip}`);
	}

	private computeInitiative(statTree: StatTree): DerivedStat<number> {
		const result = statTree.computeDerivedStat(DerivedStatType.Initiative);
		return new DerivedStat(result.value, `Initiative = ${result.tooltip}`);
	}

	private computeMaxHeroism(statTree: StatTree): DerivedStat<number> {
		const level = statTree.root.points;
		return new DerivedStat(level, `Max Heroism Points = ${level} (Level)`);
	}

	private computeMaxVitality(statTree: StatTree): DerivedStat<number> {
		const body = statTree.valueOf(StatType.Body);
		const value = Math.max(1, 4 + body);
		return new DerivedStat(value, `Max Vitality Points = max(1, 4 + ${body} (Body))`);
	}

	private computeMaxFocus(statTree: StatTree): DerivedStat<number> {
		const mind = statTree.valueOf(StatType.Mind);
		const value = Math.max(1, 4 + mind);
		return new DerivedStat(value, `Max Focus Points = max(1, 4 + ${mind} (Mind))`);
	}

	private computeMaxSpirit(statTree: StatTree): DerivedStat<number> {
		const soul = statTree.valueOf(StatType.Soul);
		const value = Math.max(1, 4 + soul);
		return new DerivedStat(value, `Max Spirit Points = max(1, 4 + ${soul} (Soul))`);
	}
}

export class CurrentValues {
	currentHeroism: number;
	currentVitality: number;
	currentFocus: number;
	currentSpirit: number;

	constructor(currentHeroism: number, currentVitality: number, currentFocus: number, currentSpirit: number) {
		this.currentHeroism = currentHeroism;
		this.currentVitality = currentVitality;
		this.currentFocus = currentFocus;
		this.currentSpirit = currentSpirit;
	}

	static MAX_VALUE = -1;

	static from(props: Record<string, string>): CurrentValues {
		const parse = (value?: string): number => {
			return value ? parseInt(value) : CurrentValues.MAX_VALUE;
		};
		const currentHeroism = parse(props['currentHeroism']);
		const currentVitality = parse(props['currentVitality']);
		const currentFocus = parse(props['currentFocus']);
		const currentSpirit = parse(props['currentSpirit']);

		return new CurrentValues(currentHeroism, currentVitality, currentFocus, currentSpirit);
	}

	get(key: string): number {
		return this[key as keyof CurrentValues] as number;
	}

	backfill(sheet: CharacterSheet) {
		const fallback = (value: number, fallback: () => number): number => {
			return value === CurrentValues.MAX_VALUE ? fallback() : value;
		};
		this.currentHeroism = fallback(this.currentHeroism, () => sheet.derivedStats.maxHeroism.value);
		this.currentVitality = fallback(this.currentVitality, () => sheet.derivedStats.maxVitality.value);
		this.currentFocus = fallback(this.currentFocus, () => sheet.derivedStats.maxFocus.value);
		this.currentSpirit = fallback(this.currentSpirit, () => sheet.derivedStats.maxSpirit.value);
	}
}

export class CharacterFeats {
	featInfos: FeatInfo<string | void>[];

	constructor(coreFeats: FeatInfo<string | void>[], feats: FeatInfo<string | void>[]) {
		this.featInfos = [...coreFeats, ...feats];
	}

	getCoreFeats(): FeatInfo<string | void>[] {
		return this.featInfos.filter(info => info.feat.type === FeatType.Core);
	}

	getSlottedFeats(): FeatInfo<string | void>[] {
		return this.featInfos.filter(info => info.slot);
	}

	getFeatModifiers(): InherentModifier[] {
		const modifiers: InherentModifier[] = [];

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

	get hasSpecializedTraining(): boolean {
		return this.featInfos.some(info => info.feat.key === Feat.SpecializedTraining);
	}

	toProps(): Record<string, string> {
		return Object.fromEntries(
			this.getSlottedFeats()
				.map(info => info.toProp())
				.filter(e => e !== undefined),
		);
	}

	static from(props: Record<string, string>, race: RaceInfo, characterClass: ClassInfo): CharacterFeats {
		const coreFeats = [...race.getCoreFeats(), ...characterClass.getCoreFeats()];
		const feats = Object.entries(props)
			.filter(([key]) => key.startsWith('feat.'))
			.map(prop => FeatInfo.fromProp(prop));
		return new CharacterFeats(coreFeats, feats);
	}
}

export class CharacterSheet {
	name: string;
	race: RaceInfo;
	characterClass: ClassInfo;
	feats: CharacterFeats;
	attributeRoot: StatNode;
	derivedStats: DerivedStats;
	currentValues: CurrentValues;
	equipment: Equipment;

	constructor(
		name: string,
		race: RaceInfo,
		characterClass: ClassInfo,
		feats: CharacterFeats,
		attributeRoot: StatNode,
		equipment: Equipment,
		currentValues: CurrentValues,
	) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.feats = feats;
		this.attributeRoot = attributeRoot;
		this.equipment = equipment;

		this.derivedStats = new DerivedStats(this.race, this.getStatTree());
		this.currentValues = currentValues;
	}

	get level(): number {
		return this.getStatTree().root.points;
	}

	getStatTree(): StatTree {
		return new StatTree(this.attributeRoot, this.getAllModifiers());
	}

	getFeatSlots(): FeatSlot[] {
		return FeatSlot.generateSlots({
			maxLevel: this.level,
			hasSpecializedTraining: this.feats.hasSpecializedTraining,
		});
	}

	// Get all modifiers from all sources (feats, equipment, etc.)
	getAllModifiers(): InherentModifier[] {
		const modifiers: InherentModifier[] = [];

		// Add feat modifiers (includes race, class, and upbringing modifiers)
		modifiers.push(...this.feats.getFeatModifiers());

		// Add equipment modifiers (armor DEX penalties)
		this.equipment.items
			.filter(item => item instanceof Armor)
			.forEach(item => {
				const armor = item as Armor;
				if (armor.dexPenalty !== 0) {
					modifiers.push(
						new InherentModifier({
							source: ModifierSource.Equipment,
							name: `${armor.name} (${armor.type}) DEX Penalty`,
							statType: StatType.DEX,
							value: armor.dexPenalty, // dexPenalty is already stored as negative
						}),
					);
				}
			});

		return modifiers;
	}

	getBasicAttacks(): BasicAttack[] {
		const tree = this.getStatTree();
		const attacks: BasicAttack[] = [];

		// Add weapon attacks
		this.equipment.items
			.filter(item => item instanceof Weapon)
			.forEach(item => {
				const weapon = item as Weapon;
				const name = weapon.name;
				const weaponModifier = <CircumstanceModifier>{
					source: ModifierSource.Equipment,
					name: `${name} (${weapon.type})`,
					description: `Weapon bonus from ${name} (${weapon.type})`,
					value: weapon.bonus,
				};
				attacks.push({
					name: name,
					description: `${name} (+${weapon.bonus})`,
					check: new Check({
						mode: CheckMode.Static,
						nature: CheckNature.Active,
						statModifier: tree.getModifier(weapon.attribute, [weaponModifier]),
					}),
				});
			});

		// Add Shield Bash if a shield is equipped
		const shield = this.equipment.items.find(item => item instanceof Shield);
		if (shield) {
			const shieldModifier = <CircumstanceModifier>{
				source: ModifierSource.Equipment,
				name: 'Shield Bash',
				description: `Shield Bash bonus from ${shield.name}`,
				value: 1,
			};
			attacks.push({
				name: 'Shield Bash',
				description: 'Shield Bash',
				check: new Check({
					mode: CheckMode.Static,
					nature: CheckNature.Active,
					statModifier: tree.getModifier(StatType.STR, [shieldModifier]),
				}),
			});
		}

		// Add Unarmed attack (always available)
		attacks.push({
			name: 'Unarmed',
			description: 'Unarmed',
			check: new Check({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statModifier: tree.getModifier(StatType.STR),
			}),
		});

		return attacks;
	}

	getBasicDefense(type: DefenseType): StatModifier {
		const { stat, cm } = DEFENSE_TYPE_PROPERTIES[type];

		const cms: CircumstanceModifier[] = [];

		const armor = this.equipment.items.find(item => item instanceof Armor);
		if (armor) {
			const armorModifier = <CircumstanceModifier>{
				source: ModifierSource.Equipment,
				name: 'Armor',
				description: `Armor bonus from ${armor.name}`,
				value: armor.bonus,
			};
			cms.push(armorModifier);
		}

		if (type === DefenseType.ShieldBlock) {
			const shield = this.equipment.items.find(item => item instanceof Shield);
			if (shield) {
				const shieldModifier = <CircumstanceModifier>{
					source: ModifierSource.Equipment,
					name: 'Shield Block',
					description: `Shield Block bonus from ${shield.name}`,
					value: shield.bonus,
				};
				cms.push(shieldModifier);
			}
		}

		if (cm !== 0) {
			cms.push(
				new CircumstanceModifier({
					source: ModifierSource.Circumstance,
					name: type,
					value: cm,
				}),
			);
		}

		return this.getStatTree().getModifier(stat, cms);
	}

	static from(props: Record<string, string>): CharacterSheet {
		const race = RaceInfo.from(props);
		const characterClass = ClassInfo.from(props);
		const sheet = new CharacterSheet(
			props['name']!,
			race,
			characterClass,
			CharacterFeats.from(props, race, characterClass),
			StatTree.buildRootNode(props),
			Equipment.from(props['equipment']),
			CurrentValues.from(props),
		);
		// backfill maximal current values from attribute tree if needed
		sheet.currentValues.backfill(sheet);
		return sheet;
	}
}
