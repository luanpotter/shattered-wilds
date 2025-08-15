import { createHexScene, createCharacterWithToken } from './vtt-api';
import { getActorsManager, getActorSheetBase, getGame, getHooks, ActorSheetBaseCtor } from './foundry-shim';

// CONFIG not used yet

const ActorSheetBase = getActorSheetBase() as ActorSheetBaseCtor;
class ShatteredWildsActorSheet extends ActorSheetBase {
	static override get defaultOptions() {
		const options = super.defaultOptions as Record<string, unknown>;
		(options as { classes: string[] }).classes = ['shattered-wilds', 'sheet', 'actor'];
		(options as { width: number }).width = 400;
		(options as { height: number }).height = 200;
		(options as { resizable: boolean }).resizable = true;
		(options as { template: string }).template = 'systems/shattered-wilds/templates/actor-sheet.html';
		return options;
	}
}

getHooks().once('init', () => {
	(globalThis as { [k: string]: unknown }).ShatteredWildsActorSheet = ShatteredWildsActorSheet;
	const Actors = getActorsManager();
	try {
		Actors.unregisterSheet('core', getActorSheetBase());
	} catch {
		/* ignore */
	}
	Actors.registerSheet('shattered-wilds', ShatteredWildsActorSheet, {
		types: ['character'],
		makeDefault: true,
	});
});

getHooks().once('ready', () => {
	(getGame() as { shatteredWilds?: unknown }).shatteredWilds = {
		createHexScene,
		createCharacterWithToken,
	};
	console.log('Shattered Wilds system ready');
});
