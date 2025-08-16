import { getActorSheetV2, getActorById, getUI } from './foundry-shim.js';
import { exportActorPropsToShareString, importActorPropsFromShareString } from './actor-io.js';

const V2Base = getActorSheetV2() as unknown as (new (...args: unknown[]) => object) & {
	DEFAULT_OPTIONS?: Record<string, unknown>;
};

export class SWActorSheetV2 extends (V2Base as new (...args: unknown[]) => object) {
	#actorId: string | undefined;

	static get DEFAULT_OPTIONS() {
		const base = (V2Base as { DEFAULT_OPTIONS?: Record<string, unknown> }).DEFAULT_OPTIONS ?? {};
		return { ...base, window: { title: 'Shattered Wilds' } } as Record<string, unknown>;
	}

	static PARTS = {
		content: { template: 'systems/shattered-wilds/templates/actor-sheet.html' },
	};

	async _prepareContext(): Promise<Record<string, unknown>> {
		const actorLike = (this as unknown as { actor?: { id?: string } }).actor;
		this.#actorId = actorLike?.id;
		const actor = (this.#actorId && getActorById(this.#actorId)) || { id: this.#actorId, name: 'Unknown', flags: {} };
		return { actor, flags: actor.flags ?? {} };
	}

	async _onRender(): Promise<void> {
		const root = (this as unknown as { element?: HTMLElement }).element ?? undefined;
		if (!root || !this.#actorId) return;
		const importBtn = root.querySelector('[data-action="sw-import"]') as HTMLButtonElement | null;
		if (importBtn) {
			importBtn.addEventListener('click', async () => {
				const actor = getActorById(this.#actorId!) as unknown as {
					update: (d: Record<string, unknown>) => Promise<unknown>;
				};
				if (!actor?.update) return getUI().notifications?.warn('Actor not found');
				await importActorPropsFromShareString(actor);
			});
		}
		const exportBtn = root.querySelector('[data-action="sw-export"]') as HTMLButtonElement | null;
		if (exportBtn) {
			exportBtn.addEventListener('click', async () => {
				const actor = getActorById(this.#actorId!) as unknown as { flags?: Record<string, unknown> };
				if (!actor) return getUI().notifications?.warn('Actor not found');
				const share = exportActorPropsToShareString(actor as { flags?: Record<string, unknown> });
				await navigator.clipboard.writeText(share);
				getUI().notifications?.info('Share string copied to clipboard');
			});
		}
	}
}
