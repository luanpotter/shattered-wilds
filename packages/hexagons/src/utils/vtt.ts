import { FederatedPointerEvent } from 'pixi.js';

export const rerenderSceneControls = (): void => {
	ui.controls?.render({ force: true });
};

export const isHexGrid = (): boolean => {
	const gridType = canvas?.grid?.type;
	if (typeof gridType !== 'number') {
		return false;
	}

	const hexTypes = new Set<number>([
		CONST.GRID_TYPES.HEXEVENQ,
		CONST.GRID_TYPES.HEXEVENR,
		CONST.GRID_TYPES.HEXODDQ,
		CONST.GRID_TYPES.HEXODDR,
	]);

	return hexTypes.has(gridType);
};

export const toScenePosition = (event: FederatedPointerEvent): PIXI.Point | null => {
	const stage = canvas?.stage;
	if (!stage) {
		return null;
	}

	const globalPoint = event?.global ?? { x: event?.clientX, y: event?.clientY };
	const point = new PIXI.Point(globalPoint.x, globalPoint.y);
	return stage.worldTransform.applyInverse(point, point);
};
