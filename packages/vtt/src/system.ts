import { createHexScene, createCharacterWithToken } from './vtt-api.js';
import { getGame, getHooks, getTokenObjectCtor, getDocumentSheetConfig } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';
import { SWCharacterApp, newSWCharacterApp } from './character-app.js';
import { SWActorSheetV2 } from './actor-sheet-v2.js';

getHooks().once('init', () => {
	// Register V2 sheet as default for our Actor type
	const ActorCtor = (globalThis as unknown as { Actor: unknown }).Actor;
	getDocumentSheetConfig().registerSheet(ActorCtor, 'shattered-wilds', SWActorSheetV2, {
		label: 'Shattered Wilds Actor Sheet',
		types: ['character'],
		makeDefault: true,
	});
});

getHooks().once('ready', () => {
	(getGame() as { shatteredWilds?: unknown }).shatteredWilds = {
		createHexScene,
		createCharacterWithToken,
		openCharacterApp: (actorId: string) => {
			const app = newSWCharacterApp({ actorId });
			(app as { render: (force?: boolean) => unknown }).render(true);
		},
		exportActor: exportActorPropsToShareString,
		importActor: importActorPropsFromShareString,
	};

	// Patch Token double-click to open our V2 character app
	const TokenCtor = getTokenObjectCtor();
	const original = TokenCtor.prototype._onClickLeft2.bind(TokenCtor.prototype);
	TokenCtor.prototype._onClickLeft2 = function patched(event: unknown) {
		try {
			const actorId: string | undefined = this.document?.actorId ?? this.actor?.id;
			if (actorId && SWCharacterApp.isSupported()) {
				const app = newSWCharacterApp({ actorId });
				(app as { render: (force?: boolean) => unknown }).render(true);
				return; // do not call legacy sheet
			}
		} catch {
			// fall back
		}
		return original(event);
	};

	console.log('Shattered Wilds system ready (V3)');
});
