import { Check, DiceRoll, DiceRollConfig, DiceRoller, EntropyProvider, RollResults } from '@shattered-wilds/commons';
import { Foundry, FoundryRoll } from '../foundry-shim';
import { DiceRollModal } from '../modals/dice-modal';

export interface RollDiceRequest {
	actorId: string;
	characterName: string;
	check: Check;
	targetDC: number | undefined;
	useModal: boolean;
}

/**
 * EntropyProvider that uses Foundry's Roll to generate d12 values.
 * Returns the FoundryRoll as context for later use with .toMessage().
 */
const foundryEntropyProvider: EntropyProvider<FoundryRoll> = async (count: number) => {
	const foundryRoll = await Foundry.Roll.create(`${count}d12`);
	await foundryRoll.evaluate();

	const values: number[] = [];
	for (let i = 0; i < count; i++) {
		const result = foundryRoll.terms[0]?.results?.[i]?.result;
		if (result === undefined) {
			throw new Error(`No result at index ${i}`);
		}
		values.push(result);
	}

	return { values, context: foundryRoll };
};

export const rollDice = async (request: RollDiceRequest): Promise<void> => {
	if (request.useModal) {
		await DiceRollModal.open({
			actorId: request.actorId,
			targetDC: request.targetDC,
			check: request.check,
		});
	} else {
		const rollRequest: DiceRoll = {
			characterName: request.characterName,
			check: request.check,
			extra: undefined,
			luck: undefined,
			targetDC: request.targetDC,
		};

		await executeEnhancedRoll(rollRequest);
	}
};

export const executeEnhancedRoll = async (roll: DiceRoll): Promise<number> => {
	const { characterName, check, extra, luck, targetDC } = roll;

	// Build config for DiceRoller
	const config: DiceRollConfig = {
		modifierValue: check.modifierValue.value,
		checkType: check.type,
		targetDC: targetDC ?? null,
		...(extra && { extra: { name: extra.name, value: extra.value } }),
		...(luck && { luck: { value: luck.value } }),
	};

	// Use DiceRoller to roll and process - context contains the FoundryRoll
	const diceRoller = new DiceRoller(foundryEntropyProvider);
	const results = await diceRoller.roll(config);

	return await displayRollResults({
		check,
		results,
		extra,
		luck,
		characterName,
		targetDC,
	});
};

interface DisplayParams {
	check: Check;
	results: RollResults<FoundryRoll>;
	extra: DiceRoll['extra'];
	luck: DiceRoll['luck'];
	characterName: string;
	targetDC: number | undefined;
}

const displayRollResults = async (params: DisplayParams): Promise<number> => {
	const { check, results, extra, luck, characterName, targetDC } = params;
	const {
		dice,
		autoFail,
		total: finalTotal,
		critModifiers,
		critShifts: shifts,
		success,
		selectedDice,
		context: foundryRoll,
	} = results;

	// Get base dice values for display
	const baseValues = dice.filter(d => d.type === 'base').map(d => d.value);
	const extraDie = dice.find(d => d.type === 'extra');
	const luckDie = dice.find(d => d.type === 'luck');

	// Get base total for display
	const baseTotal = selectedDice.reduce((sum, val) => sum + val, 0);

	// Build enhanced mechanics message
	let mechanicsHtml = `<div class="shattered-wilds-mechanics" style="font-family: Arial; margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">`;

	// Show modifiers breakdown
	mechanicsHtml += `<div style="margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.1); border-radius: 3px;">`;
	mechanicsHtml += `<strong style="font-weight: bold; font-size: 1.8em;">${check.descriptor}</strong>`;

	for (const { name, value } of check.statModifier.breakdown()) {
		mechanicsHtml += `<br>• ${name}: ${value}`;
	}

	mechanicsHtml += `<br><strong>Total Modifier: ${check.modifierValue.description}</strong>`;
	mechanicsHtml += `</div>`;

	// Show dice breakdown
	mechanicsHtml += `<div style="margin-bottom: 8px;">`;
	mechanicsHtml += `<strong>Base Dice:</strong> ${baseValues.join(', ')}`;

	if (extraDie && extra) {
		const extraLabel = extraDie.valid ? ' ✓' : ' ✗';
		mechanicsHtml += `<br><strong>Extra Die:</strong> ${extra.name} (${extra.value}): ${extraDie.value}${extraLabel}`;
	}
	if (luckDie && luck) {
		const luckLabel = luckDie.valid ? ' ✓' : ' ✗';
		mechanicsHtml += `<br><strong>Luck Die:</strong> Fortune (${luck.value}): ${luckDie.value}${luckLabel}`;
	}
	if (extraDie || luckDie) {
		mechanicsHtml += `<br><strong>Selected Dice:</strong> ${selectedDice.join(', ')} = ${baseTotal}`;
	}

	mechanicsHtml += `</div>`;
	mechanicsHtml += `<hr />`;

	// Show mechanics
	if (autoFail) {
		mechanicsHtml += `<div style="color: #d32f2f; font-weight: bold; font-size: 1.1em;">🎲 AUTO FAIL</div>`;
		mechanicsHtml += `<div style="color: #666; font-size: 0.9em;">Rolled pair of 1s</div>`;
	} else {
		if (critModifiers > 0) {
			mechanicsHtml += `<div style="color: #f57c00; font-weight: bold; margin-top: 4px; font-size: 1.2em;">🎲 Crit Modifiers: +${critModifiers}</div>`;
		}

		mechanicsHtml += `<div style="color: #2e7d32; font-weight: bold; margin-top: 4px; font-size: 1.2em;">🎯 Final Total: ${finalTotal}</div>`;

		if (targetDC !== undefined) {
			const successText = success ? 'SUCCESS' : 'FAILURE';
			const successColor = success ? '#2e7d32' : '#d32f2f';
			mechanicsHtml += `<div style="color: ${successColor}; font-weight: bold; margin-top: 4px; font-size: 1.2em;">🆚 DC ${targetDC}: ${successText}</div>`;

			if (success && shifts > 0) {
				mechanicsHtml += `<div style="color: #ad00cfff; font-weight: bold; margin-top: 4px; font-size: 1.2em;">⚡ Shifts: ${shifts}</div>`;
			}
		}
	}

	mechanicsHtml += `</div>`;

	// Send the enhanced single message with dice and mechanics
	await foundryRoll.toMessage({
		speaker: {
			alias: `${check.name} Check [${check.modifierValue.description}] - ${characterName}`,
		},
		flavor: mechanicsHtml,
	});

	return finalTotal;
};
