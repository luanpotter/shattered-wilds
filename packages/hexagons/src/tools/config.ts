import { HexagonsSettings } from '../utils/settings';

export const ConfigModal = {
	open(): void {
		const currentColor = HexagonsSettings.get('lineColor');
		new foundry.applications.api.DialogV2({
			window: {
				title: 'Hexagons Configuration',
				icon: 'fas fa-gear',
			},
			content: `<div class="form-group" style="width: 320px;">
				<label for="hexagons-line-color">Line Color</label>
				<input type="color" id="hexagons-line-color" name="lineColor" value="${currentColor}">
			</div>`,
			buttons: [
				{
					icon: '<i class="fas fa-check"></i>',
					label: 'Save',
					action: 'save',
					callback: (_, button: HTMLButtonElement): void => {
						const form = button.closest('form') as HTMLFormElement;
						const colorInput = form.lineColor as HTMLInputElement;
						const color = colorInput.value;
						HexagonsSettings.set('lineColor', color);
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
