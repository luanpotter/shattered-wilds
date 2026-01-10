import { HexCoord } from '@shattered-wilds/commons';
import React, { useMemo } from 'react';

import { hexGrid } from './hexGrid';

// Pre-computed hex path for pointy-top hexagon with radius 5
const HEX_PATH = 'M0,-5 L4.33,-2.5 L4.33,2.5 L0,5 L-4.33,2.5 L-4.33,-2.5 Z';

const generateHexes = (width: number, height: number): HexCoord[] => {
	const hexes = [];

	// Create a true rectangular grid with a consistent number of hexes per row/column
	// In axial coordinates:
	// - Going along constant r-value = "diagonal rows"
	// - Going along constant q-value = "vertical columns"

	// Calculate the bounds to make a rectangular visual shape
	// We need to offset the q-values for each row to make a rectangle
	for (let r = -height; r <= height; r++) {
		// Calculate q-offset based on row (r) to ensure a rectangular grid
		// This makes sure each row starts at the right position to form a rectangle
		const qOffset = Math.floor(r / 2);

		// Each row has exactly the same number of hexes (2*width + 1)
		for (let i = 0; i <= 2 * width; i++) {
			// Calculate q value with offset to align the grid into a rectangle
			const q = i - width - qOffset;

			hexes.push({ q, r });
		}
	}

	return hexes;
};

export interface StaticHexGridProps {
	width: number;
	height: number;
}

const StaticHexGridComponent: React.FC<StaticHexGridProps> = ({ width, height }) => {
	const hexes = useMemo(() => generateHexes(width, height), [width, height]);

	return (
		<g>
			{hexes.map(hex => {
				const hexDesc = `${hex.q},${hex.r}`;
				const { x, y } = hexGrid.axialToPixel(hex);
				return (
					<path
						key={hexDesc}
						d={HEX_PATH}
						transform={`translate(${x},${y})`}
						fill='var(--background-alt)'
						stroke='var(--text)'
						strokeWidth={0.3}
						strokeOpacity={0.3}
						data-hex={hexDesc}
					/>
				);
			})}
		</g>
	);
};

export const StaticHexGrid = React.memo(StaticHexGridComponent);
