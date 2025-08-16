import { CharacterSheet } from '@shattered-wilds/commons';
import { getUI, promptText } from './foundry-shim.js';

export function exportActorPropsToShareString(actor: {
	flags?: Record<string, unknown>;
	system?: Record<string, unknown>;
}): string {
	const swFlags = (actor.flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
	const props = swFlags?.props ?? {};
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: {
	update: (data: Record<string, unknown>) => Promise<unknown>;
}) {
	const shareString = await promptText({ title: 'Import Character', label: 'Share String' });
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		await actor.update({ 'flags.shattered-wilds.props': props });
		getUI().notifications?.info('Character imported');
	} catch (err) {
		console.error('Failed to import character', err);
		getUI().notifications?.error('Failed to import character');
	}
}
