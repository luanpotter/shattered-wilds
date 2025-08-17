// Chat command system for Shattered Wilds dice rolling
import { getHooks, getUI } from './foundry-shim.js';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';

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
	const { modifier, useExtra, useLuck, dc } = options;

	try {
		// Use centralized dice system
		const rollRequest: DiceRollRequest = {
			name: 'Chat Roll',
			modifiers: modifier !== 0 ? { Base: modifier } : {},
			extra: useExtra
				? {
						name: 'Extra', // Generic extra die from chat
						value: 12, // Always valid for generic extra
					}
				: undefined,
			luck: useLuck
				? {
						value: 12, // Always valid for generic luck
					}
				: undefined,
			targetDC: dc || undefined,
		};

		await executeEnhancedRoll(rollRequest);
	} catch (err) {
		console.error('Failed to execute Shattered Wilds roll:', err);
		getUI().notifications?.error?.('Failed to execute dice roll');
	}
}

// All dice mechanics now handled by centralized dices.ts
