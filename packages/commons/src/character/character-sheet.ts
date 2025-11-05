import { Feat, FeatDefinition, FeatInfo, FeatSlot, FeatSource, FeatStatModifier, FeatType } from '../core/feats.js';
import { Size } from '../core/size.js';
import { Resource, RESOURCES, ResourceValue } from '../stats/resources.js';
import { InherentModifier, ModifierSource, StatNode, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Circumstances } from './circumstances.js';
import { ClassInfo } from './class-info.js';
import { Armor, Equipment } from './equipment.js';
import { Personality } from './personality.js';
import { RaceInfo } from './race-info.js';

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
	circumstances: Circumstances;
	equipment: Equipment;
	personality: Personality;

	constructor({
		name,
		race,
		characterClass,
		feats,
		attributeRoot,
		equipment,
		circumstances,
		personality,
	}: {
		name: string;
		race: RaceInfo;
		characterClass: ClassInfo;
		feats: CharacterFeats;
		attributeRoot: StatNode;
		equipment: Equipment;
		circumstances: Circumstances;
		personality: Personality;
	}) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.feats = feats;
		this.attributeRoot = attributeRoot;
		this.equipment = equipment;
		this.circumstances = circumstances;
		this.personality = personality;
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
		return this.circumstances.currentResources.get(this.getStatTree(), resource);
	}

	updateResourceToValue(resource: Resource, value: number): number {
		const { max } = this.getResource(resource);
		return Math.max(0, Math.min(max, value));
	}

	updateResourceToMax(resource: Resource): number {
		const { max } = this.getResource(resource);
		return this.updateResourceToValue(resource, max);
	}

	updateResourceByDelta(resource: Resource, delta: number): number {
		const { current } = this.getResource(resource);
		return this.updateResourceToValue(resource, current + delta);
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
			circumstances: Circumstances.from(props),
			personality: Personality.from(props),
		});
	}

	private static encode(value: string): string {
		const bytes = new TextEncoder().encode(value);
		const bin = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
		return btoa(bin);
	}

	private static decode(value: string): string {
		const bin = atob(value);
		const bytes = Uint8Array.from(bin, char => char.codePointAt(0)!);
		return new TextDecoder().decode(bytes);
	}

	static parsePropsFromShareString(shareString: string): Record<string, string> & { name: string } {
		const props: Record<string, string> = {};
		const lines = this.decode(shareString).split('\n');

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;

			const colonIndex = trimmedLine.indexOf(':');
			if (colonIndex === -1) continue;

			const key = trimmedLine.substring(0, colonIndex).trim();
			const value = trimmedLine.substring(colonIndex + 1).trim();

			// Skip empty values to avoid parsing issues
			if (value === '') continue;

			props[key] = value;
		}

		const fallbackName = 'Imported Character';
		return { name: fallbackName, ...props };
	}

	static toShareString(props: Record<string, string>): string {
		const keyValuePairs = Object.entries(props)
			.filter(([key, value]) => !StatType.values.some(stat => stat.name === key) || value !== '0')
			.filter(([key, value]) => !Object.keys(RESOURCES).some(resource => resource === key) || value !== '-1')
			.filter(([, value]) => value !== '')
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
		return this.encode(keyValuePairs);
	}
}

export const extractCustomCoreParameters = (props: Record<string, string>): Record<string, string> => {
	return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('core.')));
};
