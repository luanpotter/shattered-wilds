import { Box, HexCoord, HexGrid, Point, distanceToLine } from '@shattered-wilds/commons';

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
		const threshold = 2; // in pixels; "thickness" of the line clickable area
		const pathVertices = hexGrid.findVertexPath(drawing.start, drawing.end);
		for (let j = 0; j < pathVertices.length - 1; j++) {
			const line = { start: pathVertices[j], end: pathVertices[j + 1] };
			const dist = distanceToLine(point, line);
			if (dist <= threshold) {
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
