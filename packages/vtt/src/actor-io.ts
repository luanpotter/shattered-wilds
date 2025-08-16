import { CharacterSheet } from '@shattered-wilds/commons';
import { getUI } from './foundry-shim.js';

export function exportActorPropsToShareString(actor: { system?: Record<string, unknown> }): string {
	const props = (actor.system?.props ?? {}) as Record<string, string>;
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: {
	update: (data: Record<string, unknown>) => Promise<unknown>;
}) {
	const shareString = await promptForText('Paste character share string');
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		await actor.update({ 'system.props': props });
		getUI().notifications?.info('Character imported');
	} catch {
		getUI().notifications?.error('Failed to import character');
	}
}

async function promptForText(title: string): Promise<string | null> {
	// Minimal prompt using browser
	const value = window.prompt(title, '');
	return value && value.trim() ? value.trim() : null;
}
