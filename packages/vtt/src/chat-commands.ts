// Chat command system for Shattered Wilds dice rolling
import { DiceRoll, DiceRollEncoder } from '@shattered-wilds/commons';
import { executeEnhancedRoll } from './dices.js';
import { Foundry, showNotification } from './foundry-shim.js';

export function registerChatCommands(): void {
	Foundry.Hooks.on('chatMessage', (...args: unknown[]) => {
		const [, message, chatData] = args;
		if (typeof message !== 'string') return true;
		if (!chatData || typeof chatData !== 'object') return true;

		const prefix = '/d12 ';
		if (message.startsWith(prefix)) {
			if (parseD12Command(message, chatData as Record<string, unknown>)) {
				return false; // prevents default processing
			}
		}

		return true; // allows default processing
	});
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
		const characterName = extractCharacterName(chatData);
		const diceRoll = parseD12Parameters(command, characterName);
		if (!diceRoll) {
			return false;
		}

		executeD12Roll(diceRoll);
		return true;
	} catch (err) {
		console.error('Failed to parse /d12 command:', err);
		showNotification('error', `Invalid /d12 command: ${err instanceof Error ? err.message : 'Unknown error'}`);
		return false;
	}
}

function parseD12Parameters(command: string, characterName: string): DiceRoll | undefined {
	try {
		return DiceRollEncoder.decode(command, { fallbackCharacterName: characterName });
	} catch (err) {
		console.error('Failed to decode /d12 command:', err);
		showNotification('error', `Invalid /d12 command format: ${err instanceof Error ? err.message : 'Unknown error'}`);
		return undefined;
	}
}

async function executeD12Roll(diceRoll: DiceRoll): Promise<void> {
	try {
		await executeEnhancedRoll(diceRoll);
	} catch (err) {
		console.error('Failed to execute /d12 roll:', err);
		showNotification('error', 'Failed to execute dice roll');
	}
}
