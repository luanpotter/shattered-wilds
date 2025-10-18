// Foundry VTT type definitions and safe access layer

export interface Renderable {
	render(force?: boolean): Promise<void>;
}

export interface ActorLike {
	id: string;
	name: string;
	type: string;
	getActiveTokens?: () => TokenLike[];
	token?: TokenLike;
	sheet?: Renderable;
	system?: { resources?: Record<string, { value: number; max: number }> };

	update?: (data: Record<string, unknown>) => Promise<void>;

	flags?: Record<string, unknown>;
	getFlag?: (scope: string, key: string) => void;
	setFlag: (scope: string, key: string, value: unknown) => Promise<void>;
	unsetFlag?: (scope: string, key: string) => Promise<void>;

	statuses: Set<string>;
	toggleStatusEffect: (statusId: string, options?: { active?: boolean }) => Promise<boolean>;
}

export interface TokenLike {
	id: string;
	name: string;
	actor?: ActorLike;
	document?: {
		update?: (data: Record<string, unknown>) => Promise<void>;
		actor?: ActorLike;
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
	GRID_TYPES: {
		GRIDLESS: 0;
		HEXEVENQ: 5;
		HEXEVENR: 3;
		HEXODDQ: 4;
		HEXODDR: 2;
		SQUARE: 1;
	};
	TOKEN_DISPLAY_MODES: {
		ALWAYS: 50;
		CONTROL: 10;
		HOVER: 30;
		NONE: 0;
		OWNER: 40;
		OWNER_HOVER: 20;
	};
}

export interface DialogButton {
	label: string;
	action: string;
	default?: boolean;
	callback?: (...args: unknown[]) => void;
}

export interface DialogOptions {
	window: { title: string };
	content: string;
	buttons: Array<DialogButton>;
	close?: () => void;
}

export interface DialogV2Factory {
	new (options: DialogOptions): Renderable;
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
		registerHelper(name: string, fn: (...args: unknown[]) => unknown): Promise<void>;
		registerPartial(name: string, template: string): Promise<void>;
	};
}

export const Foundry = globalThis as unknown as FoundryGlobals;

export function getActorById(id: string): ActorLike | undefined {
	return Foundry.game.actors.get(id);
}

export function getDocumentSheetConfig(): DocumentSheetConfigLike {
	return Foundry.foundry.applications.apps.DocumentSheetConfig;
}

export function getDialogV2Factory(): DialogV2Factory {
	return Foundry.foundry.applications.api.DialogV2;
}

export function getHandlebarsApplicationMixin(): HandlebarsApplicationMixinFn {
	const mixin = Foundry.foundry.applications.api.HandlebarsApplicationMixin;
	return (typeof mixin === 'function' ? mixin : undefined) as HandlebarsApplicationMixinFn;
}

/**
 * Creates a properly typed base class for Handlebars ApplicationV2 modals/apps.
 * This eliminates the need for unsafe type casting in modal implementations.
 *
 * @returns A typed base class that can be extended
 */
export function createHandlebarsApplicationBase(): (new (
	options?: Record<string, unknown>,
) => HandlebarsApplicationBase) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
} {
	const ApplicationV2 = Foundry.foundry.applications.api.ApplicationV2;
	const HbsMixin = getHandlebarsApplicationMixin();

	return HbsMixin(ApplicationV2) as (new (options?: Record<string, unknown>) => HandlebarsApplicationBase) & {
		DEFAULT_OPTIONS?: Record<string, unknown>;
	};
}

/**
 * Creates a properly typed base class for Handlebars ActorSheetV2.
 * This eliminates the need for unsafe type casting in actor sheet implementations.
 *
 * @returns A typed base class that can be extended
 */
export function createHandlebarsActorSheetBase(): (new (...args: unknown[]) => HandlebarsActorSheetBase) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
} {
	const ActorSheetV2 = Foundry.foundry.applications.sheets.ActorSheet;
	const HbsMixin = getHandlebarsApplicationMixin();

	return HbsMixin(ActorSheetV2) as (new (...args: unknown[]) => HandlebarsActorSheetBase) & {
		DEFAULT_OPTIONS?: Record<string, unknown>;
	};
}

export function getTokenObjectFactory(): TokenFactory {
	return Foundry.foundry.canvas.placeables.Token;
}

export function showNotification(type: 'info' | 'warn' | 'error', message: string): void {
	Foundry.ui.notifications[type]?.(message);
}
