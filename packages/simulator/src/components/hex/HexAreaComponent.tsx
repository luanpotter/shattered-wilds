import { computeBoundaries, Dimensions, getHexVertices, HexCoord, isHexInBounds } from '@shattered-wilds/commons';
import React from 'react';

export interface HexAreaProps {
	hexes: HexCoord[];
	offset?: HexCoord;
	mapSize: Dimensions;
	color: string;
	isSelected?: boolean;
	isDragging?: boolean;
}

const HexArea: React.FC<HexAreaProps> = ({
	hexes,
	offset = { q: 0, r: 0 },
	mapSize,
	color,
	isSelected = false,
	isDragging = false,
}) => {
	const inBoundHexes = hexes.filter(hex => isHexInBounds(hex, mapSize));
	const boundary = computeBoundaries(inBoundHexes, offset);
	return (
		<g style={{ pointerEvents: 'none' }}>
			{/* Fill each hex */}
			{inBoundHexes.map((hex, hexIndex) => {
				const adjustedHex = { q: hex.q + offset.q, r: hex.r + offset.r };
				const vertices = getHexVertices(adjustedHex, 10);
				const pathData = `M${vertices.map(v => `${v.x},${v.y}`).join(' L')} Z`;
				return <path key={hexIndex} d={pathData} fill={color} fillOpacity={isDragging ? 0.1 : 0.2} stroke='none' />;
			})}
			{/* Draw only boundary edges */}
			{boundary.map((edge, edgeIndex) => (
				<line
					key={edgeIndex}
					x1={edge.start.x}
					y1={edge.start.y}
					x2={edge.end.x}
					y2={edge.end.y}
					stroke={color}
					strokeWidth={isSelected ? '0.6' : '0.3'}
					strokeLinecap='round'
				/>
			))}
		</g>
	);
};

export const HexAreaComponent = React.memo(HexArea);
