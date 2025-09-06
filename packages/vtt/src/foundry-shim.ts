// Foundry VTT type definitions and safe access layer
// This file centralizes all Foundry API access to provide type safety

export interface ActorLike {
	id: string;
	name: string;
	type: string;
	flags?: Record<string, unknown>;
	update?: (data: Record<string, unknown>) => Promise<unknown>;
	getFlag?: (scope: string, key: string) => unknown;
	setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
	unsetFlag?: (scope: string, key: string) => Promise<unknown>;
	getActiveTokens?: () => TokenLike[];
	token?: TokenLike;
	sheet?: {
		render?: (force?: boolean) => void;
	};
}

export interface TokenLike {
	id: string;
	name: string;
	actor?: ActorLike;
	document?: {
		update?: (data: Record<string, unknown>) => Promise<unknown>;
		actorId?: string;
	};
}

export interface SceneLike {
	id: string;
	name: string;
	active?: boolean;
	createEmbeddedDocuments?: (type: string, data: unknown[]) => Promise<unknown[]>;
}

export interface GameLike {
	actors?: {
		get?: (id: string) => ActorLike | undefined;
		contents?: ActorLike[];
	};
	scenes?: {
		get?: (id: string) => SceneLike | undefined;
		active?: SceneLike;
		contents?: SceneLike[];
	};
	user?: {
		id: string;
		name: string;
	};
}

export interface HooksLike {
	on?: (event: string, callback: (...args: unknown[]) => unknown) => void;
	once?: (event: string, callback: (...args: unknown[]) => unknown) => void;
	call?: (event: string, ...args: unknown[]) => unknown;
}

export interface UILike {
	notifications?: {
		info?: (message: string) => void;
		warn?: (message: string) => void;
		error?: (message: string) => void;
	};
}

export interface ActorSheetBaseCtor {
	new (...args: unknown[]): unknown;
}

export interface DocumentSheetConfigLike {
	registerSheet: (documentClass: unknown, scope: string, sheetClass: unknown, options: Record<string, unknown>) => void;
	unregisterSheet: (documentClass: unknown, scope: string, sheetClass?: unknown) => void;
}

export interface CombatLike {
	combatants: Array<{
		id: string;
		actor?: ActorLike;
		update?: (data: Record<string, unknown>) => Promise<unknown>;
	}>;
	rollInitiative: (ids: string[], options?: Record<string, unknown>) => Promise<unknown>;
}

export interface FoundryConstants {
	GRID_TYPES?: { HEXODD?: number };
	TOKEN_DISPLAY_MODES?: Record<string, number>;
}

export interface DialogV2Ctor {
	new (options: {
		window: { title: string };
		content: string;
		buttons: Array<{
			label: string;
			action: string;
			default?: boolean;
			callback?: (...args: unknown[]) => void;
		}>;
	}): { render: (force: boolean) => void };
}

export interface DialogCtor {
	new (
		options: {
			title: string;
			content: string;
			buttons: Record<
				string,
				{
					label: string;
					callback?: (...args: unknown[]) => void;
				}
			>;
			default?: string;
		},
		config?: { jQuery: boolean },
	): { render: (force: boolean) => void };
}

export interface FoundryRoll {
	evaluate(): Promise<void>;
	toMessage(options: { speaker?: { alias?: string }; flavor?: string }): Promise<void>;
	total: number;
	terms: Array<{ results?: Array<{ result: number }> }>;
	formula: string;
}

export interface FoundryRollCtor {
	create(formula: string): Promise<FoundryRoll>;
}

export interface FoundryChatMessage {
	create(data: { content: string; speaker?: { alias?: string } }): Promise<unknown>;
}

// Core Foundry global types for type-safe access
interface FoundryGlobals {
	game?: GameLike;
	ui?: UILike;
	Hooks?: HooksLike;
	Actors?: { contents?: ActorLike[] };
	Actor?: { create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<ActorLike> };
	Scene?: { create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<SceneLike> };
	CONST?: FoundryConstants;
	Combat?: { new (...args: unknown[]): CombatLike; prototype: CombatLike };
	Dialog?: DialogCtor;
	Roll?: FoundryRollCtor;
	ChatMessage?: FoundryChatMessage;
	foundry?: {
		applications?: {
			api?: {
				ApplicationV2?: unknown;
				HandlebarsApplicationMixin?: (base: unknown) => unknown;
				DialogV2?: DialogV2Ctor;
			};
			apps?: {
				DocumentSheetConfig?: DocumentSheetConfigLike;
			};
			sheets?: {
				ActorSheet?: { new (...args: unknown[]): unknown };
			};
		};
		appv1?: {
			sheets?: {
				ActorSheet?: ActorSheetBaseCtor;
			};
		};
		canvas?: {
			placeables?: {
				Token?: { prototype: TokenLike & { _onClickLeft2: (event: unknown) => void } };
			};
		};
	};
	ActorSheet?: ActorSheetBaseCtor;
	DocumentSheetConfig?: DocumentSheetConfigLike;
	Handlebars?: {
		registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
	};
}

// Safe global access with type checking
function getFoundryGlobals(): FoundryGlobals {
	return (globalThis as unknown as FoundryGlobals) ?? {};
}

// Type-safe accessor functions with proper error handling
export function getHooks(): HooksLike {
	const globals = getFoundryGlobals();
	return globals.Hooks ?? {};
}

export function getActors(): { contents?: ActorLike[] } {
	const globals = getFoundryGlobals();
	return globals.Actors ?? {};
}

export function getActorSheetBaseCtor(): ActorSheetBaseCtor {
	const globals = getFoundryGlobals();
	const ns = globals.foundry?.appv1?.sheets?.ActorSheet;
	return (ns || globals.ActorSheet) as ActorSheetBaseCtor;
}

export function getActorSheetV2Ctor(): { new (...args: unknown[]): unknown } | undefined {
	const globals = getFoundryGlobals();
	return globals.foundry?.applications?.sheets?.ActorSheet;
}

export function getGame(): GameLike {
	const globals = getFoundryGlobals();
	return globals.game ?? {};
}

export function getUI(): UILike {
	const globals = getFoundryGlobals();
	return globals.ui ?? {};
}

export function getActorById(id: string): ActorLike | undefined {
	const globals = getFoundryGlobals();
	return globals.game?.actors?.get?.(id);
}

export function getActorCtor(): {
	create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<ActorLike>;
} {
	const globals = getFoundryGlobals();
	return (
		globals.Actor ?? {
			create: async () => {
				throw new Error('Actor constructor not available');
			},
		}
	);
}

export function getDocumentSheetConfig(): DocumentSheetConfigLike {
	const globals = getFoundryGlobals();
	const ns = globals.foundry?.applications?.apps?.DocumentSheetConfig;
	return (ns || globals.DocumentSheetConfig) as DocumentSheetConfigLike;
}

export function getSceneCtor(): {
	create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<SceneLike>;
} {
	const globals = getFoundryGlobals();
	return (
		globals.Scene ?? {
			create: async () => {
				throw new Error('Scene constructor not available');
			},
		}
	);
}

export function getConst(): FoundryConstants | undefined {
	const globals = getFoundryGlobals();
	return globals.CONST;
}

export async function createTokenInScene(scene: SceneLike, tokenData: Record<string, unknown>): Promise<unknown> {
	const docs = await scene.createEmbeddedDocuments?.('Token', [tokenData]);
	return docs?.[0];
}

export function getDialogV2Ctor(): DialogV2Ctor | undefined {
	const globals = getFoundryGlobals();
	return globals.foundry?.applications?.api?.DialogV2;
}

export function getDialogCtor(): DialogCtor | undefined {
	const globals = getFoundryGlobals();
	return globals.Dialog;
}

export function getRollCtor(): FoundryRollCtor {
	const globals = getFoundryGlobals();
	return (
		globals.Roll ?? {
			create: async () => {
				throw new Error('Roll constructor not available');
			},
		}
	);
}

export function getChatMessage(): FoundryChatMessage {
	const globals = getFoundryGlobals();
	return (
		globals.ChatMessage ?? {
			create: async () => {
				throw new Error('ChatMessage not available');
			},
		}
	);
}

export async function confirmAction({ title, message }: { title: string; message: string }): Promise<boolean> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Ctor();
		if (DialogV2) {
			try {
				const content = `<div><p>${message}</p></div>`;
				const dialog = new DialogV2({
					window: { title },
					content,
					buttons: [
						{
							label: 'Yes',
							action: 'yes',
							default: false,
							callback: () => resolve(true),
						},
						{
							label: 'No',
							action: 'no',
							default: true,
							callback: () => resolve(false),
						},
					],
				});
				dialog.render(true);
				return;
			} catch {
				// Fall back to legacy Dialog below
			}
		}
		const Dialog = getDialogCtor();
		if (Dialog) {
			const content = `<div><p>${message}</p></div>`;
			const dialog = new Dialog(
				{
					title,
					content,
					buttons: {
						yes: {
							label: 'Yes',
							callback: () => resolve(true),
						},
						no: {
							label: 'No',
							callback: () => resolve(false),
						},
					},
					default: 'no',
				},
				{ jQuery: true },
			);
			dialog.render(true);
			return;
		}
		resolve(false);
	});
}

export async function promptText({ title, label }: { title: string; label: string }): Promise<string | null> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Ctor();
		if (DialogV2) {
			try {
				const content = `<form><div class="form-group"><label>${label}</label><input type="text" name="text" autofocus /></div></form>`;
				const dialog = new DialogV2({
					window: { title },
					content,
					buttons: [
						{
							label: 'OK',
							action: 'ok',
							default: true,
							callback: (_ev: unknown, _button: unknown, instance: unknown) => {
								try {
									const htmlElement = instance as {
										element?: { querySelector?: (selector: string) => HTMLInputElement | null };
									};
									const input: HTMLInputElement | null =
										htmlElement?.element?.querySelector?.('input[name="text"]') ?? null;
									const value = input?.value ?? '';
									resolve(value.trim() ? value.trim() : null);
								} catch {
									resolve(null);
								}
							},
						},
						{ label: 'Cancel', action: 'cancel', callback: () => resolve(null) },
					],
				});
				dialog.render(true);
				return;
			} catch {
				// Fall back to legacy Dialog below
			}
		}
		const Dialog = getDialogCtor();
		if (Dialog) {
			const content = `<form><div class="form-group"><label>${label}</label><input type="text" name="text" autofocus /></div></form>`;
			const dialog = new Dialog(
				{
					title,
					content,
					buttons: {
						ok: {
							label: 'OK',
							callback: (html: unknown) => {
								try {
									const htmlJQuery = html as { find?: (selector: string) => { val?: () => string | undefined } };
									const value: string | undefined = htmlJQuery?.find?.('input[name="text"]')?.val?.() ?? undefined;
									resolve(value && value.trim() ? value.trim() : null);
								} catch {
									resolve(null);
								}
							},
						},
						cancel: { label: 'Cancel', callback: () => resolve(null) },
					},
					default: 'ok',
				},
				{ jQuery: true },
			);
			dialog.render(true);
			return;
		}
		resolve(null);
	});
}

export function getApplicationV2Ctor(): unknown {
	const globals = getFoundryGlobals();
	return globals.foundry?.applications?.api?.ApplicationV2;
}

export function getHandlebarsApplicationMixin(): ((base: unknown) => unknown) | undefined {
	const globals = getFoundryGlobals();
	const mixin = globals.foundry?.applications?.api?.HandlebarsApplicationMixin;
	return (typeof mixin === 'function' ? mixin : undefined) as ((base: unknown) => unknown) | undefined;
}

export function getTokenObjectCtor(): { prototype: TokenLike & { _onClickLeft2: (event: unknown) => void } } {
	const globals = getFoundryGlobals();
	const ctor = globals.foundry?.canvas?.placeables?.Token;
	if (!ctor) throw new Error('Token class not found at foundry.canvas.placeables.Token');
	return ctor;
}

export function getTokenDisplayModes(): {
	NONE: number;
	CONTROL: number;
	OWNER: number;
	HOVER: number;
	ALWAYS: number;
} {
	const foundryConst = getConst()?.TOKEN_DISPLAY_MODES;

	return {
		NONE: foundryConst?.NONE ?? 0,
		CONTROL: foundryConst?.CONTROL ?? 10,
		OWNER: foundryConst?.OWNER ?? 20,
		HOVER: foundryConst?.HOVER ?? 30,
		ALWAYS: foundryConst?.ALWAYS ?? 40,
	};
}

export function getCombatCtor(): { new (...args: unknown[]): CombatLike; prototype: CombatLike } | undefined {
	const globals = getFoundryGlobals();
	return globals.Combat;
}

export function getHandlebars():
	| {
			registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
	  }
	| undefined {
	const globals = getFoundryGlobals();
	return globals.Handlebars;
}

export function getActorConstructor(): { new (...args: unknown[]): unknown } {
	const globals = getFoundryGlobals();
	return (
		(globals as unknown as { Actor: { new (...args: unknown[]): unknown } }).Actor ?? {
			new: () => {
				throw new Error('Actor constructor not available');
			},
		}
	);
}

// Helper functions for safe UI operations
export function showNotification(type: 'info' | 'warn' | 'error', message: string): void {
	const ui = getUI();
	ui.notifications?.[type]?.(message);
}
