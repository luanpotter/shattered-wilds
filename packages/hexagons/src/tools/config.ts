import { HexagonsSettings } from '../utils/settings';

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
					callback: (_, button: HTMLButtonElement): void => {
						const form = button.closest('form') as HTMLFormElement;

						const lineColorInput = form.lineColor as HTMLInputElement;
						const lineColor = lineColorInput.value;
						HexagonsSettings.set('lineColor', lineColor);

						const fillColorInput = form.fillColor as HTMLInputElement;
						const fillColor = fillColorInput.value;
						HexagonsSettings.set('fillColor', fillColor);
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
