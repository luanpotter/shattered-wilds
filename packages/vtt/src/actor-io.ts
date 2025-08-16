import { CharacterSheet } from '@shattered-wilds/commons';
import { getUI, promptText } from './foundry-shim.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { ensureActorDataPersistence } from './actor-data-manager.js';

export function exportActorPropsToShareString(actor: {
	flags?: Record<string, unknown>;
	system?: Record<string, unknown>;
}): string {
	const swFlags = (actor.flags?.['shattered-wilds'] as { props?: Record<string, string> } | undefined) ?? undefined;
	const props = swFlags?.props ?? {};
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: {
	setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
}) {
	const shareString = await promptText({ title: 'Import Character', label: 'Share String' });
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		console.log('Parsed props:', props);
		// Sanitize the props to ensure no path expansion issues
		const sanitizedProps = Object.fromEntries(
			Object.entries(props).map(([key, value]) => [
				key.replace(/[^a-zA-Z0-9\-_]/g, '_'), // Replace special chars with underscore
				value,
			]),
		);
		await actor.setFlag('shattered-wilds', 'props', sanitizedProps);

		// Ensure data persistence for token creation
		await ensureActorDataPersistence(actor);

		// Configure default token bars after successful import
		await configureDefaultTokenBars(actor);

		getUI().notifications?.info('Character imported');
	} catch (err) {
		console.error('Failed to import character', err);
		getUI().notifications?.error('Failed to import character');
	}
}
