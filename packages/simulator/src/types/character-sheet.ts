import {
	StatTree,
	StatNode,
	InherentModifier,
	ModifierSource,
	StatType,
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
	Resource,
	Size,
	Bonus,
	Distance,
} from '@shattered-wilds/commons';

import { BasicAttack, DefenseType, DEFENSE_TYPE_PROPERTIES } from './core';
import { Equipment, Armor, Shield, Weapon } from './equipment';

export interface ResourceValue {
	resource: Resource;
	current: number;
	max: number;
}

export class CurrentResources {
	currentResources: Record<Resource, number>;

	constructor(currentResources: Record<Resource, number>) {
		this.currentResources = currentResources;
	}

	static MAX_VALUE = -1;

	static from(props: Record<string, string>): CurrentResources {
		const parse = (value?: string): number => {
			return value ? parseInt(value) : CurrentResources.MAX_VALUE;
		};
		const currentResources = Object.values(Resource).reduce(
			(acc, resource) => {
				acc[resource] = parse(props[resource]);
				return acc;
			},
			<Record<Resource, number>>{},
		);

		return new CurrentResources(currentResources);
	}

	private getCurrentValue(resource: Resource): number {
		return this.currentResources[resource];
	}

	get(statTree: StatTree, resource: Resource) {
		const max = statTree.computeResource(resource).value;
		const current = this.getCurrentValue(resource);
		return {
			resource,
			current: current === CurrentResources.MAX_VALUE ? max : current,
			max,
		};
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
	currentResources: CurrentResources;
	equipment: Equipment;

	constructor({
		name,
		race,
		characterClass,
		feats,
		attributeRoot,
		equipment,
		currentResources,
	}: {
		name: string;
		race: RaceInfo;
		characterClass: ClassInfo;
		feats: CharacterFeats;
		attributeRoot: StatNode;
		equipment: Equipment;
		currentResources: CurrentResources;
	}) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.feats = feats;
		this.attributeRoot = attributeRoot;
		this.equipment = equipment;
		this.currentResources = currentResources;
	}

	get size(): Size {
		return this.race.size;
	}

	get level(): number {
		return this.getStatTree().root.points;
	}

	getResource(resource: Resource): ResourceValue {
		return this.currentResources.get(this.getStatTree(), resource);
	}

	updateResource(resource: Resource, delta: number): number {
		const { current, max } = this.getResource(resource);
		return Math.max(0, Math.min(max, current + delta));
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
				if (armor.dexPenalty.isNotZero) {
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
				weapon.modes.forEach(mode => {
					const name = weapon.name;
					const weaponModifier = <CircumstanceModifier>{
						source: ModifierSource.Equipment,
						name: `${name} (${mode.type})`,
						description: `Weapon bonus from ${name} (${mode.type})`,
						value: mode.bonus,
					};
					attacks.push({
						name: name,
						description: `${name} (+${mode.bonus})`,
						check: new Check({
							mode: CheckMode.Static,
							nature: CheckNature.Active,
							statModifier: tree.getModifier(mode.statType, [weaponModifier]),
						}),
						range: mode.range,
					});
				});
			});

		// Add Shield Bash if a shield is equipped
		const shield = this.equipment.items.find(item => item instanceof Shield);
		if (shield) {
			const shieldModifier = <CircumstanceModifier>{
				source: ModifierSource.Equipment,
				name: 'Shield Bash',
				description: `Shield Bash bonus from ${shield.name}`,
				value: Bonus.of(1),
			};
			attacks.push({
				name: 'Shield Bash',
				description: 'Shield Bash',
				check: new Check({
					mode: CheckMode.Static,
					nature: CheckNature.Active,
					statModifier: tree.getModifier(StatType.STR, [shieldModifier]),
				}),
				range: Distance.melee(),
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
			range: Distance.melee(),
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

		if (cm.isNotZero) {
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
		return new CharacterSheet({
			name: props['name']!,
			race,
			characterClass,
			feats: CharacterFeats.from(props, race, characterClass),
			attributeRoot: StatTree.buildRootNode(props),
			equipment: Equipment.from(props['equipment']),
			currentResources: CurrentResources.from(props),
		});
	}
}
