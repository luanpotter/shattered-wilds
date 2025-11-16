import { isHexagonsDrawing } from '../utils/drawings';
import { HexagonsSettings } from '../utils/settings';
import { SelectTool } from './select';

export const ConfigModal = {
	open(): void {
		const lineColor = HexagonsSettings.get('lineColor');
		const fillColor = HexagonsSettings.get('fillColor');
		new foundry.applications.api.DialogV2({
			window: {
				title: 'Hexagons Configuration',
				icon: 'fas fa-gear',
			},
			content: `
			<div class="form-group" style="width: 320px;">
				<label for="hexagons-line-color">Line Color</label>
				<input type="color" id="hexagons-line-color" name="lineColor" value="${lineColor}">
			</div>
			<div class="form-group" style="width: 320px;">
				<label for="hexagons-fill-color">Fill Color</label>
				<input type="color" id="hexagons-fill-color" name="fillColor" value="${fillColor}">
			</div>`,
			buttons: [
				{
					icon: '<i class="fas fa-check"></i>',
					label: 'Save',
					action: 'save',
					callback: async (_, button: HTMLButtonElement): Promise<void> => {
						const form = button.closest('form') as HTMLFormElement;

						const lineColorInput = form.lineColor as HTMLInputElement;
						const lineColor = lineColorInput.value;
						HexagonsSettings.set('lineColor', lineColor);

						const fillColorInput = form.fillColor as HTMLInputElement;
						const fillColor = fillColorInput.value;
						HexagonsSettings.set('fillColor', fillColor);

						await updateSelectedDrawingColors({ lineColor, fillColor });
					},
				},
				{
					icon: '<i class="fas fa-times"></i>',
					label: 'Cancel',
					action: 'cancel',
				},
			],
		}).render({ force: true });
	},
};

const updateSelectedDrawingColors = async ({
	lineColor,
	fillColor,
}: {
	lineColor: string;
	fillColor: string;
}): Promise<void> => {
	if (!canvas?.scene) {
		return;
	}
	const selectedDrawings = SelectTool.getSelectedDrawings();
	if (!selectedDrawings.length) {
		return;
	}
	const updates: ({ _id: string } & Record<string, unknown>)[] = [];
	for (const drawing of selectedDrawings) {
		if (!isHexagonsDrawing(drawing)) {
			continue;
		}
		const id = drawing.id;
		if (!id) {
			continue;
		}
		const updateData: { _id: string } & Record<string, unknown> = { _id: id };
		let shouldUpdate = false;
		if (isLineDrawing(drawing)) {
			updateData.strokeColor = lineColor;
			updateData.fillColor = lineColor;
			shouldUpdate = true;
		}
		if (isFilledHex(drawing)) {
			updateData.strokeColor = fillColor;
			updateData.fillColor = fillColor;
			shouldUpdate = true;
		}
		if (shouldUpdate) {
			updates.push(updateData);
		}
	}
	if (!updates.length) {
		return;
	}
	try {
		await canvas.scene.updateEmbeddedDocuments('Drawing', updates);
		SelectTool.refreshHighlight();
	} catch (error) {
		console.error('[hexagons] Failed to update selected drawings colors', error);
	}
};

const isLineDrawing = (drawing: DrawingDocument): boolean => {
	const shape = drawing.shape;
	return Array.isArray(shape?.points) && shape.points.length > 0 && drawing.fillType === CONST.DRAWING_FILL_TYPES.NONE;
};

const isFilledHex = (drawing: DrawingDocument): boolean => {
	const shape = drawing.shape;
	return Array.isArray(shape?.points) && shape.points.length > 0 && drawing.fillType !== CONST.DRAWING_FILL_TYPES.NONE;
};
