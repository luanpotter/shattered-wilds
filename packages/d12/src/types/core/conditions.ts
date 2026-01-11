export enum Condition {
	Blessed = 'Blessed',
	Blinded = 'Blinded',
	Distracted = 'Distracted',
	Distraught = 'Distraught',
	Frightened = 'Frightened',
	Immobilized = 'Immobilized',
	Incapacitated = 'Incapacitated',
	OffGuard = 'Off Guard',
	Prone = 'Prone',
	Silenced = 'Silenced',
	Unconscious = 'Unconscious',
}

export class ConditionDefinition {
	name: Condition;
	ranked: boolean;
	description: string;

	constructor({ name, ranked, description }: { name: Condition; ranked: boolean; description: string }) {
		this.name = name;
		this.ranked = ranked;
		this.description = description;
	}
}
