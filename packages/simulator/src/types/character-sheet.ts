import {
	StatTree,
	StatNode,
	Modifier,
	ModifierSource,
	StatType,
	Size,
	SizeModifiers,
	Race,
	Upbringing,
	RACE_DEFINITIONS,
	CharacterClass,
	CLASS_DEFINITIONS,
	FeatInfo,
	FEATS,
	FeatType,
	FeatCategory,
	FeatStatModifier,
	generateModifierBonusString,
	FeatSlot,
	Feat,
	FeatSource,
	StaticFeatSource,
} from '@shattered-wilds/commons';

import { DerivedStat, BasicAttack, DefenseType } from './core';
import { Equipment, Armor, Shield, Weapon } from './equipment';

export class RaceInfo {
	primaryRace: Race;
	halfRace: Race | null;
	combineHalfRaceStats: boolean;
	upbringing: Upbringing;
	upbringingPlusModifier: StatType;
	upbringingMinusModifier: StatType;

	constructor(
		primaryRace: Race,
		upbringing: Upbringing,
		halfRace: Race | null = null,
		combineHalfRaceStats: boolean = false,
		upbringingPlusModifier: StatType = StatType.INT,
		upbringingMinusModifier: StatType = StatType.WIS,
	) {
		this.primaryRace = primaryRace;
		this.halfRace = halfRace;
		this.combineHalfRaceStats = combineHalfRaceStats;
		this.upbringing = upbringing;
		this.upbringingPlusModifier = upbringingPlusModifier;
		this.upbringingMinusModifier = upbringingMinusModifier;
	}

	static from(props: Record<string, string>): RaceInfo {
		const primaryRace = (props['race'] as Race) ?? Race.Human;
		const halfRace = props['race.half'] ? (props['race.half'] as Race) : null;
		const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';
		const upbringing = (props['upbringing'] as Upbringing) ?? Upbringing.Urban;
		const upbringingPlusModifier = StatType.fromString(props['upbringing.plus'], StatType.INT);
		const upbringingMinusModifier = StatType.fromString(props['upbringing.minus'], StatType.WIS);

		return new RaceInfo(
			primaryRace,
			upbringing,
			halfRace,
			combineHalfRaceStats,
			upbringingPlusModifier,
			upbringingMinusModifier,
		);
	}

	private getRacialFeatSources(): FeatSource[] {
		return [StaticFeatSource.Race, StaticFeatSource.Upbringing, this.primaryRace, this.upbringing];
	}

	// Get the core feats that should be assigned to this race/upbringing combination
	getCoreFeats(): FeatInfo<string | void>[] {
		const racialFeatCategories = [FeatCategory.Racial, FeatCategory.Upbringing];
		const racialFeatSources = this.getRacialFeatSources();
		const racialFeats = Object.values(FEATS)
			.filter(feat => feat.type === FeatType.Core && racialFeatCategories.includes(feat.category))
			.filter(feat => racialFeatSources.includes(feat.source));

		const parameters = {
			race: this.primaryRace,
			upbringing: this.upbringing,
			'upbringing-favored-modifier': this.upbringingPlusModifier.name,
			'upbringing-disfavored-modifier': this.upbringingMinusModifier.name,
		};
		return FeatInfo.hydrateFeatDefinitions(racialFeats, parameters);
	}

	toString(): string {
		if (this.halfRace) {
			return `Half ${this.primaryRace} / Half ${this.halfRace}`;
		}
		return this.primaryRace;
	}
}

export class ClassInfo {
	characterClass: CharacterClass;

	constructor(characterClass: CharacterClass) {
		this.characterClass = characterClass;
	}

	static from(props: Record<string, string>): ClassInfo {
		const characterClass = (props['class'] as CharacterClass) ?? CharacterClass.Fighter;

		return new ClassInfo(characterClass);
	}

	private getClassFeatSources(): FeatSource[] {
		const classDefinition = CLASS_DEFINITIONS[this.characterClass];
		return [StaticFeatSource.Class, classDefinition.realm, classDefinition.role, classDefinition.flavor];
	}

	getCoreFeats(): FeatInfo<string | void>[] {
		const classFeatCategories = [FeatCategory.ClassFlavor, FeatCategory.ClassRole];
		const classFeatSources = this.getClassFeatSources();
		const classFeats = Object.values(FEATS)
			.filter(feat => feat.type === FeatType.Core && classFeatCategories.includes(feat.category))
			.filter(feat => classFeatSources.includes(feat.source));

		const classDefinition = CLASS_DEFINITIONS[this.characterClass];
		const parameters = {
			'class-role': classDefinition.role,
			stat: classDefinition.primaryAttribute.name,
		};
		return FeatInfo.hydrateFeatDefinitions(classFeats, parameters);
	}

	toString(): string {
		return this.characterClass;
	}
}

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
		const HUMANOID_BASE = 3;
		const sizeModifier = SizeModifiers[this.size.value];
		const agility = statTree.valueOf(StatType.Agility);
		const value = HUMANOID_BASE + sizeModifier + Math.floor(agility / 4);
		return new DerivedStat(
			Math.max(value, 1),
			`Movement = ${HUMANOID_BASE} (base) + ${sizeModifier} (size) + ${agility} (Agility) / 4`,
		);
	}

	private computeInitiative(statTree: StatTree): DerivedStat<number> {
		const agility = statTree.valueOf(StatType.Agility);
		const awareness = statTree.valueOf(StatType.Awareness);
		const value = agility + awareness;
		return new DerivedStat(value, `Initiative = ${agility} (Agility) + ${awareness} (Awareness)`);
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

	getFeatModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		for (const info of this.featInfos) {
			const feat = info.feat;
			const effects = feat.effects?.(info) || [];
			const featModifiers = effects
				.filter(e => e instanceof FeatStatModifier)
				.map(e => {
					const bonusString = generateModifierBonusString(e.statType, e.value);
					return {
						source: ModifierSource.Feat,
						name: feat.name,
						description: `${bonusString} from feat ${feat.name}`,
						statType: e.statType,
						value: e.value,
					};
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
	getAllModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		// Add feat modifiers (includes race, class, and upbringing modifiers)
		modifiers.push(...this.feats.getFeatModifiers());

		// Add equipment modifiers (armor DEX penalties)
		this.equipment.items
			.filter(item => item instanceof Armor)
			.forEach(item => {
				const armor = item as Armor;
				if (armor.dexPenalty !== 0) {
					modifiers.push({
						source: ModifierSource.Equipment,
						name: `${armor.name} (${armor.type})`,
						description: `Dexterity penalty from wearing ${armor.name}`,
						statType: StatType.DEX,
						value: armor.dexPenalty, // dexPenalty is already stored as negative
					});
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
				attacks.push({
					name: name,
					description: `${name} (+${weapon.bonus})`,
					check: {
						attribute: weapon.attribute,
						bonus: weapon.bonus,
						modifier: tree.valueOf(weapon.attribute) + weapon.bonus,
					},
				});
			});

		// Add Shield Bash if a shield is equipped
		const hasShield = this.equipment.items.some(item => item instanceof Shield);
		if (hasShield) {
			attacks.push({
				name: 'Shield Bash',
				description: 'Shield Bash',
				check: {
					attribute: StatType.STR,
					bonus: 1,
					modifier: tree.valueOf(StatType.STR) + 1,
				},
			});
		}

		// Add Unarmed attack (always available)
		attacks.push({
			name: 'Unarmed',
			description: 'Unarmed',
			check: {
				attribute: StatType.STR,
				bonus: 0,
				modifier: tree.valueOf(StatType.STR),
			},
		});

		return attacks;
	}

	getBasicDefense(type: DefenseType): DerivedStat<number> {
		const sizeModifier = SizeModifiers[this.derivedStats.size.value];
		const armorBonus = this.equipment.items
			.filter(item => item instanceof Armor)
			.reduce((acc, item) => acc + (item as Armor).bonus, 0);
		switch (type) {
			case DefenseType.Basic: {
				const body = this.getStatTree().valueOf(StatType.Body);
				const defense = body - sizeModifier + armorBonus;
				return {
					value: defense,
					description: `Basic Defense = ${body} (Body) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus)`,
				};
			}
			case DefenseType.Dodge: {
				const evasiveness = this.getStatTree().valueOf(StatType.Evasiveness);
				const defense = evasiveness - sizeModifier + armorBonus + 3;
				return {
					value: defense,
					description: `Dodge Defense = ${evasiveness} (Evasiveness) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus) + 3 (base)`,
				};
			}
			case DefenseType.Shield: {
				const body = this.getStatTree().valueOf(StatType.Body);
				const shieldBonus = this.equipment.items
					.filter(item => item instanceof Shield)
					.reduce((acc, item) => acc + (item as Shield).bonus, 0);
				const defense = body - sizeModifier + armorBonus + shieldBonus;
				return {
					value: defense,
					description: `Shield Defense = ${body} (Body) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus) + ${shieldBonus} (shield bonus)`,
				};
			}
		}
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
