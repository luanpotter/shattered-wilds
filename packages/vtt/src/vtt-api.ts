import {
	createTokenInScene,
	getActorCtor,
	getConst,
	getGame,
	getSceneCtor,
	SceneLike,
	GameLike,
} from './foundry-shim.js';

export async function createHexScene(params?: { name?: string; gridSize?: number }) {
	const name = params?.name ?? 'Shattered Wilds Hex Map';
	const gridSize = params?.gridSize ?? 100;

	// Foundry v13 hex grid type constant
	const gridType = getConst()?.GRID_TYPES?.HEXODD ?? 2;

	const sceneData: Record<string, unknown> = {
		name,
		width: 4000,
		height: 3000,
		padding: 0.25,
		grid: {
			size: gridSize,
			type: gridType,
		},
	};

	const scene = await getSceneCtor().create(sceneData, { render: true });
	return scene;
}

export async function createCharacterWithToken(params: { name: string; sceneId?: string; x?: number; y?: number }) {
	const actor = await getActorCtor().create({ name: params.name, type: 'character' });
	const game = getGame() as GameLike;
	const scenes = game.scenes;
	const targetScene: SceneLike | undefined = params.sceneId
		? scenes?.get?.(params.sceneId)
		: (scenes?.active ?? scenes?.contents?.[0]);

	if (!targetScene) return { actor, token: null as unknown };

	const x = params.x ?? 100;
	const y = params.y ?? 100;

	const tokenData = {
		name: actor.name,
		actorId: actor.id,
		actorLink: true, // Ensure token is linked to actor
		x,
		y,
		disposition: 1,
	};

	const tokenDoc = await createTokenInScene(targetScene, tokenData);
	return { actor, token: tokenDoc };
}
