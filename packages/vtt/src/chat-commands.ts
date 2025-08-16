// Chat command system for Shattered Wilds dice rolling
import { getHooks, getRollCtor, getChatMessage, getUI, type FoundryRoll } from './foundry-shim.js';

export function registerChatCommands(): void {
	// Hook into Foundry's chat command system
	const hooks = getHooks();
	if (hooks?.on) {
		hooks.on('chatMessage', (_chatLog: unknown, message: string, chatData: Record<string, unknown>) => {
			// Check if this is a Shattered Wilds dice command
			if (message.startsWith('/r ') || message.startsWith('/roll ')) {
				const command = message.slice(message.indexOf(' ') + 1).trim();

				// Parse the command for Shattered Wilds syntax
				if (parseShatteredWildsCommand(command, chatData)) {
					return false; // Prevent default processing
				}
			}

			return true; // Allow default processing
		});
	}
}

function parseShatteredWildsCommand(command: string, chatData: Record<string, unknown>): boolean {
	// Parse patterns like: "d12 + 5", "2d12 + 3 extra luck", "d12 + 2 dc 15"
	const match = command.match(/^(?:(\d+)?d12|d12)\s*(?:\+\s*(\d+))?\s*(.*)?$/i);

	if (!match) return false;

	const numDice = parseInt(match[1] || '2'); // Default to 2d12
	const modifier = parseInt(match[2] || '0');
	const extras = match[3]?.trim().toLowerCase() || '';

	// Parse extra options
	const useExtra = extras.includes('extra');
	const useLuck = extras.includes('luck');
	const dcMatch = extras.match(/dc\s+(\d+)/);
	const dc = dcMatch ? parseInt(dcMatch[1]!) : null;

	// Execute the Shattered Wilds roll
	executeShatteredWildsRoll({
		numDice,
		modifier,
		useExtra,
		useLuck,
		dc,
		chatData,
	});

	return true;
}

interface RollOptions {
	numDice: number;
	modifier: number;
	useExtra: boolean;
	useLuck: boolean;
	dc: number | null;
	chatData: Record<string, unknown>;
}

async function executeShatteredWildsRoll(options: RollOptions): Promise<void> {
	const { numDice, modifier, useExtra, useLuck, dc, chatData } = options;

	try {
		// Create the base dice roll
		const baseDice = Math.max(2, numDice); // Always at least 2d12
		const formula = `${baseDice}d12 + ${modifier}`;

		// Execute the roll using Foundry's dice system
		const roll = await getRollCtor().create(formula);
		await roll.evaluate();

		// Roll extra and luck dice if requested
		const extraDice: number[] = [];

		if (useExtra) {
			const extraRoll = await getRollCtor().create('1d12');
			await extraRoll.evaluate();
			await extraRoll.toMessage({ flavor: '<strong>Extra Die</strong>' });
			extraDice.push(extraRoll.total);
		}

		if (useLuck) {
			const luckRoll = await getRollCtor().create('1d12');
			await luckRoll.evaluate();
			await luckRoll.toMessage({ flavor: '<strong>Luck Die</strong>' });
			extraDice.push(luckRoll.total);
		}

		// Process Shattered Wilds mechanics
		const result = processShatteredWildsRollResult(roll, extraDice, dc);

		// Create enhanced chat message
		await createShatteredWildsChatMessage(roll, result, {
			useExtra,
			useLuck,
			dc,
			extraDice,
			chatData,
		});
	} catch (err) {
		console.error('Failed to execute Shattered Wilds roll:', err);
		getUI().notifications?.error?.('Failed to execute dice roll');
	}
}

interface RollResult {
	baseTotal: number;
	critModifiers: number;
	finalTotal: number;
	autoFail: boolean;
	success: boolean | undefined;
	shifts: number;
	diceValues: number[];
}

function processShatteredWildsRollResult(roll: FoundryRoll, extraDice: number[], dc: number | null): RollResult {
	const baseDice = roll.terms[0]?.results || [];
	const diceValues = baseDice.map(d => d.result);

	// Include extra dice in the analysis
	const allDice = [...diceValues, ...extraDice];

	// Check for crit modifiers
	let critModifiers = 0;
	if (allDice.includes(12)) critModifiers += 6;

	// Check for pairs
	const pairs = allDice.filter(
		(val: number, i: number, arr: number[]) =>
			arr.indexOf(val) !== i && arr.filter((x: number) => x === val).length >= 2,
	);
	if (pairs.length > 0) critModifiers += 6;

	// Check for auto-fail (pair of 1s)
	const ones = allDice.filter((v: number) => v === 1);
	const autoFail = ones.length >= 2;

	// Calculate totals
	const baseTotal = roll.total;
	const finalTotal = baseTotal + critModifiers;

	// Calculate success and shifts
	let success: boolean | undefined;
	let shifts = 0;

	if (!autoFail && dc !== null) {
		success = finalTotal >= dc;
		if (success) {
			const excess = finalTotal - dc;
			shifts = calculateShifts(excess);
		}
	}

	return {
		baseTotal,
		critModifiers,
		finalTotal,
		autoFail,
		success,
		shifts,
		diceValues: allDice,
	};
}

function calculateShifts(excess: number): number {
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
}

async function createShatteredWildsChatMessage(
	roll: FoundryRoll,
	result: RollResult,
	options: {
		useExtra: boolean;
		useLuck: boolean;
		dc: number | null;
		extraDice: number[];
		chatData: Record<string, unknown>;
	},
): Promise<void> {
	const { useExtra, useLuck, dc, extraDice, chatData } = options;

	// Create the main roll message
	await roll.toMessage({
		...chatData,
		flavor: `<strong>Shattered Wilds Roll</strong><br>Rolling ${roll.formula}`,
	});

	// Create enhanced mechanics message
	let mechanicsHtml = `<div class="shattered-wilds-roll" style="font-family: Arial; margin: 8px 0; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">`;

	// Show dice breakdown
	mechanicsHtml += `<div style="margin-bottom: 8px;">`;
	mechanicsHtml += `<strong>Dice:</strong> ${result.diceValues.slice(0, 2).join(', ')}`;
	if (extraDice.length > 0) {
		const extraLabels = [];
		let extraIndex = 0;
		if (useExtra) extraLabels.push(`Extra: ${extraDice[extraIndex++]}`);
		if (useLuck) extraLabels.push(`Luck: ${extraDice[extraIndex++]}`);
		mechanicsHtml += ` | ${extraLabels.join(', ')}`;
	}
	mechanicsHtml += `</div>`;

	// Show mechanics
	if (result.autoFail) {
		mechanicsHtml += `<div style="color: #d32f2f; font-weight: bold; font-size: 1.1em;">🎲 AUTO FAIL</div>`;
		mechanicsHtml += `<div style="color: #666; font-size: 0.9em;">Rolled pair of 1s</div>`;
	} else {
		if (result.critModifiers > 0) {
			mechanicsHtml += `<div style="color: #f57c00; font-weight: bold;">🎲 Crit Modifiers: +${result.critModifiers}</div>`;
		}

		mechanicsHtml += `<div style="color: #2e7d32; font-weight: bold; font-size: 1.1em;">🎯 Final Total: ${result.finalTotal}</div>`;

		if (dc !== null) {
			const successText = result.success ? 'SUCCESS' : 'FAILURE';
			const successColor = result.success ? '#2e7d32' : '#d32f2f';
			mechanicsHtml += `<div style="color: ${successColor}; font-weight: bold; margin-top: 4px;">vs DC ${dc}: ${successText}</div>`;

			if (result.success && result.shifts > 0) {
				mechanicsHtml += `<div style="color: #ff6f00; font-weight: bold;">⚡ Shifts: ${result.shifts}</div>`;
			}
		}
	}

	mechanicsHtml += `</div>`;

	// Send the mechanics message
	await getChatMessage().create({
		...chatData,
		content: mechanicsHtml,
	});
}
