import { Feat, FeatDefinition, FeatInfo, FeatSlot, FeatSource, FeatStatModifier, FeatType } from '../core/feats.js';
import { Size } from '../core/size.js';
import { Resource, RESOURCES, ResourceValue } from '../stats/resources.js';
import { InherentModifier, ModifierSource, StatNode, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { ClassInfo } from './class-info.js';
import { Armor, Equipment } from './equipment.js';
import { RaceInfo } from './race-info.js';

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

	fitsFeat(feat: FeatDefinition<string | void>): boolean {
		return feat.fitsCharacter(this.characterClass.definition, this.race.primaryRace, this.race.upbringing);
	}

	applicableSource(feat: FeatDefinition<string | void>): FeatSource | undefined {
		return feat.sources.find(source =>
			FeatDefinition.doesSourceFitCharacter(
				source,
				this.characterClass.definition,
				this.race.primaryRace,
				this.race.upbringing,
			),
		);
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

	static parsePropsFromShareString(shareString: string): Record<string, string> {
		const props: Record<string, string> = {};
		const lines = atob(shareString).split('\n');

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;

			const colonIndex = trimmedLine.indexOf(':');
			if (colonIndex === -1) continue;

			const key = trimmedLine.substring(0, colonIndex).trim();
			const value = trimmedLine.substring(colonIndex + 1).trim();

			props[key] = value;
		}

		return props;
	}

	static toShareString(props: Record<string, string>): string {
		const keyValuePairs = Object.entries(props)
			.filter(([key, value]) => !StatType.values.some(stat => stat.name === key) || value !== '0')
			.filter(([key, value]) => !Object.keys(RESOURCES).some(resource => resource === key) || value !== '-1')
			.filter(([, value]) => value !== '')
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
		return btoa(keyValuePairs);
	}
}

export const extractCustomCoreParameters = (props: Record<string, string>): Record<string, string> => {
	return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('core.')));
};
