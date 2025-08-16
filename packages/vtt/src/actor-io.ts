import { CharacterSheet } from '@shattered-wilds/commons';
import { getUI, promptText } from './foundry-shim.js';

export function exportActorPropsToShareString(actor: { system?: Record<string, unknown> }): string {
	const props = (actor.system?.props ?? {}) as Record<string, string>;
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: {
	update: (data: Record<string, unknown>) => Promise<unknown>;
}) {
	const shareString = await promptText({ title: 'Import Character', label: 'Share String' });
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		await actor.update({ 'system.props': props });
		getUI().notifications?.info('Character imported');
	} catch {
		getUI().notifications?.error('Failed to import character');
	}
}
