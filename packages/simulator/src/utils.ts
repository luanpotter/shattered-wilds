import {
	Character,
	Point,
	Window,
	HexPosition,
	AttributeMap,
	AttributeType,
	RealmType,
	BasicAttributeType,
	SkillType,
	LevelAttribute,
	RealmAttribute,
	BasicAttribute,
	SkillAttribute,
	Modifier,
	DerivedStats,
} from './types';

// Constants for window positioning
const INITIAL_POSITION: Point = { x: 20, y: 20 };
const WINDOW_SIZE = { width: 300, height: 300 };
const OVERLAP_MARGIN = 8; // Additional buffer when checking for overlaps

/**
 * Find the next available position for a new window
 */
export function findNextWindowPosition(windows: Window[]): Point {
	// If no windows, return default position
	if (windows.length === 0) {
		return INITIAL_POSITION;
	}

	// Get viewport dimensions
	const viewportWidth = window.innerWidth - WINDOW_SIZE.width;
	const viewportHeight = window.innerHeight - WINDOW_SIZE.height;

	// Define step size for grid positions
	const stepSize = 50; // Pixels between positions

	// Compute grid size based on viewport dimensions and step size
	const gridCols = Math.ceil(viewportWidth / stepSize);
	const gridRows = Math.ceil(viewportHeight / stepSize);
	const gridSize = Math.max(gridCols, gridRows);

	// Create a grid to represent potential window positions
	const grid: boolean[][] = [];

	// Initialize the grid (all positions free)
	for (let i = 0; i < gridSize; i++) {
		grid[i] = [];
		for (let j = 0; j < gridSize; j++) {
			grid[i][j] = false;
		}
	}

	// Mark occupied positions based on existing windows
	for (const window of windows) {
		// Get the window's bounds
		const winLeft = window.position.x;
		const winRight = window.position.x + WINDOW_SIZE.width;
		const winTop = window.position.y;
		const winBottom = window.position.y + WINDOW_SIZE.height;

		// Check each grid cell to see if it overlaps with this window
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				// Calculate the grid cell's bounds
				const cellLeft = col * stepSize + INITIAL_POSITION.x;
				const cellRight = cellLeft + WINDOW_SIZE.width;
				const cellTop = row * stepSize + INITIAL_POSITION.y;
				const cellBottom = cellTop + WINDOW_SIZE.height;

				// Check for overlap (with margin)
				if (
					cellRight + OVERLAP_MARGIN > winLeft &&
					cellLeft - OVERLAP_MARGIN < winRight &&
					cellBottom + OVERLAP_MARGIN > winTop &&
					cellTop - OVERLAP_MARGIN < winBottom
				) {
					grid[row][col] = true; // Mark as occupied
				}
			}
		}
	}

	// Find the first free position
	for (let row = 0; row < gridSize; row++) {
		for (let col = 0; col < gridSize; col++) {
			if (!grid[row][col]) {
				const x = col * stepSize + INITIAL_POSITION.x;
				const y = row * stepSize + INITIAL_POSITION.y;

				// Ensure the position is within viewport bounds
				if (x < viewportWidth && y < viewportHeight) {
					return { x, y };
				}
			}
		}
	}

	// If no free position found, cascade from the last window
	const lastWindow = windows[windows.length - 1];
	const x = Math.min(lastWindow.position.x + 20, viewportWidth - 20);
	const y = Math.min(lastWindow.position.y + 20, viewportHeight - 20);

	return { x, y };
}

/**
 * Find the next available character number
 * Skips numbers that are already used in existing character names
 */
export function findNextCharacterNumber(characters: Character[]): number {
	// Extract numbers from existing character names
	const usedNumbers = characters
		.map(c => {
			// Try to extract number from "Character X" format
			const match = c.sheet.name.match(/^Character (\d+)$/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter((num): num is number => num !== null) // Filter out non-matches
		.sort((a, b) => a - b); // Sort numerically

	// Find the first gap in the sequence starting from 1
	let nextNumber = 1;
	for (const num of usedNumbers) {
		if (num > nextNumber) {
			// Found a gap
			break;
		}
		if (num === nextNumber) {
			// This number is used, try next one
			nextNumber++;
		}
	}

	return nextNumber;
}

/**
 * Find the next available hex position for a character
 * Searches in a spiral pattern outward from the center
 * @param characters Array of existing characters to check positions against
 * @returns The next available hex coordinates {q, r}
 */
export function findNextEmptyHexPosition(
	characters: Character[],
	startQ: number = 0,
	startR: number = 0
): HexPosition {
	// Check if the starting position is empty
	if (!findCharacterAtPosition(characters, startQ, startR)) {
		return { q: startQ, r: startR };
	}

	// Spiral outward from the starting position
	const directions = [
		{ q: 1, r: 0 }, // east
		{ q: 0, r: 1 }, // southeast
		{ q: -1, r: 1 }, // southwest
		{ q: -1, r: 0 }, // west
		{ q: 0, r: -1 }, // northwest
		{ q: 1, r: -1 }, // northeast
	];

	let q = startQ;
	let r = startR;
	let radius = 1;

	while (radius < 20) {
		// Prevent infinite loop with a reasonable limit
		for (let side = 0; side < 6; side++) {
			for (let step = 0; step < radius; step++) {
				q += directions[side].q;
				r += directions[side].r;

				if (!findCharacterAtPosition(characters, q, r)) {
					return { q, r };
				}
			}
		}
		radius++;
	}

	// Fallback if no position found
	return { q: 0, r: 0 };
}

/**
 * Finds a character at the given hex position
 */
export function findCharacterAtPosition(
	characters: Character[],
	q: number,
	r: number
): Character | undefined {
	return characters.find(c => c.position?.q === q && c.position?.r === r);
}

/**
 * Convert axial hex coordinates to pixel coordinates
 */
export function axialToPixel(q: number, r: number): Point {
	const x = q * 10 + r * 5;
	const y = r * 8.66; // sqrt(3) * 5
	return { x, y };
}

/**
 * Maps each basic attribute to its parent realm
 */
export const BASIC_ATTRIBUTE_TO_REALM: Record<BasicAttributeType, RealmType> = {
	// Body Realm
	STR: RealmType.Body,
	DEX: RealmType.Body,
	CON: RealmType.Body,
	// Mind Realm
	INT: RealmType.Mind,
	WIS: RealmType.Mind,
	CHA: RealmType.Mind,
	// Soul Realm
	DIV: RealmType.Soul,
	FOW: RealmType.Soul,
	LCK: RealmType.Soul,
};

/**
 * Maps each skill to its parent basic attribute
 */
export const SKILL_TO_BASIC_ATTRIBUTE: Record<SkillType, BasicAttributeType> = {
	// STR Skills
	Muscles: BasicAttributeType.STR,
	Stance: BasicAttributeType.STR,
	Lift: BasicAttributeType.STR,
	// DEX Skills
	Finesse: BasicAttributeType.DEX,
	Evasiveness: BasicAttributeType.DEX,
	Agility: BasicAttributeType.DEX,
	// CON Skills
	Toughness: BasicAttributeType.CON,
	Stamina: BasicAttributeType.CON,
	Resilience: BasicAttributeType.CON,
	// INT Skills
	IQ: BasicAttributeType.INT,
	Knowledge: BasicAttributeType.INT,
	Memory: BasicAttributeType.INT,
	// WIS Skills
	Perception: BasicAttributeType.WIS,
	Awareness: BasicAttributeType.WIS,
	Intuition: BasicAttributeType.WIS,
	// CHA Skills
	Speechcraft: BasicAttributeType.CHA,
	Charm: BasicAttributeType.CHA,
	Appearance: BasicAttributeType.CHA,
	// DIV Skills
	Faith: BasicAttributeType.DIV,
	Attunement: BasicAttributeType.DIV,
	Devotion: BasicAttributeType.DIV,
	// FOW Skills
	Discipline: BasicAttributeType.FOW,
	Tenacity: BasicAttributeType.FOW,
	Resolve: BasicAttributeType.FOW,
	// LCK Skills
	Gambling: BasicAttributeType.LCK,
	Fortune: BasicAttributeType.LCK,
	Serendipity: BasicAttributeType.LCK,
};

/**
 * Maps each realm to its basic attributes
 */
export const REALM_TO_BASIC_ATTRIBUTES: Record<RealmType, BasicAttributeType[]> = {
	[RealmType.Body]: [BasicAttributeType.STR, BasicAttributeType.DEX, BasicAttributeType.CON],
	[RealmType.Mind]: [BasicAttributeType.INT, BasicAttributeType.WIS, BasicAttributeType.CHA],
	[RealmType.Soul]: [BasicAttributeType.DIV, BasicAttributeType.FOW, BasicAttributeType.LCK],
};

/**
 * Maps each basic attribute to its skills
 */
export const BASIC_ATTRIBUTE_TO_SKILLS: Record<BasicAttributeType, SkillType[]> = {
	[BasicAttributeType.STR]: [SkillType.Muscles, SkillType.Stance, SkillType.Lift],
	[BasicAttributeType.DEX]: [SkillType.Finesse, SkillType.Evasiveness, SkillType.Agility],
	[BasicAttributeType.CON]: [SkillType.Toughness, SkillType.Stamina, SkillType.Resilience],
	[BasicAttributeType.INT]: [SkillType.IQ, SkillType.Knowledge, SkillType.Memory],
	[BasicAttributeType.WIS]: [SkillType.Perception, SkillType.Awareness, SkillType.Intuition],
	[BasicAttributeType.CHA]: [SkillType.Speechcraft, SkillType.Charm, SkillType.Appearance],
	[BasicAttributeType.DIV]: [SkillType.Faith, SkillType.Attunement, SkillType.Devotion],
	[BasicAttributeType.FOW]: [SkillType.Discipline, SkillType.Tenacity, SkillType.Resolve],
	[BasicAttributeType.LCK]: [SkillType.Gambling, SkillType.Fortune, SkillType.Serendipity],
};

/**
 * Descriptions for basic attributes
 */
export const BASIC_ATTRIBUTE_DESCRIPTIONS: Record<BasicAttributeType, string> = {
	[BasicAttributeType.STR]: 'Physical power and force',
	[BasicAttributeType.DEX]: 'Agility, reflexes, and coordination',
	[BasicAttributeType.CON]: 'Endurance, stamina, and health',
	[BasicAttributeType.INT]: 'Reasoning, memory, and knowledge',
	[BasicAttributeType.WIS]: 'Perception, intuition, and insight',
	[BasicAttributeType.CHA]: 'Force of personality and social influence',
	[BasicAttributeType.DIV]: 'Connection to divine forces and the Aether',
	[BasicAttributeType.FOW]: 'Mental fortitude and willpower',
	[BasicAttributeType.LCK]: 'Fortune and chance',
};

/**
 * Descriptions for realms
 */
export const REALM_DESCRIPTIONS: Record<RealmType, string> = {
	[RealmType.Body]: 'Physical capacity and vitality',
	[RealmType.Mind]: 'Mental acuity and focus',
	[RealmType.Soul]: 'Spiritual connection and force of will',
};

/**
 * Descriptions for skills
 */
export const SKILL_DESCRIPTIONS: Record<SkillType, string> = {
	[SkillType.Muscles]: 'Raw power for short bursts of strength',
	[SkillType.Stance]: 'Ability to maintain position against force',
	[SkillType.Lift]: 'Capacity to lift and carry weight',
	[SkillType.Finesse]: 'Precision in fine movements',
	[SkillType.Evasiveness]: 'Ability to dodge and perform acrobatics',
	[SkillType.Agility]: 'Speed and quickness of movement',
	[SkillType.Toughness]: 'Physical resilience to damage',
	[SkillType.Stamina]: 'Endurance for physical exertion',
	[SkillType.Resilience]: 'Resistance to illness and toxins',
	[SkillType.IQ]: 'Raw intelligence and logical reasoning',
	[SkillType.Knowledge]: 'Accumulated facts and information',
	[SkillType.Memory]: 'Ability to recall details',
	[SkillType.Perception]: 'Active awareness of surroundings',
	[SkillType.Awareness]: 'Passive alertness to environment',
	[SkillType.Intuition]: 'Common sense and practical thinking',
	[SkillType.Speechcraft]: 'Verbal communication and persuasion',
	[SkillType.Charm]: 'Natural charisma and likability',
	[SkillType.Appearance]: 'Physical attractiveness and presentation',
	[SkillType.Faith]: 'Strength of religious belief',
	[SkillType.Attunement]: 'Connection to the Aether',
	[SkillType.Devotion]: 'Personal connection to deities',
	[SkillType.Discipline]: 'Self-control and restraint',
	[SkillType.Tenacity]: 'Focus despite distractions',
	[SkillType.Resolve]: 'Mental resistance to influence',
	[SkillType.Gambling]: 'Skill in games of chance',
	[SkillType.Fortune]: 'Personal luck for actions',
	[SkillType.Serendipity]: 'Likelihood of fortunate occurrences',
};

/**
 * Initializes a new attribute map with default values
 */
export function initializeAttributeMap(level = 0): AttributeMap {
	// Create Level attribute
	const levelAttr: LevelAttribute = {
		id: 'level',
		type: AttributeType.Level,
		name: 'Level',
		baseValue: level,
		modifiers: [],
		finalModifier: level,
	};

	// Create Realm attributes
	const bodyAttr: RealmAttribute = {
		id: 'body',
		type: AttributeType.Realm,
		realmType: RealmType.Body,
		name: 'Body',
		abbreviation: 'Body',
		description: REALM_DESCRIPTIONS[RealmType.Body],
		baseValue: 0,
		modifiers: [],
		finalModifier: 0,
		parentId: levelAttr.id,
	};

	const mindAttr: RealmAttribute = {
		id: 'mind',
		type: AttributeType.Realm,
		realmType: RealmType.Mind,
		name: 'Mind',
		abbreviation: 'Mind',
		description: REALM_DESCRIPTIONS[RealmType.Mind],
		baseValue: 0,
		modifiers: [],
		finalModifier: 0,
		parentId: levelAttr.id,
	};

	const soulAttr: RealmAttribute = {
		id: 'soul',
		type: AttributeType.Realm,
		realmType: RealmType.Soul,
		name: 'Soul',
		abbreviation: 'Soul',
		description: REALM_DESCRIPTIONS[RealmType.Soul],
		baseValue: 0,
		modifiers: [],
		finalModifier: 0,
		parentId: levelAttr.id,
	};

	// Create Basic Attributes
	const basicAttributes: Record<BasicAttributeType, BasicAttribute> = {} as Record<
		BasicAttributeType,
		BasicAttribute
	>;

	Object.values(BasicAttributeType).forEach(attrType => {
		const realmType = BASIC_ATTRIBUTE_TO_REALM[attrType];
		const parentId =
			realmType === RealmType.Body
				? bodyAttr.id
				: realmType === RealmType.Mind
					? mindAttr.id
					: soulAttr.id;

		basicAttributes[attrType] = {
			id: attrType.toLowerCase(),
			type: AttributeType.BasicAttribute,
			basicAttributeType: attrType,
			name: attrType,
			abbreviation: attrType,
			description: BASIC_ATTRIBUTE_DESCRIPTIONS[attrType],
			baseValue: 0,
			modifiers: [],
			finalModifier: 0,
			parentId,
			realmType,
		};
	});

	// Create Skills
	const skills: Record<SkillType, SkillAttribute> = {} as Record<SkillType, SkillAttribute>;

	Object.values(SkillType).forEach(skillType => {
		const basicAttrType = SKILL_TO_BASIC_ATTRIBUTE[skillType];
		const basicAttr = basicAttributes[basicAttrType];

		skills[skillType] = {
			id: skillType.toLowerCase(),
			type: AttributeType.Skill,
			skillType,
			name: skillType,
			description: SKILL_DESCRIPTIONS[skillType],
			baseValue: 0,
			modifiers: [],
			finalModifier: 0,
			parentId: basicAttr.id,
			basicAttributeType: basicAttrType,
		};
	});

	// Create and return the full attribute map
	const attributeMap: AttributeMap = {
		level: levelAttr,
		body: bodyAttr,
		mind: mindAttr,
		soul: soulAttr,
		basicAttributes,
		skills,
	};

	// Calculate initial modifiers
	calculateModifiers(attributeMap);

	return attributeMap;
}

/**
 * Calculates modifiers for all attributes based on the trickle-down system
 */
export function calculateModifiers(attributes: AttributeMap): void {
	const { level, body, mind, soul, basicAttributes, skills } = attributes;

	// Calculate level modifier
	level.finalModifier = level.baseValue + sumModifiers(level.modifiers);

	// Calculate realm modifiers
	const levelModRoundUp = Math.ceil(level.finalModifier / 4);

	body.finalModifier = body.baseValue + levelModRoundUp + sumModifiers(body.modifiers);
	mind.finalModifier = mind.baseValue + levelModRoundUp + sumModifiers(mind.modifiers);
	soul.finalModifier = soul.baseValue + levelModRoundUp + sumModifiers(soul.modifiers);

	// Calculate basic attribute modifiers
	Object.values(basicAttributes).forEach(attr => {
		const parentRealm =
			attr.realmType === RealmType.Body ? body : attr.realmType === RealmType.Mind ? mind : soul;

		const realmModRoundUp = Math.ceil(parentRealm.finalModifier / 2);

		attr.finalModifier =
			attr.baseValue + realmModRoundUp + levelModRoundUp + sumModifiers(attr.modifiers);
	});

	// Calculate skill modifiers
	Object.values(skills).forEach(skill => {
		const parentAttr = basicAttributes[skill.basicAttributeType];
		skill.finalModifier =
			2 * skill.baseValue + parentAttr.finalModifier + sumModifiers(skill.modifiers);
	});
}

/**
 * Sums up modifier values from an array of modifiers
 */
function sumModifiers(modifiers: Modifier[]): number {
	return modifiers.reduce((sum, mod) => sum + mod.value, 0);
}

/**
 * Calculates derived statistics based on attributes
 */
export function calculateDerivedStats(attributes: AttributeMap): DerivedStats {
	const { level, body, mind, soul } = attributes;

	// Get derived stats
	const maxHeroism = level.finalModifier;
	const maxVitality = 4 + body.finalModifier;
	const maxFocus = 4 + mind.finalModifier;
	const maxSpirit = 4 + soul.finalModifier;

	// Calculate derived combat stats
	const awarenessSkill = attributes.skills[SkillType.Awareness];
	const agilitySkill = attributes.skills[SkillType.Agility];
	const staminaSkill = attributes.skills[SkillType.Stamina];

	const initiative = awarenessSkill.finalModifier + agilitySkill.finalModifier;
	const speed = 30 + agilitySkill.finalModifier + staminaSkill.finalModifier; // Base speed of 30

	return {
		maxVitality,
		currentVitality: maxVitality,
		maxFocus,
		currentFocus: maxFocus,
		maxSpirit,
		currentSpirit: maxSpirit,
		maxHeroism,
		currentHeroism: maxHeroism,
		initiative,
		speed,
	};
}

/**
 * Gets unallocated attribute points that can be distributed
 * based on the trickle-down system
 */
export function getUnallocatedPoints(attributes: AttributeMap): number {
	const { level, body, mind, soul, basicAttributes, skills } = attributes;

	// Total points that should be allocated based on level
	const totalPointsAvailable = level.baseValue;

	// Points allocated to realms
	const realmPointsAllocated = body.baseValue + mind.baseValue + soul.baseValue;

	// Points allocated to basic attributes
	const basicAttrPointsAllocated = Object.values(basicAttributes).reduce(
		(sum, attr) => sum + attr.baseValue,
		0
	);

	// Points allocated to skills
	const skillPointsAllocated = Object.values(skills).reduce(
		(sum, skill) => sum + skill.baseValue,
		0
	);

	// Total allocated points
	const totalAllocated = realmPointsAllocated + basicAttrPointsAllocated + skillPointsAllocated;

	return totalPointsAvailable - totalAllocated;
}

/**
 * Validates if a point can be allocated to a specific attribute
 * based on the trickle-down system rules
 */
export function canAllocatePoint(
	attributes: AttributeMap,
	targetType: AttributeType,
	targetId: string
): boolean {
	// Check if we have points to allocate
	if (getUnallocatedPoints(attributes) <= 0) {
		return false;
	}

	// For the first tier (Realms), only check level
	if (targetType === AttributeType.Realm) {
		return true;
	}

	// For basic attributes, check if parent realm has points
	if (targetType === AttributeType.BasicAttribute) {
		const basicAttr = Object.values(attributes.basicAttributes).find(attr => attr.id === targetId);

		if (!basicAttr) return false;

		const parentRealm =
			basicAttr.realmType === RealmType.Body
				? attributes.body
				: basicAttr.realmType === RealmType.Mind
					? attributes.mind
					: attributes.soul;

		// Parent realm must have at least 1 point
		return parentRealm.baseValue >= 1;
	}

	// For skills, check if parent basic attribute has points
	if (targetType === AttributeType.Skill) {
		const skill = Object.values(attributes.skills).find(s => s.id === targetId);

		if (!skill) return false;

		const parentAttr = attributes.basicAttributes[skill.basicAttributeType];

		// Parent basic attribute must have at least 1 point
		return parentAttr.baseValue >= 1;
	}

	return false;
}

/**
 * Allocates a point to a specific attribute and updates modifiers
 */
export function allocatePoint(
	attributes: AttributeMap,
	targetType: AttributeType,
	targetId: string
): AttributeMap {
	if (!canAllocatePoint(attributes, targetType, targetId)) {
		return attributes;
	}

	const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
	let basicAttr;
	let skill;

	switch (targetType) {
		case AttributeType.Realm:
			if (targetId === 'body') {
				newAttributes.body.baseValue += 1;
			} else if (targetId === 'mind') {
				newAttributes.mind.baseValue += 1;
			} else if (targetId === 'soul') {
				newAttributes.soul.baseValue += 1;
			}
			break;

		case AttributeType.BasicAttribute:
			basicAttr = Object.values(newAttributes.basicAttributes).find(attr => attr.id === targetId);

			if (basicAttr) {
				basicAttr.baseValue += 1;
			}
			break;

		case AttributeType.Skill:
			skill = Object.values(newAttributes.skills).find(s => s.id === targetId);

			if (skill) {
				skill.baseValue += 1;
			}
			break;
	}

	// Recalculate modifiers
	calculateModifiers(newAttributes);

	return newAttributes;
}

/**
 * Checks if a point can be deallocated from an attribute
 */
export function canDeallocatePoint(
	attributes: AttributeMap,
	targetType: AttributeType,
	targetId: string
): boolean {
	// Can't deallocate if value is already 0
	if (targetType === AttributeType.Realm) {
		const realm =
			targetId === 'body'
				? attributes.body
				: targetId === 'mind'
					? attributes.mind
					: attributes.soul;

		if (realm.baseValue <= 0) {
			return false;
		}

		// Check if any children have points
		if (targetId === 'body') {
			// Check if any body-related basic attributes have points
			for (const attrType of REALM_TO_BASIC_ATTRIBUTES[RealmType.Body]) {
				if (attributes.basicAttributes[attrType].baseValue > 0) {
					return false;
				}
			}
		} else if (targetId === 'mind') {
			for (const attrType of REALM_TO_BASIC_ATTRIBUTES[RealmType.Mind]) {
				if (attributes.basicAttributes[attrType].baseValue > 0) {
					return false;
				}
			}
		} else if (targetId === 'soul') {
			for (const attrType of REALM_TO_BASIC_ATTRIBUTES[RealmType.Soul]) {
				if (attributes.basicAttributes[attrType].baseValue > 0) {
					return false;
				}
			}
		}

		return true;
	}

	if (targetType === AttributeType.BasicAttribute) {
		const basicAttr = Object.values(attributes.basicAttributes).find(attr => attr.id === targetId);
		if (!basicAttr || basicAttr.baseValue <= 0) {
			return false;
		}

		// Check if any children skills have points
		for (const skill of BASIC_ATTRIBUTE_TO_SKILLS[basicAttr.basicAttributeType]) {
			if (attributes.skills[skill].baseValue > 0) {
				return false;
			}
		}

		return true;
	}

	if (targetType === AttributeType.Skill) {
		const skill = Object.values(attributes.skills).find(s => s.id === targetId);
		return skill !== undefined && skill.baseValue > 0;
	}

	return false;
}

/**
 * Deallocates a point from a specific attribute and updates modifiers
 */
export function deallocatePoint(
	attributes: AttributeMap,
	targetType: AttributeType,
	targetId: string
): AttributeMap {
	if (!canDeallocatePoint(attributes, targetType, targetId)) {
		return attributes;
	}

	const newAttributes = JSON.parse(JSON.stringify(attributes)) as AttributeMap;
	let basicAttr;
	let skill;

	switch (targetType) {
		case AttributeType.Realm:
			if (targetId === 'body') {
				newAttributes.body.baseValue -= 1;
			} else if (targetId === 'mind') {
				newAttributes.mind.baseValue -= 1;
			} else if (targetId === 'soul') {
				newAttributes.soul.baseValue -= 1;
			}
			break;

		case AttributeType.BasicAttribute:
			basicAttr = Object.values(newAttributes.basicAttributes).find(attr => attr.id === targetId);

			if (basicAttr) {
				basicAttr.baseValue -= 1;
			}
			break;

		case AttributeType.Skill:
			skill = Object.values(newAttributes.skills).find(s => s.id === targetId);

			if (skill) {
				skill.baseValue -= 1;
			}
			break;
	}

	// Recalculate modifiers
	calculateModifiers(newAttributes);

	return newAttributes;
}
