import { getDialogV2Factory } from '../foundry-shim';

export async function confirmAction({ title, message }: { title: string; message: string }): Promise<boolean> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Factory();
		const content = `<div><p>${message}</p></div>`;
		const dialog = new DialogV2({
			window: { title },
			content,
			buttons: [
				{
					label: 'Yes',
					action: 'yes',
					default: false,
					callback: () => resolve(true),
				},
				{
					label: 'No',
					action: 'no',
					default: true,
					callback: () => resolve(false),
				},
			],
			close: () => resolve(false),
		});
		dialog.render(true);
	});
}

export async function promptText({ title, label }: { title: string; label: string }): Promise<string | null> {
	return new Promise(resolve => {
		const DialogV2 = getDialogV2Factory();
		const content = `<form><div class="form-group"><label>${label}</label><input type="text" name="text" autofocus /></div></form>`;
		const dialog = new DialogV2({
			window: { title },
			content,
			buttons: [
				{
					label: 'OK',
					action: 'ok',
					default: true,
					callback: (_ev: unknown, _button: unknown, instance: unknown) => {
						try {
							const htmlElement = instance as {
								element?: { querySelector?: (selector: string) => HTMLInputElement | null };
							};
							const input: HTMLInputElement | null =
								htmlElement?.element?.querySelector?.('input[name="text"]') ?? null;
							const value = input?.value ?? '';
							resolve(value.trim() ? value.trim() : null);
						} catch {
							resolve(null);
						}
					},
				},
				{ label: 'Cancel', action: 'cancel', callback: () => resolve(null) },
			],
		});
		dialog.render(true);
	});
}
