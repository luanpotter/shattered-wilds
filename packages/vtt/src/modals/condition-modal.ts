import { Condition, CONDITIONS, getRecordValues } from '@shattered-wilds/commons';
import { getDialogV2Factory, showNotification } from '../foundry-shim';
import { processRichText } from '../helpers/rich-text';

export const addConditionModal = async (
	existingConditions: Set<Condition>,
): Promise<{ condition?: string; rank?: number } | undefined> => {
	const availableConditions = getRecordValues(CONDITIONS)
		.filter(def => !existingConditions.has(def.name))
		.sort((a, b) => a.name.localeCompare(b.name));

	if (availableConditions.length === 0) {
		showNotification('warn', 'All conditions already applied');
		return undefined;
	}

	const options = availableConditions
		.map(def => `<option value="${def.name}">${def.name}${def.ranked ? ' ★' : ''}</option>`)
		.join('');

	const content = `
				<div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
					<div>
						<label style="display: block; margin-bottom: 4px; font-weight: bold;">Condition:</label>
						<select id="condition-select" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
							${options}
						</select>
					</div>
					<div id="rank-input-group" style="display: none;">
						<label style="display: block; margin-bottom: 4px; font-weight: bold;">Rank:</label>
						<input type="number" id="rank-input" value="1" min="0" max="10" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
					</div>
					<div id="description-box" style="padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 0.9em; max-height: 200px; overflow-y: auto; line-height: 1.4;">
						${processRichText(CONDITIONS[availableConditions[0]!.name].description)}}
					</div>
				</div>
			`;

	const Dialog = getDialogV2Factory();

	const result = await new Promise<{ condition?: string; rank?: number }>(resolve => {
		const dialogOptions = {
			window: { title: 'Add Condition' },
			content,
			buttons: [
				{
					label: 'Add',
					action: 'add',
					callback: () => {
						const selectEl = document.getElementById('condition-select') as HTMLSelectElement | null;
						const rankEl = document.getElementById('rank-input') as HTMLInputElement | null;
						if (!selectEl) {
							resolve({});
							return;
						}
						const key = selectEl.value as Condition;
						const def = CONDITIONS[key];
						resolve({
							condition: key,
							rank: def.ranked ? parseInt(rankEl?.value || '1') || 1 : 0,
						});
					},
				},
				{
					label: 'Cancel',
					action: 'cancel',
					callback: () => resolve({}),
				},
			],
		};

		const dialog = new Dialog(dialogOptions);
		dialog.render(true);

		// Setup dynamic behavior after a short delay to ensure DOM is ready
		setTimeout(() => {
			const selectEl = document.getElementById('condition-select') as HTMLSelectElement | null;
			const rankGroup = document.getElementById('rank-input-group') as HTMLDivElement | null;
			const descBox = document.getElementById('description-box') as HTMLDivElement | null;

			if (!selectEl || !rankGroup || !descBox) return;

			const updateUI = () => {
				const key = selectEl.value as Condition;
				const def = CONDITIONS[key];
				if (def) {
					descBox.innerHTML = processRichText(def.description);
					rankGroup.style.display = def.ranked ? 'block' : 'none';
				}
			};

			selectEl.addEventListener('change', updateUI);
			updateUI();
		}, 100);
	});

	return result;
};
