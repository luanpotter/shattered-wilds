import { CharacterSheet } from '@shattered-wilds/commons';
import { getUI, promptText } from './foundry-shim.js';
import { configureDefaultTokenBars } from './token-bars.js';
import { ActorLike, ensureActorDataPersistence } from './actor-data-manager.js';
import { parseCharacterProps, sanitizeProps } from './characters.js';

export function exportActorPropsToShareString(actor: ActorLike): string {
	const props = parseCharacterProps(actor);
	return CharacterSheet.toShareString(props);
}

export async function importActorPropsFromShareString(actor: ActorLike) {
	const shareString = await promptText({ title: 'Import Character', label: 'Share String' });
	if (!shareString) return;
	try {
		const props = CharacterSheet.parsePropsFromShareString(shareString);
		const sanitizedProps = sanitizeProps(props);
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
