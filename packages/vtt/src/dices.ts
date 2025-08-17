import { FoundryRoll, getRollCtor } from './foundry-shim';

export interface DiceRollRequest {
	name: string; // name of the roll, either the primary stat or derived stat (e.g. "STR", "Level", "Finesse")
	characterName: string; // name of the character to roll for
	modifiers: Record<string, number>; // list of modifiers to apply with user facing names (e.g. "Feat: Favored Upbringing" -> +1)
	extra: // whether to add the extra die, and if so, the parameters
	| {
				name: string; // name of the extra attribute (e.g. "STR", "DEX")
				value: number; // the value of the attribute to check if the extra die is valid
		  }
		| undefined;
	luck: // whether to add the luck die, and if so, the parameters
	| {
				value: number; // the value of the attribute to check if the luck die is valid
		  }
		| undefined;
	targetDC: number | undefined; // the target DC to check if the roll is successful (optional)
}

export type ExtraDiceParams = { value: number; valid?: boolean; label?: string };

export const executeEnhancedRoll = async (roll: DiceRollRequest): Promise<number> => {
	const { name, characterName, modifiers, extra, luck, targetDC } = roll;

	const diceCount = 2 + (extra ? 1 : 0) + (luck ? 1 : 0);

	const rolls = await getRollCtor().create(`${diceCount}d12`);
	await rolls.evaluate();

	const extraDice: { extra: ExtraDiceParams | undefined; luck: ExtraDiceParams | undefined } = {
		extra: undefined,
		luck: undefined,
	};

	if (extra) {
		const extraIndex = 2;
		const extraRollValue = rolls.terms[0]!.results![extraIndex]!.result;
		const extraValue = extra.value;

		extraDice.extra = {
			value: extraRollValue,
			valid: extraRollValue <= extraValue,
			label: `${extra.name} (${extraValue})`,
		};
	}

	if (luck) {
		const luckIndex = 2 + (extra ? 1 : 0);
		const luckRollValue = rolls.terms[0]!.results![luckIndex]!.result;
		const fortuneValue = luck.value;

		extraDice.luck = {
			value: luckRollValue,
			valid: luckRollValue <= fortuneValue,
			label: `Luck (${fortuneValue})`,
		};
	}

	const totalModifier = Object.values(modifiers).reduce((sum, val) => sum + val, 0);

	let flavorText = `<strong>${name} Check [${totalModifier}]</strong>`;
	if (Object.keys(modifiers).length > 0) {
		flavorText += `<br>Modifiers: ${Object.entries(modifiers)
			.map(([name, value]) => {
				const sign = value >= 0 ? '+' : '';
				return `${name} ${sign}${value}`;
			})
			.join(', ')}`;
	}
	if (targetDC !== undefined) {
		flavorText += `<br>Target DC: ${targetDC}`;
	}

	return await processEnhancedShatteredWildsRoll(rolls, modifiers, extraDice, name, targetDC, {
		speaker: {
			alias: `${name} Check - ${characterName}`,
		},
		flavor: flavorText,
	});
};

const calculateShifts = (excess: number): number => {
	if (excess < 6) return 0;

	let shifts = 0;
	let threshold = 6;
	let gap = 6;

	while (excess >= threshold) {
		shifts++;
		threshold += gap;
		gap += 6;
	}

	return shifts;
};

const rollToResults = (roll: FoundryRoll, index: number): number | undefined => {
	return roll.terms[0]?.results?.[index]?.result;
};

const processEnhancedShatteredWildsRoll = async (
	rolls: FoundryRoll,
	modifiers: Record<string, number>,
	extraDice: { extra: ExtraDiceParams | undefined; luck: ExtraDiceParams | undefined },
	name: string,
	targetDC: number | undefined,
	chatOptions: { speaker?: { alias?: string }; flavor?: string },
): Promise<number> => {
	const baseValues = [rollToResults(rolls, 0)!, rollToResults(rolls, 1)!];

	const allDiceValues = [
		...baseValues,
		...(extraDice.extra ? [extraDice.extra.value] : []),
		...(extraDice.luck ? [extraDice.luck.value] : []),
	];

	const allValidDiceValues = [
		...baseValues,
		...(extraDice.extra?.valid === true ? [extraDice.extra.value] : []),
		...(extraDice.luck?.valid === true ? [extraDice.luck.value] : []),
	];
	const topTwoValidDiceValues = allValidDiceValues.sort((a, b) => b - a).slice(0, 2);

	// Check for crit modifiers
	let critModifiers = 0;
	if (allDiceValues.includes(12)) critModifiers += 6;

	// Check for pairs
	const pairs = allDiceValues.filter(
		(val: number, i: number, arr: number[]) =>
			arr.indexOf(val) !== i && arr.filter((x: number) => x === val).length >= 2,
	);
	if (pairs.length > 0) critModifiers += 6;

	// Check for auto-fail (pair of 1s)
	const ones = allDiceValues.filter((v: number) => v === 1);
	const autoFail = ones.length >= 2;

	// Calculate final total
	const baseTotal = topTwoValidDiceValues.reduce((sum, val) => sum + val, 0);
	const totalModifier = Object.values(modifiers).reduce((sum, val) => sum + val, 0);
	const finalTotal = baseTotal + critModifiers + totalModifier;

	// Calculate success and shifts if DC is provided
	let success: boolean | undefined;
	let shifts = 0;

	if (!autoFail && targetDC !== undefined) {
		success = finalTotal >= targetDC;
		if (success) {
			const excess = finalTotal - targetDC;
			shifts = calculateShifts(excess);
		}
	}

	// Build enhanced mechanics message
	let mechanicsHtml = `<div class="shattered-wilds-mechanics" style="font-family: Arial; margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">`;

	// Show modifiers breakdown
	if (Object.keys(modifiers).length > 0) {
		mechanicsHtml += `<div style="margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.1); border-radius: 3px;">`;
		mechanicsHtml += `<strong>${name} Breakdown:</strong>`;

		for (const [modName, modValue] of Object.entries(modifiers)) {
			const sign = modValue >= 0 ? '+' : '';
			mechanicsHtml += `<br>• ${modName}: ${sign}${modValue}`;
		}

		mechanicsHtml += `<br><strong>Total Modifier: ${totalModifier >= 0 ? '+' : ''}${totalModifier}</strong>`;
		mechanicsHtml += `</div>`;
	}

	// Show dice breakdown
	mechanicsHtml += `<div style="margin-bottom: 8px;">`;
	mechanicsHtml += `<strong>Base Dice:</strong> ${baseValues.join(', ')}`;

	if (extraDice.extra) {
		const extraLabels = extraDice.extra.valid !== undefined ? (extraDice.extra.valid ? ' ✓' : ' ✗') : '';
		mechanicsHtml += `<br><strong>Extra Dice:</strong> ${extraDice.extra.label}: ${extraDice.extra.value}${extraLabels}`;
	}
	if (extraDice.luck) {
		const luckLabels = extraDice.luck.valid !== undefined ? (extraDice.luck.valid ? ' ✓' : ' ✗') : '';
		mechanicsHtml += `<br><strong>Luck Dice:</strong> ${extraDice.luck.label}: ${extraDice.luck.value}${luckLabels}`;
	}
	if (extraDice.extra || extraDice.luck) {
		mechanicsHtml += `<br><strong>Selected Dice:</strong> ${topTwoValidDiceValues.join(', ')} = ${baseTotal}`;
	}

	mechanicsHtml += `</div>`;

	// Show mechanics
	if (autoFail) {
		mechanicsHtml += `<div style="color: #d32f2f; font-weight: bold; font-size: 1.1em;">🎲 AUTO FAIL</div>`;
		mechanicsHtml += `<div style="color: #666; font-size: 0.9em;">Rolled pair of 1s</div>`;
	} else {
		if (critModifiers > 0) {
			mechanicsHtml += `<div style="color: #f57c00; font-weight: bold;">🎲 Crit Modifiers: +${critModifiers}</div>`;
		}

		mechanicsHtml += `<div style="color: #2e7d32; font-weight: bold; font-size: 1.1em;">🎯 Final Total: ${finalTotal}</div>`;

		if (targetDC !== undefined) {
			const successText = success ? 'SUCCESS' : 'FAILURE';
			const successColor = success ? '#2e7d32' : '#d32f2f';
			mechanicsHtml += `<div style="color: ${successColor}; font-weight: bold; margin-top: 4px;">vs DC ${targetDC}: ${successText}</div>`;

			if (success && shifts > 0) {
				mechanicsHtml += `<div style="color: #ff6f00; font-weight: bold;">⚡ Shifts: ${shifts}</div>`;
			}
		}
	}

	mechanicsHtml += `</div>`;

	// Send the enhanced single message with dice and mechanics
	await rolls.toMessage({
		...chatOptions,
		flavor: `${chatOptions.flavor || ''}<br>${mechanicsHtml}`,
	});

	return finalTotal;
};
