import {
	ActionRow,
	ActionRowCheckBox,
	ActionRowValueBox,
	ActionRowVariableBox,
	ARCANE_SCHOOLS,
	CharacterSheet,
	Resource,
	RESOURCES,
} from '@shattered-wilds/commons';
import { processRichText } from './helpers/rich-text';

const processCosts = ({ characterSheet, actionRow }: { characterSheet: CharacterSheet; actionRow: ActionRow }) => {
	const actionCosts = actionRow.cost?.actionCosts;
	if (actionCosts === undefined) {
		return { costs: undefined, costTooltip: undefined, canAfford: true };
	}
	const costs = actionCosts.map(cost => {
		const resource = characterSheet.getResource(cost.resource);
		const insufficient = resource.current < cost.amount;
		return {
			resource: cost.resource,
			amount: cost.amount,
			value: `${cost.amount} ${RESOURCES[cost.resource as Resource].shortCode}`,
			insufficient,
		};
	});

	const costTooltip = buildTooltip(costs.map(c => c.value).join('\n'));
	const canAfford = costs.every(c => !c.insufficient);

	return { costs, costTooltip, canAfford };
};

/**
 * Prepares an ActionRow for template rendering
 * This is the single source of truth for how action rows are formatted
 */
export const prepareActionRow = (
	actionRow: ActionRow,
	characterSheet: CharacterSheet,
	options: {
		/** Include variable boxes augmentation values if available */
		variableValues?: Record<string, number>;
	} = {},
) => {
	const { costs, costTooltip, canAfford } = processCosts({ characterSheet, actionRow });

	const parameters = boxMapping({ actionRow, variableValues: options.variableValues || {} });

	// Show only first paragraph of description
	const firstParagraph = actionRow.description.split('\n\n')[0] || actionRow.description;

	return {
		slug: actionRow.slug,
		name: actionRow.title,
		description: processRichText(firstParagraph),
		traits: actionRow.traits.map(trait => {
			const type = Object.hasOwn(ARCANE_SCHOOLS, trait) ? 'school' : 'trait';
			return { type, value: trait };
		}),
		costs,
		costTooltip,
		canAfford,
		parameters,
	};
};

const buildTooltip = (value: string, { includeCheck }: { includeCheck?: boolean } = {}): string => {
	return [
		...value
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.length > 0),
		includeCheck ? 'Click for modal • Shift+Click for quick roll' : undefined,
	]
		.filter(e => e !== undefined)
		.join('&#013;');
};

const boxMapping = ({
	actionRow,
	variableValues = {},
}: {
	actionRow: ActionRow;
	variableValues?: Record<string, number>;
}) => {
	return actionRow.boxes
		.map(box => {
			const { key, data, labels, tooltip } = box;
			if (data instanceof ActionRowValueBox) {
				const { value } = data;

				return {
					type: 'value',
					key,
					labels,
					tooltip: buildTooltip(tooltip),
					value: value.description,
				};
			} else if (data instanceof ActionRowVariableBox) {
				// Use provided variable value if available, otherwise use the box's inputValue
				const inputValue = variableValues[key] ?? data.inputValue;
				// Note: If inputValue changed, the value in data might be stale
				// But for rendering purposes, we use what's already computed in the ActionRow

				return {
					type: 'variable',
					key,
					labels,
					tooltip: buildTooltip(tooltip),
					value: data.value.description,
					inputValue,
					bonusDescription: data.value.description,
				};
			} else if (data instanceof ActionRowCheckBox) {
				const { check, targetDC, errors } = data;

				// Show error state if there are errors, but still allow clicking
				const hasErrors = errors.length > 0;
				if (hasErrors && errors[0]) {
					const error = errors[0];
					return {
						type: 'check',
						key,
						labels: [error.title],
						value: error.text,
						tooltip: buildTooltip(error.tooltip, { includeCheck: true }),
						hasError: true, // This will make the text red via CSS (insufficient class)
					};
				}

				return {
					type: 'check',
					key,
					labels,
					value: check.statModifier.value.description + (targetDC !== undefined ? ` | DC ${targetDC}` : ''),
					tooltip: buildTooltip(tooltip, { includeCheck: true }),
					hasError: false,
				};
			}
			return null;
		})
		.filter((box): box is NonNullable<typeof box> => box !== null);
};
