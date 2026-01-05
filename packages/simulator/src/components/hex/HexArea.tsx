import { getHexNeighbors, getHexVertices, HexCoord } from '@shattered-wilds/commons';

import { HexPosition } from '../../types/ui';

export const HexArea = ({
	hexes,
	offset,
	color,
	isSelected,
	isDragging,
}: {
	hexes: HexPosition[];
	offset: HexCoord;
	color: string;
	isSelected: boolean;
	isDragging: boolean;
}) => {
	// Create a set of hex keys for quick lookup
	const hexSet = new Set(hexes.map(h => `${h.q + offset.q},${h.r + offset.r}`));

	// Edge index to neighbor index mapping for pointy-top hex:
	// Edge 0 (v0→v1, top→top-right) borders Northeast neighbor (index 1)
	// Edge 1 (v1→v2, top-right→bottom-right) borders East neighbor (index 0)
	// Edge 2 (v2→v3, bottom-right→bottom) borders Southeast neighbor (index 5)
	// Edge 3 (v3→v4, bottom→bottom-left) borders Southwest neighbor (index 4)
	// Edge 4 (v4→v5, bottom-left→top-left) borders West neighbor (index 3)
	// Edge 5 (v5→v0, top-left→top) borders Northwest neighbor (index 2)
	const edgeToNeighborIndex = [1, 0, 5, 4, 3, 2];

	// Collect all boundary edges
	const boundaryEdges: { x1: number; y1: number; x2: number; y2: number }[] = [];
	for (const hex of hexes) {
		const adjustedHex = { q: hex.q + offset.q, r: hex.r + offset.r };
		const vertices = getHexVertices(adjustedHex.q, adjustedHex.r, 10);
		const neighbors = getHexNeighbors(adjustedHex);

		// For each edge (6 edges)
		for (let i = 0; i < 6; i++) {
			const neighborIndex = edgeToNeighborIndex[i];
			const neighbor = neighbors[neighborIndex];
			const neighborKey = `${neighbor.q},${neighbor.r}`;
			// Only draw this edge if neighbor is NOT in the area
			if (!hexSet.has(neighborKey)) {
				const v1 = vertices[i];
				const v2 = vertices[(i + 1) % 6];
				boundaryEdges.push({ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y });
			}
		}
	}

	return (
		<g style={{ pointerEvents: 'none' }}>
			{/* Fill each hex */}
			{hexes.map((hex, hexIndex) => {
				const adjustedHex = { q: hex.q + offset.q, r: hex.r + offset.r };
				const vertices = getHexVertices(adjustedHex.q, adjustedHex.r, 10);
				const pathData = `M${vertices.map(v => `${v.x},${v.y}`).join(' L')} Z`;
				return <path key={hexIndex} d={pathData} fill={color} fillOpacity={isDragging ? 0.1 : 0.2} stroke='none' />;
			})}
			{/* Draw only boundary edges */}
			{boundaryEdges.map((edge, edgeIndex) => (
				<line
					key={edgeIndex}
					x1={edge.x1}
					y1={edge.y1}
					x2={edge.x2}
					y2={edge.y2}
					stroke={color}
					strokeWidth={isSelected ? '0.6' : '0.3'}
					strokeLinecap='round'
				/>
			))}
		</g>
	);
};
