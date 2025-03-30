export interface Point {
	x: number;
	y: number;
}

export interface HexPosition {
	q: number;
	r: number;
}

export type DragType = 'none' | 'window' | 'grid' | 'character';

export interface DragState {
	type: DragType;
	objectId?: string;
	startPosition?: Point;
	offset?: Point;
}

export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Tellur = 'Tellur',
}

export enum CharacterClass {
	Fighter = 'Fighter',
	Berserker = 'Berserker',
	Swashbuckler = 'Swashbuckler',
	Marksman = 'Marksman',
	Hunter = 'Hunter',
	Rogue = 'Rogue',
	Guardian = 'Guardian',
	Barbarian = 'Barbarian',
	Scout = 'Scout',
}

// Attribute system enums and types
export enum AttributeType {
	Level = 'Level',
	Realm = 'Realm',
	BasicAttribute = 'BasicAttribute',
	Skill = 'Skill',
}

export enum RealmType {
	Body = 'Body',
	Mind = 'Mind',
	Soul = 'Soul',
}

export enum BasicAttributeType {
	// Body Realm
	STR = 'STR',
	DEX = 'DEX',
	CON = 'CON',
	// Mind Realm
	INT = 'INT',
	WIS = 'WIS',
	CHA = 'CHA',
	// Soul Realm
	DIV = 'DIV',
	FOW = 'FOW',
	LCK = 'LCK',
}

export enum SkillType {
	// STR Skills
	Muscles = 'Muscles',
	Stance = 'Stance',
	Lift = 'Lift',
	// DEX Skills
	Finesse = 'Finesse',
	Evasiveness = 'Evasiveness',
	Agility = 'Agility',
	// CON Skills
	Toughness = 'Toughness',
	Stamina = 'Stamina',
	Resilience = 'Resilience',
	// INT Skills
	IQ = 'IQ',
	Knowledge = 'Knowledge',
	Memory = 'Memory',
	// WIS Skills
	Perception = 'Perception',
	Awareness = 'Awareness',
	Intuition = 'Intuition',
	// CHA Skills
	Speechcraft = 'Speechcraft',
	Charm = 'Charm',
	Appearance = 'Appearance',
	// DIV Skills
	Faith = 'Faith',
	Attunement = 'Attunement',
	Devotion = 'Devotion',
	// FOW Skills
	Discipline = 'Discipline',
	Tenacity = 'Tenacity',
	Resolve = 'Resolve',
	// LCK Skills
	Gambling = 'Gambling',
	Fortune = 'Fortune',
	Serendipity = 'Serendipity',
}

// Modifier represents bonuses/penalties from different sources
export interface Modifier {
	source: string;
	value: number;
	description?: string;
}

// The base AttributeNode interface that all attribute types extend
export interface AttributeNode {
	id: string;
	type: AttributeType;
	name: string;
	abbreviation?: string;
	description?: string;
	baseValue: number;
	modifiers: Modifier[];
	finalModifier: number;
}

// Map of attributes to organize and access the attribute tree
export interface AttributeMap {
	// Root attribute
	level: LevelAttribute;

	// Realm attributes
	body: RealmAttribute;
	mind: RealmAttribute;
	soul: RealmAttribute;

	// Basic attributes
	basicAttributes: Record<BasicAttributeType, BasicAttribute>;

	// Skills
	skills: Record<SkillType, SkillAttribute>;
}

// Level is the root attribute
export interface LevelAttribute extends AttributeNode {
	type: AttributeType.Level;
}

// Realms are the second tier
export interface RealmAttribute extends AttributeNode {
	type: AttributeType.Realm;
	realmType: RealmType;
	parentId: string;
}

// Basic attributes are the third tier
export interface BasicAttribute extends AttributeNode {
	type: AttributeType.BasicAttribute;
	basicAttributeType: BasicAttributeType;
	parentId: string;
	realmType: RealmType;
}

// Skills are the fourth tier
export interface SkillAttribute extends AttributeNode {
	type: AttributeType.Skill;
	skillType: SkillType;
	parentId: string;
	basicAttributeType: BasicAttributeType;
}

// Derived statistics interfaces
export interface DerivedStats {
	maxVitality: number;
	currentVitality: number;
	maxFocus: number;
	currentFocus: number;
	maxSpirit: number;
	currentSpirit: number;
	maxHeroism: number;
	currentHeroism: number;
	initiative: number;
	speed: number;
}

export interface CharacterSheet {
	name: string;
	race: Race;
	class: CharacterClass;
	level: number;
	attributes?: AttributeMap;
	derivedStats?: DerivedStats;
}

export interface Character {
	id: string;
	position?: HexPosition;
	sheet: CharacterSheet;
}

/**
 * Get character initials for display
 * - For multi-word names (e.g., "Foo Bar"), returns initials ("FB")
 * - For single-word names (e.g., "Warrior"), returns first two letters ("WA")
 */
export function getCharacterInitials(character: Character): string {
	const name = character.sheet.name.trim();

	// Check if name has multiple words
	if (name.includes(' ')) {
		// Split by spaces and get first letter of each word
		return name
			.split(' ')
			.map((word: string) => word.charAt(0).toUpperCase())
			.join('');
	}

	// If single word, return first two letters
	return name.slice(0, 2).toUpperCase();
}

export interface Window {
	id: string;
	title: string;
	type: 'character-sheet' | 'character-list' | 'character-creation';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
}

export interface GridState {
	scale: number;
	offset: Point;
}
