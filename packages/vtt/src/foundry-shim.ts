// Centralized minimal typings and accessors for Foundry's globals.
// This isolates unsafe 'any' usage to this file only.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type SceneLike = {
	createEmbeddedDocuments?: (collection: string, docs: any[]) => Promise<any[]>;
};

export type GameLike = {
	scenes?: {
		get(id: string): SceneLike | undefined;
		active?: SceneLike;
		contents?: SceneLike[];
	};
	actors?: {
		get(id: string): { id?: string; name?: string; flags?: Record<string, unknown> } | undefined;
	};
};

export type ActorsManagerLike = {
	unregisterSheet: (namespace: string, sheet: unknown) => void;
	registerSheet: (namespace: string, sheet: unknown, options: { types: string[]; makeDefault?: boolean }) => void;
};

export type HeaderButton = { class: string; label: string; icon: string; onclick: () => void };

export type ActorSheetBaseCtor = {
	new (...args: unknown[]): { _getHeaderButtons: () => HeaderButton[] };
	defaultOptions: unknown;
};

export function getHooks(): {
	once(event: 'init' | 'ready', fn: () => void): void;
	on?(event: string, fn: (...args: any[]) => void): void;
} {
	return (globalThis as any).Hooks;
}

export function getActorsManager(): ActorsManagerLike {
	return (globalThis as any).Actors;
}

export function getActorSheetBase(): ActorSheetBaseCtor {
	const ns = (globalThis as any).foundry?.appv1?.sheets?.ActorSheet;
	return (ns || (globalThis as any).ActorSheet) as ActorSheetBaseCtor;
}

export function getActorSheetV2(): ActorSheetBaseCtor | undefined {
	// Prefer v2 sheets namespace if available
	const v2 = (globalThis as any).foundry?.applications?.sheets?.ActorSheet;
	return (v2 as ActorSheetBaseCtor | undefined) ?? undefined;
}

export function getGame(): GameLike {
	return (globalThis as any).game as GameLike;
}

export function getUI(): {
	notifications?: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
} {
	return (globalThis as any).ui as {
		notifications?: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
	};
}

export function getActorById(id: string): { id?: string; name?: string; flags?: Record<string, unknown> } | undefined {
	return (globalThis as any).game?.actors?.get?.(id);
}

export function getActorCtor(): {
	create(data: { name: string; type: string }): Promise<{ id: string; name: string }>;
} {
	return (globalThis as any).Actor;
}

export function getDocumentSheetConfig(): {
	registerSheet: (documentClass: unknown, scope: string, sheetClass: unknown, options: Record<string, unknown>) => void;
	unregisterSheet: (documentClass: unknown, scope: string, sheetClass?: unknown) => void;
} {
	const ns = (globalThis as any).foundry?.applications?.apps?.DocumentSheetConfig;
	return (ns || (globalThis as any).DocumentSheetConfig) as {
		registerSheet: (
			documentClass: unknown,
			scope: string,
			sheetClass: unknown,
			options: Record<string, unknown>,
		) => void;
		unregisterSheet: (documentClass: unknown, scope: string, sheetClass?: unknown) => void;
	};
}

export function getSceneCtor(): {
	create(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<SceneLike>;
} {
	return (globalThis as any).Scene;
}

export function getConst(): { GRID_TYPES?: { HEXODD?: number } } | undefined {
	return (globalThis as any).CONST;
}

export async function createTokenInScene(scene: SceneLike, tokenData: Record<string, unknown>): Promise<unknown> {
	const docs = await (scene as any).createEmbeddedDocuments?.('Token', [tokenData]);
	return docs?.[0];
}

export function getDialogV2Ctor(): any {
	return (globalThis as any).foundry?.applications?.api?.DialogV2;
}

export function getDialogCtor(): any {
	return (globalThis as any).Dialog;
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
							callback: (_ev: unknown, _button: unknown, instance: any) => {
								try {
									const input: HTMLInputElement | null =
										instance?.element?.querySelector?.('input[name="text"]') ?? null;
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
							callback: (html: any) => {
								try {
									const value: string | undefined =
										(html?.find?.('input[name="text"]').val?.() as string | undefined) ?? undefined;
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
	return (globalThis as any).foundry?.applications?.api?.ApplicationV2;
}

export function getHandlebarsApplicationMixin(): ((base: unknown) => unknown) | undefined {
	const mixin = (globalThis as any).foundry?.applications?.api?.HandlebarsApplicationMixin;
	return (typeof mixin === 'function' ? mixin : undefined) as ((base: unknown) => unknown) | undefined;
}

export type TokenLike = {
	document?: { actorId?: string };
	actor?: { id?: string };
};

export function getTokenObjectCtor(): { prototype: TokenLike & { _onClickLeft2: (event: unknown) => void } } {
	const ctor = (globalThis as any).foundry?.canvas?.placeables?.Token as
		| { prototype: TokenLike & { _onClickLeft2: (event: unknown) => void } }
		| undefined;
	if (!ctor) throw new Error('Token class not found at foundry.canvas.placeables.Token');
	return ctor;
}
