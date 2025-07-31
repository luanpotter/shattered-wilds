import { CharacterClass, CLASS_DEFINITIONS, ClassDefinition } from '../core/classes.js';
import { FeatInfo, FeatSource, FeatType, StaticFeatSource, FEATS, FeatCategory } from '../core/feats.js';

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
		return [StaticFeatSource.ClassRole, classDefinition.realm, classDefinition.role, classDefinition.flavor];
	}

	get definition(): ClassDefinition {
		return CLASS_DEFINITIONS[this.characterClass];
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
