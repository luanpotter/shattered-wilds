// Chat command system for Shattered Wilds dice rolling
import { getHooks, getUI } from './foundry-shim.js';
import { executeEnhancedRoll, type DiceRollRequest } from './dices.js';

export function registerChatCommands(): void {
	// Hook into Foundry's chat command system
	const hooks = getHooks();
	if (hooks?.on) {
		hooks.on('chatMessage', (_chatLog: unknown, message: string, chatData: Record<string, unknown>) => {
			const prefix = '/d12 ';
			if (message.startsWith(prefix)) {
				const command = message.slice(prefix.length).trim();

				if (parseD12Command(command, chatData)) {
					return false; // prevents default processing
				}
			}

			return true; // allows default processing
		});
	}
}

interface D12CommandOptions {
	name: string;
	modifiers: Record<string, number>;
	extra?: { name: string; value: number };
	luck?: { value: number };
	targetDC?: number;
}

function extractCharacterName(chatData: Record<string, unknown>): string {
	const speaker = chatData.speaker as Record<string, unknown> | undefined;

	if (speaker) {
		// First try to get the actor name (character name)
		const actorName = speaker.actor as string | undefined;
		if (actorName && actorName.trim()) {
			return actorName;
		}

		// Fallback to alias (user display name)
		const alias = speaker.alias as string | undefined;
		if (alias && alias.trim()) {
			return alias;
		}

		// Fallback to token name if available
		const token = speaker.token as string | undefined;
		if (token && token.trim()) {
			return token;
		}
	}

	// Final fallback
	return 'Chat Command';
}

function parseD12Command(command: string, chatData: Record<string, unknown>): boolean {
	try {
		const options = parseD12Parameters(command);
		const characterName = extractCharacterName(chatData);
		executeD12Roll(options, characterName);
		return true;
	} catch (err) {
		console.error('Failed to parse /d12 command:', err);
		getUI().notifications?.error?.(`Invalid /d12 command: ${err instanceof Error ? err.message : 'Unknown error'}`);
		return false;
	}
}

function parseD12Parameters(command: string): D12CommandOptions {
	// Parse: "DEX Check" mod:"Base":+1 mod:"CM":-1 extra:STR:3 luck:4 dc:15

	// Extract quoted name at the beginning
	const nameMatch = command.match(/^"([^"]+)"\s*(.*)/);
	if (!nameMatch || !nameMatch[1]) {
		throw new Error('Command must start with quoted name, e.g. "DEX Check"');
	}

	const name = nameMatch[1];
	const rest = nameMatch[2] || '';

	const options: D12CommandOptions = {
		name,
		modifiers: {},
	};

	// Parse modifiers: mod:"Base":+1 mod:"CM":-1
	const modMatches = rest.matchAll(/mod:"([^"]+)":([+-]?\d+)/g);
	for (const match of modMatches) {
		const modName = match[1];
		const modValueStr = match[2];
		if (modName && modValueStr) {
			const modValue = parseInt(modValueStr);
			options.modifiers[modName] = modValue;
		}
	}

	// Parse extra: extra:STR:3
	const extraMatch = rest.match(/extra:([A-Z]+):(\d+)/);
	if (extraMatch && extraMatch[1] && extraMatch[2]) {
		options.extra = {
			name: extraMatch[1],
			value: parseInt(extraMatch[2]),
		};
	}

	// Parse luck: luck:4
	const luckMatch = rest.match(/luck:(\d+)/);
	if (luckMatch && luckMatch[1]) {
		options.luck = {
			value: parseInt(luckMatch[1]),
		};
	}

	// Parse DC: dc:15
	const dcMatch = rest.match(/dc:(\d+)/);
	if (dcMatch && dcMatch[1]) {
		options.targetDC = parseInt(dcMatch[1]);
	}

	return options;
}

async function executeD12Roll(options: D12CommandOptions, characterName: string): Promise<void> {
	try {
		const rollRequest: DiceRollRequest = {
			name: options.name,
			characterName: characterName,
			modifiers: options.modifiers,
			extra: options.extra,
			luck: options.luck,
			targetDC: options.targetDC,
		};

		await executeEnhancedRoll(rollRequest);
	} catch (err) {
		console.error('Failed to execute /d12 roll:', err);
		getUI().notifications?.error?.('Failed to execute dice roll');
	}
}
