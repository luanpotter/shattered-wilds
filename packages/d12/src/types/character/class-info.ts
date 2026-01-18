import { CharacterClass, CLASS_DEFINITIONS, ClassDefinition } from '../core/classes.js';
import { FeatInfo, FEATS, FeatType } from '../core/feats.js';

export class ClassInfo {
	characterClass: CharacterClass;

	constructor({ characterClass }: { characterClass: CharacterClass }) {
		this.characterClass = characterClass;
	}

	static from(props: Record<string, string>): ClassInfo {
		const characterClass = (props['class'] as CharacterClass) ?? CharacterClass.Fighter;

		return new ClassInfo({ characterClass });
	}

	get definition(): ClassDefinition {
		return CLASS_DEFINITIONS[this.characterClass];
	}

	getCoreFeats(customCoreFeatParameters: Record<string, string>): FeatInfo<string | void>[] {
		const classFeats = Object.values(FEATS)
			.filter(feat => feat.fitsClass(this.definition))
			.filter(feat => feat.type === FeatType.Core);

		const classDefinition = CLASS_DEFINITIONS[this.characterClass];
		const parameters = {
			'class-role': classDefinition.role,
			stat: classDefinition.primaryAttribute.name,
			...customCoreFeatParameters,
		};
		return FeatInfo.hydrateFeatDefinitions(classFeats, parameters);
	}

	toString(): string {
		return this.characterClass;
	}

	toProps(): Record<string, string> {
		return {
			class: this.characterClass,
		};
	}
}
