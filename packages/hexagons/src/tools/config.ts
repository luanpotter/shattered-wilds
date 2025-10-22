import { HexagonsSettings } from '../utils/settings';

export const ConfigModal = {
	open(): void {
		const currentColor = HexagonsSettings.get('lineColor');
		new Dialog({
			title: 'Hexagons Configuration',
			content: `<form>
				<div class="form-group">
					<label for="hexagons-line-color">Line Color</label>
					<input type="color" id="hexagons-line-color" name="lineColor" value="${currentColor}">
				</div>
			</form>`,
			buttons: {
				save: {
					icon: '<i class="fas fa-check"></i>',
					label: 'Save',
					callback: (html: JQuery) => {
						const color = html.find('#hexagons-line-color').val() as string;
						HexagonsSettings.set('lineColor', color);
					},
				},
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'Cancel',
				},
			},
			default: 'save',
		}).render(true);
	},
};
