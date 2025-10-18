// Foundry VTT type definitions and safe access layer

export interface Renderable {
	render(force?: boolean): Promise<void>;
}

export interface ActorLike {
	id: string;
	name: string;
	type: string;
	flags?: Record<string, unknown>;
	update?: (data: Record<string, unknown>) => Promise<void>;
	getFlag?: (scope: string, key: string) => void;
	setFlag: (scope: string, key: string, value: unknown) => Promise<void>;
	unsetFlag?: (scope: string, key: string) => Promise<void>;
	getActiveTokens?: () => TokenLike[];
	token?: TokenLike;
	sheet?: Renderable;
}

export interface TokenLike {
	id: string;
	name: string;
	actor?: ActorLike;
	document?: {
		update?: (data: Record<string, unknown>) => Promise<void>;
		actorId?: string;
		actorLink?: boolean;
	};
	_onClickLeft2: (event: unknown) => void;
}

export interface TokenDocumentLike {
	actor?: ActorLike;
	actorId?: string;
	actorLink?: boolean;
	update?: (data: Record<string, unknown>) => Promise<unknown>;
}

export interface SceneLike {
	id: string;
	name: string;
	active?: boolean;
	createEmbeddedDocuments?: (type: string, data: unknown[]) => Promise<unknown[]>;
}

export interface GameLike {
	actors: {
		get: (id: string) => ActorLike | undefined;
		contents: ActorLike[];
	};
	scenes: {
		get: (id: string) => SceneLike | undefined;
		active?: SceneLike;
		contents: SceneLike[];
	};
	user?: {
		id: string;
		name: string;
	};
}

export interface HooksLike {
	on: (event: string, callback: (...args: unknown[]) => unknown) => void;
	once: (event: string, callback: (...args: unknown[]) => unknown) => void;
	call: (event: string, ...args: unknown[]) => unknown;
}

export interface WindowLike extends Renderable {
	actor?: { id?: string };
	token?: { actor?: { id?: string } };
}

export interface UILike {
	notifications: {
		info?: (message: string) => void;
		warn?: (message: string) => void;
		error?: (message: string) => void;
	};
	windows: Record<string, WindowLike>;
}

export interface ActorSheetBaseFactory {
	new (...args: unknown[]): unknown;
}

export interface DocumentSheetConfigLike {
	registerSheet: (documentClass: unknown, scope: string, sheetClass: unknown, options: Record<string, unknown>) => void;
	unregisterSheet: (documentClass: unknown, scope: string, sheetClass?: unknown) => void;
}

export interface ApplicationV2Instance {
	close(): void;
	element?: HTMLElement;
	render(force?: boolean): Promise<void>;
}

export interface HandlebarsApplicationV2Instance extends ApplicationV2Instance {
	_prepareContext?(): Promise<Record<string, unknown>>;
	_onRender?(): Promise<void>;
}

export interface ApplicationV2Factory {
	new (options?: Record<string, unknown>): ApplicationV2Instance;
	DEFAULT_OPTIONS?: Record<string, unknown>;
}

export interface ActorSheetV2Factory extends ApplicationV2Factory {
	new (...args: unknown[]): unknown;
}

export type HandlebarsApplicationMixinFn = <T extends ApplicationV2Factory>(
	base: T,
) => T & {
	new (options?: Record<string, unknown>): HandlebarsApplicationV2Instance;
};

export interface HandlebarsApplicationBase extends ApplicationV2Instance {
	_prepareContext?(): Promise<Record<string, unknown>>;
	_onRender?(): Promise<void>;
}

export interface HandlebarsActorSheetBase extends HandlebarsApplicationBase {
	actor: ActorLike;
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

export interface DialogV2Factory {
	new (options: {
		window: { title: string };
		content: string;
		buttons: Array<{
			label: string;
			action: string;
			default?: boolean;
			callback?: (...args: unknown[]) => void;
		}>;
		close?: () => void;
	}): Renderable;
}

export interface CombatFactory {
	new (...args: unknown[]): CombatLike;
	prototype: CombatLike;
}

export interface DialogFactory {
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
			close?: () => void;
		},
		config?: { jQuery: boolean },
	): Renderable;
}

export interface FoundryRoll {
	evaluate(): Promise<void>;
	toMessage(options: { speaker?: { alias?: string }; flavor?: string }): Promise<void>;
	total: number;
	terms: Array<{ results?: Array<{ result: number }> }>;
	formula: string;
}

export interface FoundryRollFactory {
	create(formula: string): Promise<FoundryRoll>;
}

export interface FoundryChatMessage {
	create(data: { content: string; speaker?: { alias?: string } }): Promise<unknown>;
}

export interface StatusEffectLike {
	id: string;
	name: string;
	img?: string;
	description?: string;
}

export interface ActorFactory {
	create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<ActorLike>;
}

export interface SceneFactory {
	create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<SceneLike>;
}

export interface FoundryConfig {
	statusEffects?: Array<StatusEffectLike>;
}

export interface Handlebars {
	registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
}

export interface TokenFactory {
	prototype: TokenLike;
}

// Core Foundry global types for type-safe access
interface FoundryGlobals {
	game: GameLike;
	ui: UILike;
	Hooks: HooksLike;
	Actor: ActorFactory;
	Scene: SceneFactory;
	CONST: FoundryConstants;
	Combat: CombatFactory;
	Dialog: DialogFactory;
	Roll: FoundryRollFactory;
	ChatMessage: FoundryChatMessage;
	foundry: {
		documents: {
			collections: {
				Actors: { contents: ActorLike[] };
			};
		};
		applications: {
			api: {
				ApplicationV2: ApplicationV2Factory;
				HandlebarsApplicationMixin: (base: unknown) => unknown;
				DialogV2: DialogV2Factory;
			};
			apps: {
				DocumentSheetConfig: DocumentSheetConfigLike;
			};
			sheets: {
				ActorSheet: ActorSheetV2Factory;
			};
		};
		canvas: {
			placeables: {
				Token: TokenFactory;
			};
		};
	};
	CONFIG: FoundryConfig;
	ActorSheet: ActorSheetBaseFactory;
	DocumentSheetConfig: DocumentSheetConfigLike;
	Handlebars: {
		registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
	};
}

export const Foundry = globalThis as unknown as FoundryGlobals;

export function getActors(): { contents?: ActorLike[] } {
	return Foundry.foundry?.documents?.collections?.Actors;
}

function getActorSheetV2Factory(): ActorSheetV2Factory {
	return Foundry.foundry.applications.sheets.ActorSheet;
}

function getUI(): UILike {
	return Foundry.ui;
}

export function getActorById(id: string): ActorLike | undefined {
	return Foundry.game.actors.get(id);
}

export function getFoundryConfig(): FoundryConfig {
	return Foundry.CONFIG;
}

export function getDocumentSheetConfig(): DocumentSheetConfigLike {
	return Foundry.foundry.applications.apps.DocumentSheetConfig;
}

export function getSceneFactory(): SceneFactory {
	return Foundry.Scene;
}

export function getConst(): FoundryConstants {
	return Foundry.CONST;
}

export async function createTokenInScene(scene: SceneLike, tokenData: Record<string, unknown>): Promise<unknown> {
	const docs = await scene.createEmbeddedDocuments?.('Token', [tokenData]);
	return docs?.[0];
}

export function getDialogV2Factory(): DialogV2Factory {
	return Foundry.foundry.applications.api.DialogV2;
}

export function getRollCtor(): FoundryRollFactory {
	return Foundry.Roll;
}

export function getChatMessage(): FoundryChatMessage {
	return Foundry.ChatMessage;
}

export async function confirmAction({ title, message }: { title: string; message: string }): Promise<boolean> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Factory();
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
			close: () => resolve(false),
		});
		dialog.render(true);
	});
}

export async function promptText({ title, label }: { title: string; label: string }): Promise<string | null> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Factory();
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
	});
}

export function getApplicationV2Ctor(): ApplicationV2Factory {
	const ApplicationV2 = Foundry.foundry?.applications?.api?.ApplicationV2;
	if (!ApplicationV2) {
		throw new Error('Foundry V2 ApplicationV2 class not found');
	}
	return ApplicationV2;
}

export function getHandlebarsApplicationMixin(): HandlebarsApplicationMixinFn {
	const mixin = Foundry.foundry?.applications?.api?.HandlebarsApplicationMixin;
	return (typeof mixin === 'function' ? mixin : undefined) as HandlebarsApplicationMixinFn;
}

/**
 * Creates a properly typed base class for Handlebars ApplicationV2 modals/apps.
 * This eliminates the need for unsafe type casting in modal implementations.
 *
 * @returns A typed base class that can be extended
 * @throws Error if V2 APIs aren't available
 */
export function createHandlebarsApplicationBase(): (new (
	options?: Record<string, unknown>,
) => HandlebarsApplicationBase) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
} {
	const AppV2Ctor = getApplicationV2Ctor();
	const HbsMixin = getHandlebarsApplicationMixin();

	return HbsMixin(AppV2Ctor) as (new (options?: Record<string, unknown>) => HandlebarsApplicationBase) & {
		DEFAULT_OPTIONS?: Record<string, unknown>;
	};
}

/**
 * Creates a properly typed base class for Handlebars ActorSheetV2.
 * This eliminates the need for unsafe type casting in actor sheet implementations.
 *
 * @returns A typed base class that can be extended
 * @throws Error if V2 APIs aren't available
 */
export function createHandlebarsActorSheetBase(): (new (...args: unknown[]) => HandlebarsActorSheetBase) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
} {
	const ActorSheetV2Ctor = getActorSheetV2Factory();
	const HbsMixin = getHandlebarsApplicationMixin();

	return HbsMixin(ActorSheetV2Ctor) as (new (...args: unknown[]) => HandlebarsActorSheetBase) & {
		DEFAULT_OPTIONS?: Record<string, unknown>;
	};
}

export function getTokenObjectFactory(): TokenFactory {
	return Foundry.foundry.canvas.placeables.Token;
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

export function getCombatFactory(): CombatFactory {
	return Foundry.Combat;
}

export function getHandlebars(): Handlebars {
	return Foundry.Handlebars;
}

export function showNotification(type: 'info' | 'warn' | 'error', message: string): void {
	const ui = getUI();
	ui.notifications?.[type]?.(message);
}
