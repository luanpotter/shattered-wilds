import { Box, HexCoord, HexGrid, Line, Point, distanceToSegment } from '@shattered-wilds/commons';

export interface LineDrawing {
	type: 'line';
	start: Point;
	end: Point;
	color: string;
}

export interface AreaDrawing {
	type: 'area';
	hexes: HexCoord[];
	color: string;
}

export interface StampDrawing {
	type: 'stamp';
	hex: HexCoord;
	icon: string;
	color: string;
}

export type Drawing = LineDrawing | AreaDrawing | StampDrawing;

export const drawingContainsPoint = ({
	hexGrid,
	drawing,
	point,
}: {
	hexGrid: HexGrid;
	drawing: Drawing;
	point: Point;
}): boolean => {
	const clickedHex = hexGrid.pixelToAxial(point);
	if (drawing.type === 'area') {
		// Check if point is inside any of the hexes
		for (const hex of drawing.hexes) {
			if (hex.q === clickedHex.q && hex.r === clickedHex.r) {
				return true;
			}
		}
	} else if (drawing.type === 'line') {
		const threshold = 0.5; // in pixels; "thickness" of the line clickable area
		const pathVertices = hexGrid.findVertexPath(drawing.start, drawing.end);
		console.log(`MATCHING LINE - path is: ${pathVertices.map(v => `(${v.x},${v.y})`).join(', ')}`);
		for (let j = 0; j < pathVertices.length - 1; j++) {
			const line = { start: pathVertices[j], end: pathVertices[j + 1] };
			const dist = distanceToSegment(point, line);
			if (dist <= threshold) {
				console.log(
					`FOUND MATCH BETWEEN POINT ${point.x},${point.y} AND LINE SEGMENT ${line.start.x},${line.start.y} to ${line.end.x},${line.end.y} with distance ${dist}`,
				);
				return true;
			}
		}
	} else if (drawing.type === 'stamp') {
		if (drawing.hex.q === clickedHex.q && drawing.hex.r === clickedHex.r) {
			return true;
		}
	} else {
		console.error('Unknown drawing type:', drawing);
	}
	return false;
};

export const drawingIntersectsBox = ({
	hexGrid,
	drawing,
	box,
}: {
	hexGrid: HexGrid;
	drawing: Drawing;
	box: Box;
}): boolean => {
	if (drawing.type === 'area') {
		// Check if any hex center is inside the box
		for (const hex of drawing.hexes) {
			const point = hexGrid.axialToPixel(hex);
			if (box.contains(point)) {
				return true;
			}
		}
	} else if (drawing.type === 'line') {
		const pathVertices = hexGrid.findVertexPath(drawing.start, drawing.end);
		// Check if any vertex is inside or any segment intersects
		for (let i = 0; i < pathVertices.length; i++) {
			if (box.contains(pathVertices[i])) {
				return true;
			}
			const line = { start: pathVertices[i], end: pathVertices[i + 1] };
			if (i < pathVertices.length - 1 && box.intersects(line)) {
				return true;
			}
		}
	} else if (drawing.type === 'stamp') {
		const point = hexGrid.axialToPixel(drawing.hex);
		if (box.contains(point)) {
			return true;
		}
	} else {
		console.error('Unknown drawing type:', drawing);
	}
	return false;
};

export const displaceDrawing = ({
	hexGrid,
	drawing,
	delta,
}: {
	hexGrid: HexGrid;
	drawing: Drawing;
	delta: Line;
}): Drawing => {
	if (drawing.type === 'line') {
		// Snap to vertex lattice for lines
		const startVertex = hexGrid.findNearestVertex(delta.start);
		const endVertex = hexGrid.findNearestVertex(delta.end);
		const dx = endVertex.x - startVertex.x;
		const dy = endVertex.y - startVertex.y;
		if (dx === 0 && dy === 0) {
			return drawing;
		}
		// Apply offset and snap to nearest valid vertices
		const rawStart = { x: drawing.start.x + dx, y: drawing.start.y + dy };
		const rawEnd = { x: drawing.end.x + dx, y: drawing.end.y + dy };
		const newStart = hexGrid.findNearestVertex(rawStart) ?? drawing.start;
		const newEnd = hexGrid.findNearestVertex(rawEnd) ?? drawing.end;
		return {
			...drawing,
			start: newStart,
			end: newEnd,
		};
	} else if (drawing.type === 'area') {
		// Snap to hex center lattice for areas
		const startHex = hexGrid.pixelToAxial(delta.start);
		const endHex = hexGrid.pixelToAxial(delta.end);
		const dq = endHex.q - startHex.q;
		const dr = endHex.r - startHex.r;
		if (dq === 0 && dr === 0) {
			return drawing;
		}
		return {
			...drawing,
			hexes: drawing.hexes.map(hex => ({
				q: hex.q + dq,
				r: hex.r + dr,
			})),
		};
	} else if (drawing.type === 'stamp') {
		// Snap to hex center lattice for stamps
		const startHex = hexGrid.pixelToAxial(delta.start);
		const endHex = hexGrid.pixelToAxial(delta.end);
		const dq = endHex.q - startHex.q;
		const dr = endHex.r - startHex.r;
		if (dq === 0 && dr === 0) {
			return drawing;
		}
		return {
			...drawing,
			hex: {
				q: drawing.hex.q + dq,
				r: drawing.hex.r + dr,
			},
		};
	}
	return drawing;
};
