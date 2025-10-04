import {
	DistanceInput,
	DropdownInput,
	FixedBonusInput,
	FixedDistanceInput,
	NumberInput,
	ResourceInput,
	SectionInput,
} from '@shattered-wilds/commons';

/**
 * Prepares a SectionInput for rendering in the VTT template.
 * Returns a generic data structure that can be rendered by the template.
 */
export function prepareInputForTemplate(input: SectionInput): Record<string, unknown> {
	if (input instanceof FixedDistanceInput) {
		return {
			type: 'fixed',
			key: input.key,
			label: input.label,
			tooltip: input.tooltip,
			value: input.getAsString(),
		};
	}

	if (input instanceof FixedBonusInput) {
		return {
			type: 'fixed',
			key: input.key,
			label: input.label,
			tooltip: input.tooltip,
			value: input.getAsString(),
		};
	}

	if (input instanceof ResourceInput) {
		// Resources are not shown in VTT since they're already in the main section
		// and the VTT character sheet has limited space
		return {
			type: 'resource',
			key: input.key,
			resource: input.resource,
			hidden: true,
		};
	}

	if (input instanceof NumberInput) {
		return {
			type: 'number',
			key: input.key,
			label: input.label,
			tooltip: input.tooltip,
			value: input.getter(),
		};
	}

	if (input instanceof DistanceInput) {
		return {
			type: 'number',
			key: input.key,
			label: input.label,
			tooltip: input.tooltip,
			value: input.getter().value,
		};
	}

	if (input instanceof DropdownInput) {
		const currentValue = input.getter();
		const options = input.options.map((option, index) => {
			// For object comparison, we need to check equality properly
			// For primitive values like strings, use ===
			// For objects, we need deep comparison or reference equality
			let isSelected = false;
			if (typeof option === 'string' || typeof option === 'number') {
				isSelected = option === currentValue;
			} else if (option && typeof option === 'object') {
				// For objects, try JSON comparison as a fallback
				// This handles cases like Armor, Shield, WeaponModeOption, etc.
				try {
					isSelected = JSON.stringify(option) === JSON.stringify(currentValue);
				} catch {
					// If JSON fails, fall back to reference equality
					isSelected = option === currentValue;
				}
			} else {
				isSelected = option === currentValue;
			}

			return {
				value: index,
				label: input.describe(option),
				selected: isSelected,
			};
		});

		return {
			type: 'dropdown',
			key: input.key,
			label: input.label,
			tooltip: input.tooltip,
			options,
		};
	}

	// Fallback for unknown input types
	console.warn(`Unknown input type: ${input.constructor.name}`);
	return {
		type: 'unknown',
		key: input.key,
		label: 'label' in input ? (input as { label: string }).label : 'Unknown',
		value: 'Unknown input type',
	};
}
