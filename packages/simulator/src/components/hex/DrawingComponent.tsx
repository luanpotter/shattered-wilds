import { Box, HexGrid, Point } from '@shattered-wilds/commons';
import React from 'react';

import { Drawing } from '../../types/drawings';
import { GameMap } from '../../types/ui';
import { renderFaIcon } from '../../utils/faIcons';

import { HexAreaComponent } from './HexAreaComponent';

const computeHexCenterLatticeOffset = ({ hexGrid, dragBox }: { hexGrid: HexGrid; dragBox: Box | null }) => {
	if (!dragBox) {
		return { q: 0, r: 0 };
	}
	const startHex = hexGrid.pixelToAxial(dragBox.start);
	const endHex = hexGrid.pixelToAxial(dragBox.end);
	return {
		q: endHex.q - startHex.q,
		r: endHex.r - startHex.r,
	};
};

export const DrawingComponent: React.FC<{
	hexGrid: HexGrid;
	drawing: Drawing;
	dragBox: Box | null;
	isSelected: boolean;
	map: GameMap;
}> = ({ hexGrid, drawing, dragBox, isSelected, map }): React.ReactNode => {
	if (drawing.type === 'area') {
		// Calculate hex offset for dragging - snap to hex center lattice
		const offset = computeHexCenterLatticeOffset({ hexGrid, dragBox });

		return (
			<HexAreaComponent
				hexes={drawing.hexes}
				mapSize={map.size}
				offset={offset}
				color={drawing.color}
				isSelected={isSelected}
				isDragging={dragBox !== null}
			/>
		);
	} else if (drawing.type === 'line') {
		// lines need a more complex drag offset to aligned to the hex-vertex lattice and ensure a path exists
		const offsetX = dragBox ? dragBox.end.x - dragBox.start.x : 0;
		const offsetY = dragBox ? dragBox.end.y - dragBox.start.y : 0;
		// Apply offset and snap to nearest valid vertices
		const rawStart = { x: drawing.start.x + offsetX, y: drawing.start.y + offsetY };
		const rawEnd = { x: drawing.end.x + offsetX, y: drawing.end.y + offsetY };
		const adjustedStart = dragBox ? hexGrid.findNearestVertex(rawStart) : drawing.start;
		const adjustedEnd = dragBox ? hexGrid.findNearestVertex(rawEnd) : drawing.end;
		const pathVertices = hexGrid.findVertexPath(adjustedStart, adjustedEnd);
		return (
			<g>
				{/* Selection highlight (rendered behind) */}
				{isSelected && (
					<polyline
						points={pathVertices.map((v: Point) => `${v.x},${v.y}`).join(' ')}
						fill='none'
						stroke='var(--accent)'
						strokeWidth='1.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						opacity={0.5}
					/>
				)}
				<polyline
					points={pathVertices.map((v: Point) => `${v.x},${v.y}`).join(' ')}
					fill='none'
					stroke={drawing.color}
					strokeWidth='0.4'
					strokeLinecap='round'
					strokeLinejoin='round'
					opacity={dragBox ? 0.6 : 1}
				/>
			</g>
		);
	}
	if (drawing.type === 'stamp') {
		const offset = computeHexCenterLatticeOffset({ hexGrid, dragBox });
		const adjustedHex = { q: drawing.hex.q + offset.q, r: drawing.hex.r + offset.r };
		const center = hexGrid.axialToPixel(adjustedHex);
		// Size is 40% of hex height (which is 2 * hexRadius * sqrt(3)/2 for pointy-top)
		const hexHeight = 10 * Math.sqrt(3);
		const iconSize = hexHeight * 0.4;
		// Scale factor: we render at 100px in CSS and scale down to iconSize in SVG units
		const cssSize = 100;
		const scale = iconSize / cssSize;
		return (
			<g>
				{/* Selection circle highlight */}
				{isSelected && (
					<circle
						cx={center.x}
						cy={center.y}
						r={iconSize / 2 + 1}
						fill='none'
						stroke='var(--accent)'
						strokeWidth='0.6'
						opacity={0.5}
					/>
				)}
				{/* Icon rendered via foreignObject - scale down from CSS pixels to SVG units */}
				<g transform={`translate(${center.x}, ${center.y}) scale(${scale})`}>
					<foreignObject
						x={-cssSize / 2}
						y={-cssSize / 2}
						width={cssSize}
						height={cssSize}
						style={{ pointerEvents: 'none', opacity: dragBox ? 0.6 : 1 }}
					>
						<div
							style={{
								width: cssSize,
								height: cssSize,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: drawing.color,
								fontSize: cssSize * 0.8,
							}}
						>
							{renderFaIcon(drawing.icon)}
						</div>
					</foreignObject>
				</g>
			</g>
		);
	}
	return null;
};
