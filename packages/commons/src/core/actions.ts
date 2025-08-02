import { CheckMode, CheckNature } from '../stats/check.js';
import { DerivedStatType } from '../stats/derived-stat.js';
import { F, Formula, FormulaResult, RoundMode } from '../stats/formula.js';
import { Resource } from '../stats/resources.js';
import { CircumstanceModifier, ModifierSource, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Trait } from './traits.js';

export enum ActionType {
	Movement = 'Movement',
	Attack = 'Attack',
	Defense = 'Defense',
	Support = 'Support',
	Heroic = 'Heroic',
	Meta = 'Meta',
}

export class ActionCost {
	resource: Resource;
	amount: number;
	variable: boolean;

	constructor({ resource, amount, variable = false }: { resource: Resource; amount: number; variable?: boolean }) {
		this.resource = resource;
		this.amount = amount;
		this.variable = variable;
	}
}

export enum ActionValueUnit {
	Hex = 'Hex',
	Modifier = 'Modifier',
}

export interface ActionParameter {}

export class ActionValueParameter implements ActionParameter {
	name: string;
	unit: ActionValueUnit;
	formula: Formula;

	constructor({ name, unit, formula }: { name: string; unit: ActionValueUnit; formula: Formula }) {
		this.name = name;
		this.unit = unit;
		this.formula = formula;
	}

	compute(statTree: StatTree): FormulaResult {
		return this.formula.compute(statTree);
	}
}

export enum StandardCheck {
	Attack = 'Attack',
	Defense = 'Defense',
}

export class ActionCheckParameter implements ActionParameter {
	mode: CheckMode;
	nature: CheckNature;
	statType: StatType | StandardCheck;
	circumstanceModifier: CircumstanceModifier | undefined;
	targetDc: number | undefined;

	constructor({
		mode,
		nature,
		statType,
		circumstanceModifier,
		targetDc,
	}: {
		mode: CheckMode;
		nature: CheckNature;
		statType: StatType | StandardCheck;
		circumstanceModifier?: CircumstanceModifier;
		targetDc?: number;
	}) {
		this.mode = mode;
		this.nature = nature;
		this.statType = statType;
		this.circumstanceModifier = circumstanceModifier ?? undefined;
		this.targetDc = targetDc ?? undefined;
	}
}

export class ActionDefinition {
	key: Action;
	type: ActionType;
	name: string;
	description: string;
	costs: ActionCost[];
	traits: Trait[];
	parameters: ActionParameter[];

	constructor({
		key,
		type,
		name,
		description,
		costs,
		traits = [],
		parameters = [],
	}: {
		key: Action;
		type: ActionType;
		name: string;
		description: string;
		costs: ActionCost[];
		traits?: Trait[];
		parameters?: ActionParameter[];
	}) {
		this.key = key;
		this.type = type;
		this.name = name;
		this.description = description;
		this.costs = costs;
		this.traits = traits;
		this.parameters = parameters;
	}
}

export enum Action {
	Aim = 'Aim',
	Stride = 'Stride',
	Stun = 'Stun',
	CatchBreath = 'CatchBreath',
	KarmicResistance = 'KarmicResistance',
	WriteHistory = 'WriteHistory',
	ExtraDie = 'ExtraDie',
	Feint = 'Feint',
	PrepareAction = 'PrepareAction',
	Strike = 'Strike',
	Taunt = 'Taunt',
	Calm = 'Calm',
	Focus = 'Focus',
	HeroicRelentlessness = 'HeroicRelentlessness',
	OpportunityAttack = 'OpportunityAttack',
	Run = 'Run',
	ShrugOff = 'ShrugOff',
	FocusedStrike = 'FocusedStrike',
	Demoralize = 'Demoralize',
	Trip = 'Trip',
	LuckDie = 'LuckDie',
	DragGrappler = 'DragGrappler',
	Escape = 'Escape',
	GetUp = 'GetUp',
	Grapple = 'Grapple',
	Charge = 'Charge',
	Climb = 'Climb',
	Hide = 'Hide',
	Inspire = 'Inspire',
	Shove = 'Shove',
	Sneak = 'Sneak',
	StumbleThrough = 'StumbleThrough',
	Swim = 'Swim',
	TakeCover = 'TakeCover',
	SideStep = 'SideStep',
	RideMount = 'RideMount',
	ShieldBlock = 'ShieldBlock',
	SheatheUnsheathe = 'SheatheUnsheathe',
	Reload = 'Reload',
	Flank = 'Flank',
	Dodge = 'Dodge',
	Disarm = 'Disarm',
	DecreaseInitiative = 'DecreaseInitiative',
	Distract = 'Distract',
	BasicDefense = 'BasicDefense',
}

export const ACTIONS = {
	// Movement
	[Action.Stride]: new ActionDefinition({
		key: Action.Stride,
		type: ActionType.Movement,
		name: 'Stride',
		description: 'Enables you to move up to [[Movement]] hexes. Movement can be saved for later.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.variable(1, DerivedStatType.Movement),
			}),
		],
	}),
	[Action.Run]: new ActionDefinition({
		key: Action.Run,
		type: ActionType.Movement,
		name: 'Run',
		description:
			'Move up to `4 * Movement` hexes. Make a [[Stamina]] Check DC `10 + hexes moved`, or pay 1 [[Vitality_Point | VP]].',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 3 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Static,
				nature: CheckNature.Active,
				statType: StatType.Stamina,
			}),
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.variable(4, DerivedStatType.Movement),
			}),
		],
	}),
	[Action.DragGrappler]: new ActionDefinition({
		key: Action.DragGrappler,
		type: ActionType.Movement,
		name: 'Drag Grappler',
		description:
			'Move 1 hex while [[Immobilized]], dragging your grappler with you. Requires a contested [[Muscles]] check against [[Stance]] with a `-3` [[Circumstance Modifier | CM]]. You can use more [[Action_Point | APs]] to move extra hexes.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1, variable: true })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Muscles,
				circumstanceModifier: new CircumstanceModifier({
					source: ModifierSource.Circumstance,
					name: 'Drag Grappler',
					value: -3,
				}),
			}),
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.constant(1),
			}),
		],
	}),
	[Action.Climb]: new ActionDefinition({
		key: Action.Climb,
		type: ActionType.Movement,
		name: 'Climb',
		description: 'Climb one reasonable ledge (moving one hex). Harder climbs might require a [[Lift]] Check.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Static,
				nature: CheckNature.Active,
				statType: StatType.Lift,
			}),
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.constant(1),
			}),
		],
	}),
	[Action.StumbleThrough]: new ActionDefinition({
		key: Action.StumbleThrough,
		type: ActionType.Movement,
		name: 'Stumble Through',
		description:
			"Contested [[Finesse]] check against opponent's [[Stance]]. Move past one enemy to an adjacent hex, as long as your [[Movement]] is 2 or more.",
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Finesse,
			}),
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.constant(2),
			}),
		],
	}),
	[Action.Swim]: new ActionDefinition({
		key: Action.Swim,
		type: ActionType.Movement,
		name: 'Swim',
		description: 'Swim up to `ceil(Movement / 2)` hexes. You might need a [[Stamina]] Check to sustain.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.variable(0.5, DerivedStatType.Movement, RoundMode.ceil),
			}),
		],
	}),
	[Action.SideStep]: new ActionDefinition({
		key: Action.SideStep,
		type: ActionType.Movement,
		name: 'Side Step',
		description:
			'Move 1 hex in any direction, ignoring **Difficult Terrain**. This does not trigger [[Opportunity_Attack | Opportunity Attacks]].',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.constant(1),
			}),
		],
	}),
	[Action.Sneak]: new ActionDefinition({
		key: Action.Sneak,
		type: ActionType.Movement,
		name: 'Sneak',
		description:
			'Move `Movement - 1` hexes making an additional [[Finesse]] check. Any other participant for which you are concealed can make a contested [[Awareness]] check to spot you. Typically used after taking the [[Hide]] action.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionValueParameter({
				name: 'Distance',
				unit: ActionValueUnit.Hex,
				formula: F.variable(1, DerivedStatType.Movement).add(F.constant(-1)),
			}),
		],
	}),
	[Action.RideMount]: new ActionDefinition({
		key: Action.RideMount,
		type: ActionType.Movement,
		name: 'Ride Mount',
		description: 'WIP: Mounted Combat Rules',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 2 })],
	}),

	// Attack
	[Action.Stun]: new ActionDefinition({
		key: Action.Stun,
		type: ActionType.Attack,
		name: 'Stun',
		description:
			'Special Attack against Body Defense. Causes [[Off_Guard | Off-Guard]]. **Crit Shifts** deal [[Vitality_Point | VP]] damage.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		traits: [Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Strike]: new ActionDefinition({
		key: Action.Strike,
		type: ActionType.Attack,
		name: 'Strike',
		description:
			"Basic Body Attack against target's Body Defense. Deals [[Vitality_Point | VP]] damage. **Crit Shifts** deal extra [[Vitality_Point | VP]] damage.",
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 2 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Feint]: new ActionDefinition({
		key: Action.Feint,
		type: ActionType.Attack,
		name: 'Feint',
		description:
			'Special Attack against [[Tenacity]]. Causes [[Distracted]]. **Crit Shifts** deal [[Focus_Point | FP]] damage.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.FocusedStrike]: new ActionDefinition({
		key: Action.FocusedStrike,
		type: ActionType.Attack,
		name: 'Focused Strike',
		description: 'Pay 1 [[Focus_Point | FP]]; Basic Attack with a +3 [[Circumstance Modifier | CM]].',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 3 }),
			new ActionCost({ resource: Resource.FocusPoint, amount: 1 }),
		],
		traits: [Trait.Concentrate, Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
				circumstanceModifier: new CircumstanceModifier({
					source: ModifierSource.Circumstance,
					name: 'Focused Strike',
					value: 3,
				}),
			}),
		],
	}),
	[Action.Trip]: new ActionDefinition({
		key: Action.Trip,
		type: ActionType.Attack,
		name: 'Trip',
		description:
			'**Special Attack** against [[Stance]]. Causes opponent to be [[Prone]]. Shifts deal [[Vitality_Point | VP]] damage.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		traits: [Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Grapple]: new ActionDefinition({
		key: Action.Grapple,
		type: ActionType.Attack,
		name: 'Grapple',
		description: '**Special Attack** against [[Evasiveness]]. Causes target to become [[Immobilized]].',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		traits: [Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Charge]: new ActionDefinition({
		key: Action.Charge,
		type: ActionType.Attack,
		name: 'Charge',
		description:
			'Move `Movement + 1` hexes in a straight line, followed by Melee Attack with [[Muscles]] instead of [[STR]]. This can be used for a "tackle" if the [[Shove]] Attack Action is chosen, in which case a `+3` [[Circumstance Modifier | CM]] is granted to the attacker.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 2 })],
		traits: [Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Shove]: new ActionDefinition({
		key: Action.Shove,
		type: ActionType.Attack,
		name: 'Shove',
		description: 'Special Attack against [[Stance]]. Shoves opponent to the next hex in the incoming direction.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		traits: [Trait.Melee],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Disarm]: new ActionDefinition({
		key: Action.Disarm,
		type: ActionType.Attack,
		name: 'Disarm',
		description: 'Special Attack against [[Muscles]] or [[Finesse]]. Requires at least one **Shift** to succeed.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 2 })],
		traits: [Trait.Melee, Trait.Concentrate],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StandardCheck.Attack,
			}),
		],
	}),
	[Action.Demoralize]: new ActionDefinition({
		key: Action.Demoralize,
		type: ActionType.Attack,
		name: 'Demoralize',
		description:
			"Special Attack using [[Speechcraft]] against target's [[Resolve]]: target becomes [[Distraught]]. **Crit Shifts** deal [[Spirit_Point | SP]] damage.",
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Speechcraft,
			}),
		],
	}),
	[Action.OpportunityAttack]: new ActionDefinition({
		key: Action.OpportunityAttack,
		type: ActionType.Attack,
		name: 'Opportunity Attack',
		description:
			'Triggered by an opponent either (1) leaving your threat area or (2) performing a [[Concentrate]] action on your threat area. You can choose what kind of **Melee Basic Attack** to perform as your Opportunity Attack (this will cost the same amount of [[Action_Point | AP]] as that action would (at least `1`)).',
		traits: [Trait.Reaction, Trait.Melee],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1, variable: true })],
	}),
	[Action.Distract]: new ActionDefinition({
		key: Action.Distract,
		type: ActionType.Attack,
		name: 'Distract',
		description: 'TODO: Attempt to disrupt a character performing a [[Concentrate]] action.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
	}),

	// Defense
	[Action.BasicDefense]: new ActionDefinition({
		key: Action.BasicDefense,
		type: ActionType.Defense,
		name: 'Basic Defense',
		description:
			'Most Basic Defense against any form of Basic Attack - contest with either [[Body]], [[Mind]] or [[Soul]] against the Attack. This does not cost any [[Action_Point | AP]] and thus can always be responded with.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 0 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statType: StandardCheck.Defense,
			}),
		],
	}),
	[Action.ShrugOff]: new ActionDefinition({
		key: Action.ShrugOff,
		type: ActionType.Defense,
		name: 'Shrug Off',
		description:
			'Immediately as taking >1 [[Vitality_Point | VP]] damage, you can attempt a [[Toughness]] Check (DC 20) to reduce the damage by 1 (+ **Crit Shifts**).',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Static,
				nature: CheckNature.Resisted,
				statType: StatType.Toughness,
				targetDc: 20,
			}),
		],
	}),
	[Action.TakeCover]: new ActionDefinition({
		key: Action.TakeCover,
		type: ActionType.Defense,
		name: 'Take Cover',
		description:
			'When rolling a **Body Defense** against a **Ranged Basic Attack**, you can roll an [[Agility]] Check with a `+6` [[Circumstance_Modifier | CM]] instead when already benefiting from **Basic Cover**.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statType: StatType.Agility,
			}),
		],
	}),
	[Action.ShieldBlock]: new ActionDefinition({
		key: Action.ShieldBlock,
		type: ActionType.Defense,
		name: 'Shield Block',
		description: 'Add **Shield Bonus** to a **Basic Body Defense** contested Check.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		// TODO(luan): model this
	}),
	[Action.Dodge]: new ActionDefinition({
		key: Action.Dodge,
		type: ActionType.Defense,
		name: 'Dodge',
		description:
			'Defend Body against a Basic Attack with an [[Evasiveness]] Check and a `+3` [[Circumstance Modifier | CM]] instead.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statType: StatType.Evasiveness,
				circumstanceModifier: new CircumstanceModifier({
					source: ModifierSource.Circumstance,
					name: 'Dodge',
					value: 3,
				}),
			}),
		],
	}),

	// Support
	[Action.Escape]: new ActionDefinition({
		key: Action.Escape,
		type: ActionType.Support,
		name: 'Escape',
		description: 'Contested [[Evasiveness]] check to clear [[Immobilized]] against a grappler.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Resisted,
				statType: StatType.Evasiveness,
			}),
		],
	}),
	[Action.GetUp]: new ActionDefinition({
		key: Action.GetUp,
		type: ActionType.Support,
		name: 'Get Up',
		description: 'Clears [[Prone]].',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
	}),
	[Action.Hide]: new ActionDefinition({
		key: Action.Hide,
		type: ActionType.Support,
		name: 'Hide',
		description:
			"Try to conceal yourself; make a [[Finesse]] active check that can be contested by each opponent's [[Perception]] Check.",
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		traits: [Trait.Concentrate],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Finesse,
			}),
		],
	}),
	[Action.Aim]: new ActionDefinition({
		key: Action.Aim,
		type: ActionType.Support,
		name: 'Aim',
		description:
			'Target a specific enemy that you can see clearly; if your next action this turn is a **Basic Ranged Attack** against that target, you can roll with [[Finesse]] instead reduce the range increment by `1` (min `0`).',
		traits: [Trait.Concentrate, Trait.Ranged],
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 1 }),
			new ActionCost({ resource: Resource.FocusPoint, amount: 1 }),
		],
	}),
	[Action.Flank]: new ActionDefinition({
		key: Action.Flank,
		type: ActionType.Support,
		name: 'Flank',
		description:
			'When an ally attacks, if on Flanking position, give them a +3 [[Circumstance Modifier | CM]] to their attack roll.',
		traits: [Trait.Reaction],
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
		parameters: [
			new ActionValueParameter({
				name: 'Flank Bonus',
				formula: F.constant(3),
				unit: ActionValueUnit.Modifier,
			}),
		],
	}),
	[Action.Taunt]: new ActionDefinition({
		key: Action.Taunt,
		type: ActionType.Support,
		name: 'Taunt',
		description:
			'Spend 1 [[Spirit_Point | SP]]; roll a [[Presence]] Check against targets [[Resolve]] to persuade an enemy attempting to **Melee Attack** a different target to instead attack you (when you are also in range and would be a valid target).',
		traits: [Trait.Reaction, Trait.Concentrate],
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 1 }),
			new ActionCost({ resource: Resource.SpiritPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Presence,
			}),
		],
	}),

	[Action.CatchBreath]: new ActionDefinition({
		key: Action.CatchBreath,
		type: ActionType.Support,
		name: 'Catch Breath',
		description:
			'Spend 1 [[Focus_Point | FP]] to perform a [[Stamina]] Check DC 20 (Medium): +1 [[Vitality_Point | VP]]. Regardless of result: Clears [[Off_Guard | Off-Guard]].',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 1 }),
			new ActionCost({ resource: Resource.FocusPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Stamina,
				targetDc: 20,
			}),
		],
	}),
	[Action.Calm]: new ActionDefinition({
		key: Action.Calm,
		type: ActionType.Support,
		name: 'Calm',
		description:
			'Spend 1 [[Vitality_Point | VP]] to perform a [[Resolve]] Check DC 20 (Medium): +1 [[Spirit_Point | SP]]; regardless of the result: Clears [[Distraught]].',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 1 }),
			new ActionCost({ resource: Resource.VitalityPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Resolve,
				targetDc: 20,
			}),
		],
	}),
	[Action.Focus]: new ActionDefinition({
		key: Action.Focus,
		type: ActionType.Support,
		name: 'Focus',
		description:
			'Spend 1 [[Spirit_Point | SP]] to perform a [[Tenacity]] Check DC 20 (Medium): +1 [[Focus_Point | FP]]; regardless of the result: Clears [[Distracted]].',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 1 }),
			new ActionCost({ resource: Resource.SpiritPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Tenacity,
				targetDc: 20,
			}),
		],
	}),
	[Action.Inspire]: new ActionDefinition({
		key: Action.Inspire,
		type: ActionType.Support,
		name: 'Inspire',
		description:
			'Make an [[Empathy]] Check DC `20` (Medium; target can resist with [[Resolve]] if they so desire): target gets a `+3` [[Circumstance Modifier | CM]] to a Attack or Defense action of their choice until the end of their next turn. Each **Crit Shifts** grants an additional `+3`.\nApply a `-3` [[Circumstance Modifier | CM]] to your check if they cannot see you.\nApply a `-6` [[Circumstance Modifier | CM]] for each additional target you are trying to inspire at once.',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 2 }),
			new ActionCost({ resource: Resource.SpiritPoint, amount: 1 }),
		],
		traits: [Trait.Concentrate],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Empathy,
				targetDc: 20,
			}),
		],
	}),
	[Action.SheatheUnsheathe]: new ActionDefinition({
		key: Action.SheatheUnsheathe,
		type: ActionType.Support,
		name: 'Sheathe/Unsheathe',
		description: 'Equip or unequip carried weapons, equipment and/or shields.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
	}),
	[Action.Reload]: new ActionDefinition({
		key: Action.Reload,
		type: ActionType.Support,
		name: 'Reload',
		description: 'Reload a weapon with the [[Reload]] trait.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1 })],
	}),

	// Heroic
	[Action.KarmicResistance]: new ActionDefinition({
		key: Action.KarmicResistance,
		type: ActionType.Heroic,
		name: 'Karmic Resistance',
		description:
			'The **Karmic Resistance** is a special mechanic that allows you to spend 1 [[Heroism Point | Heroism Point]] to resist an effect that requires a **Contested Check** by calling upon your [[Karma]] skill instead. You cannot use [[Luck_Die | Luck Die]] or [[Extra_Die | Extra Die]] on this roll.',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 0 }),
			new ActionCost({ resource: Resource.HeroismPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Karma,
			}),
		],
	}),
	[Action.WriteHistory]: new ActionDefinition({
		key: Action.WriteHistory,
		type: ActionType.Heroic,
		name: 'Write History',
		description:
			"**Write History** allows you to spend [[Heroism Point | Heroism Points]] to influence the narrative and create fortunate coincidences in the world around you.\n\nWhen you use Write History, you spend 1+ [[Heroism_Point | HP]] and propose to the DM that a fact about the world is true. It can be about history, about the existence of some item or person in the current city, about the geography and map and lore about the nearby map.\n\nAnything can be proposed, but there are a few rules:\n\n* It must not contradict anything that was already established to the players\n* It must not contradict or interact with any key plans the DM has that have not yet been established to the player\n\nThat means the DM can deny any request w/o any further comments. If the change is acceptable, though, the DM will accept the proposal and counter-offer it with a [[Serendipity]] Check DC, depending on:\n\n* how close to true the fact already is\n* how convenient it would be if it were true\n* how absurd it would be for it to be true\n\nThe player can then accept the offer or offer a counter-counter proposal, by suggesting:\n\n* a slightly more reasonable version of the request\n* a different skill/check to be used\n* a different DC\n\nWith supporting arguments/evidence. This can go back and forth until the DM has the final say on the DC. The Player must make this roll without using any [[Luck_Die | Luck Die]] or [[Extra_Die | Extra Die]] on this roll.\n\nDepending on the level of success or failure (eg how close to the DC it was), the DM will decide:\n\n* complete failure, nothing happens\n* partial failure, the DM picks a weaker/monkey-pawed version of the fact\n* success, the player gets the exact fact as agreed\n* complete success, the player might get a perk on top of the fact\n\nThe DM doesn't necessarily need to tell the player immediately which level of success was obtained.",
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 0 }),
			new ActionCost({ resource: Resource.HeroismPoint, amount: 1, variable: true }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.Serendipity,
			}),
		],
	}),
	[Action.HeroicRelentlessness]: new ActionDefinition({
		key: Action.HeroicRelentlessness,
		type: ActionType.Heroic,
		name: 'Heroic Relentlessness',
		description:
			'A special Action you can take as a full-round-action when you are [[Incapacitated]] by paying a [[Heroism_Point | Heroism Point]] to make a [[FOW]] Check DC 20 (Medium). Restore your [[Vitality_Point | Vitality]], [[Focus_Point | Focus]] and [[Spirit_Point | Spirit]] Points to at least 1 each, thus clearing [[Incapacitated]] (you get a level of [[Exhaustion]] as usual).',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 4 }),
			new ActionCost({ resource: Resource.HeroismPoint, amount: 1 }),
		],
		parameters: [
			new ActionCheckParameter({
				mode: CheckMode.Contested,
				nature: CheckNature.Active,
				statType: StatType.FOW,
				targetDc: 20,
			}),
		],
	}),
	[Action.LuckDie]: new ActionDefinition({
		key: Action.LuckDie,
		type: ActionType.Heroic,
		name: 'Luck Die',
		description:
			"The **Luck Die** is a special mechanic that allows you to enhance your Active Checks by calling upon your [[Fortune]] skill.\n\nWhen you make an **Active Check**, you may spend 1 [[Heroism Point]] to roll an additional d12 alongside your normal check. See the [Rules > Basics](/rules/basics) section for details.\n\nIn order for this extra die to be valid, it must be less or equal than the character's [[Fortune]] score. If it is, that is a valid **Luck Die** that can be picked as one of the two for the final total. Note that, regardless if you pick the **Luck Die** or even if it is valid or not, it still counts for **Crit Modifiers** and **Auto Fail** when applicable.\n\nThe **Luck Die** must be invoked before the roll is made.",
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 0 }),
			new ActionCost({ resource: Resource.HeroismPoint, amount: 1 }),
		],
	}),
	[Action.ExtraDie]: new ActionDefinition({
		key: Action.ExtraDie,
		type: ActionType.Heroic,
		name: 'Extra Die',
		description:
			'The **Extra Die** is a special mechanic that allows you to enhance your **Active Skill Checks** by leveraging a different **Attribute** alongside your main **Skill**.\n\nFor example, imagine you are trying to deceive a guard with a [[Speechcraft]] check, but you have a high [[WIS]]. You can leverage your **Wisdom score** to complement your **Speechcraft Check** by paying 1 [[Heroism_Point | Heroism Point]]. You then roll an extra, visually distinct `d12` for the **Check** (check the [[CHA]] attribute for more examples of Extras).\n\nIn order for this extra die to be valid, it must be less or equal than the Attribute chosen as the **Extra**. If it is, that is a valid ***Extra Die** that can be picked as one of the two for the final total. Note that, regardless if you pick the extra die or even if it is valid or not, it still counts for **Crit Modifiers** and **Auto Fail** when applicable.\n\nThe **Extra Die** must be invoked before the roll is made.',
		costs: [
			new ActionCost({ resource: Resource.ActionPoint, amount: 0 }),
			new ActionCost({ resource: Resource.HeroismPoint, amount: 1 }),
		],
	}),

	// Meta
	[Action.PrepareAction]: new ActionDefinition({
		key: Action.PrepareAction,
		type: ActionType.Meta,
		name: 'Prepare Action',
		description:
			'You can prepare a specific Action to be executed during the next round as a reaction. You must pay 1 extra [[Action_Point | AP]] to prepare, plus the AP associated with the Action you are preparing now, and will be **Concentrating** and cannot take any other Action or Reaction until your trigger procs during the next round. You will be Concentrating during this period and therefore can lose the action if you become [[Distracted]]. Depending on the complexity of the trigger, the DM might need to ask for an [[IQ]], [[Perception]], or some other check to determine your ability to properly react to your trigger.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 1, variable: true })],
		traits: [Trait.Concentrate],
	}),
	[Action.DecreaseInitiative]: new ActionDefinition({
		key: Action.DecreaseInitiative,
		type: ActionType.Meta,
		name: 'Decrease Initiative',
		description:
			'At the start of your turn, you can choose to decrease your Initiative to any value below the current. Your turn then does not start and moves down the turn order. You can never raise your initiative.',
		costs: [new ActionCost({ resource: Resource.ActionPoint, amount: 0 })],
	}),
};
