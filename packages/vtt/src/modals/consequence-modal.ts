import { getRecordValues } from '@shattered-wilds/commons';
import { Consequence, CONSEQUENCES } from '@shattered-wilds/d12';
import { getDialogV2Factory, showNotification } from '../foundry-shim';
import { processRichText } from '../helpers/rich-text';

export const addConsequenceModal = async (
	existingConsequences: Set<Consequence>,
): Promise<{ consequence?: string; rank?: number } | undefined> => {
	const availableConsequences = getRecordValues(CONSEQUENCES)
		.filter(def => !existingConsequences.has(def.name))
		.sort((a, b) => a.name.localeCompare(b.name));

	if (availableConsequences.length === 0) {
		showNotification('warn', 'All consequences already applied');
		return undefined;
	}

	// Build options for select
	const options = availableConsequences
		.map(def => `<option value="${def.name}">${def.name}${def.ranked ? ' ★' : ''}</option>`)
		.join('');

	// Create a simple HTML form
	const content = `
				<div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px;">
					<div>
						<label style="display: block; margin-bottom: 4px; font-weight: bold;">Consequence:</label>
						<select id="consequence-select" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
							${options}
						</select>
					</div>
					<div id="rank-input-group" style="display: none;">
						<label style="display: block; margin-bottom: 4px; font-weight: bold;">Rank:</label>
						<input type="number" id="rank-input" value="1" min="1" max="10" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
					</div>
					<div id="description-box" style="padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; max-height: 200px; overflow-y: auto;">
						${processRichText(CONSEQUENCES[availableConsequences[0]!.name].description)}}
					</div>
				</div>
			`;

	const Dialog = getDialogV2Factory();

	const result = await new Promise<{ consequence?: string; rank?: number }>(resolve => {
		const dialogOptions = {
			window: { title: 'Add Consequence' },
			content,
			buttons: [
				{
					label: 'Add',
					action: 'add',
					callback: () => {
						const selectEl = document.getElementById('consequence-select') as HTMLSelectElement | null;
						const rankEl = document.getElementById('rank-input') as HTMLInputElement | null;
						if (!selectEl) {
							resolve({});
							return;
						}
						const key = selectEl.value as Consequence;
						const def = CONSEQUENCES[key];
						resolve({
							consequence: key,
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
			const selectEl = document.getElementById('consequence-select') as HTMLSelectElement | null;
			const rankGroup = document.getElementById('rank-input-group') as HTMLDivElement | null;
			const descBox = document.getElementById('description-box') as HTMLDivElement | null;

			if (!selectEl || !rankGroup || !descBox) return;

			const updateUI = () => {
				const key = selectEl.value as Consequence;
				const def = CONSEQUENCES[key];
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
