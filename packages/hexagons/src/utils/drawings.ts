export const isHexagonsDrawing = (drawing: DrawingDocument) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (drawing as any).getFlag?.('hexagons', 'isHexagonsDrawing') === true;
};

export const getAllHexagonsDrawings = (): DrawingDocument[] => {
	return canvas?.scene?.drawings?.filter(drawing => isHexagonsDrawing(drawing)) ?? [];
};
