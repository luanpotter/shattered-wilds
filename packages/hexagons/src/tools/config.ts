import { isHexagonsDrawing } from '../utils/drawings';
import { HexagonsSettings } from '../utils/settings';
import { SelectTool } from './select';

export const ConfigModal = {
	open(): void {
		const lineColor = HexagonsSettings.get('lineColor');
		const fillColor = HexagonsSettings.get('fillColor');
		const lineWidth = HexagonsSettings.get('lineWidth');
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
				<label for="hexagons-line-width">Line Width</label>
				<input type="number" id="hexagons-line-width" name="lineWidth" value="${lineWidth}" min="1" step="0.5">
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

						const lineWidthInput = form.lineWidth as HTMLInputElement;
						const lineWidth = sanitizeLineWidth(lineWidthInput.value);
						HexagonsSettings.set('lineWidth', lineWidth);

						const fillColorInput = form.fillColor as HTMLInputElement;
						const fillColor = fillColorInput.value;
						HexagonsSettings.set('fillColor', fillColor);

						await updateSelectedDrawings({ lineColor, fillColor, lineWidth });
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

const sanitizeLineWidth = (value: string): number => {
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return 1;
	}
	return parsed;
};

const updateSelectedDrawings = async ({
	lineColor,
	fillColor,
	lineWidth,
}: {
	lineColor: string;
	fillColor: string;
	lineWidth: number;
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
			updateData.strokeWidth = lineWidth;
			shouldUpdate = true;
		}
		if (isFilledHex(drawing)) {
			updateData.strokeColor = fillColor;
			updateData.fillColor = fillColor;
			updateData.strokeWidth = lineWidth;
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
