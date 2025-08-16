import { createHexScene, createCharacterWithToken } from './vtt-api.js';
import {
	getActorSheetBase,
	getActorSheetV2,
	getGame,
	getHooks,
	ActorSheetBaseCtor,
	HeaderButton,
	getDocumentSheetConfig,
} from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';

// CONFIG not used yet

const ActorSheetBase = getActorSheetBase() as ActorSheetBaseCtor;
const V2ActorSheet = getActorSheetV2();
const BaseSheet = (V2ActorSheet ?? ActorSheetBase) as ActorSheetBaseCtor;

class ShatteredWildsActorSheet extends BaseSheet {
	static override get defaultOptions() {
		const options = super.defaultOptions as Record<string, unknown>;
		(options as { classes: string[] }).classes = ['shattered-wilds', 'sheet', 'actor'];
		(options as { width: number }).width = 400;
		(options as { height: number }).height = 200;
		(options as { resizable: boolean }).resizable = true;
		(options as { template: string }).template = 'systems/shattered-wilds/templates/actor-sheet.html';
		return options;
	}

	override _getHeaderButtons: () => HeaderButton[] = () => {
		const superProto = Object.getPrototypeOf(ShatteredWildsActorSheet.prototype) as {
			_getHeaderButtons?: () => HeaderButton[];
		};
		const baseButtons = superProto._getHeaderButtons ? superProto._getHeaderButtons.call(this) : [];
		const buttons: HeaderButton[] = [...baseButtons];
		buttons.unshift({
			class: 'sw-export',
			label: 'Export',
			icon: 'fas fa-download',
			onclick: () => {
				const actor = (this as unknown as { actor: { system?: Record<string, unknown> } }).actor;
				const share = exportActorPropsToShareString(actor);
				void navigator.clipboard.writeText(share);
			},
		});
		buttons.unshift({
			class: 'sw-import',
			label: 'Import',
			icon: 'fas fa-upload',
			onclick: () => {
				const actor = (this as unknown as { actor: { update: (d: Record<string, unknown>) => Promise<unknown> } })
					.actor;
				void importActorPropsFromShareString(actor);
			},
		});
		return buttons;
	};
}

getHooks().once('init', () => {
	(globalThis as { [k: string]: unknown }).ShatteredWildsActorSheet = ShatteredWildsActorSheet;
	// v13: register via DocumentSheetConfig (documentClass, scope, sheetClass, options)
	const ActorCtor = (globalThis as unknown as { Actor: unknown }).Actor;
	getDocumentSheetConfig().registerSheet(ActorCtor, 'shattered-wilds', ShatteredWildsActorSheet, {
		label: 'Shattered Wilds Actor Sheet',
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
