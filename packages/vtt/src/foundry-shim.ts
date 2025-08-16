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

export function getHooks(): { once(event: 'init' | 'ready', fn: () => void): void } {
	return (globalThis as any).Hooks;
}

export function getActorsManager(): ActorsManagerLike {
	return (globalThis as any).Actors;
}

export function getActorSheetBase(): ActorSheetBaseCtor {
	const ns = (globalThis as any).foundry?.appv1?.sheets?.ActorSheet;
	return (ns || (globalThis as any).ActorSheet) as ActorSheetBaseCtor;
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
