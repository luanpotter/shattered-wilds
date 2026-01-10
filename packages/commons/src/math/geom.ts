/** A point in 2D cartesian space. */
export interface Point {
	x: number;
	y: number;
}

/** The size of a AA rectangle in 2D cartesian space. */
export interface Dimensions {
	width: number;
	height: number;
}

export interface Line {
	start: Point;
	end: Point;
}

const segmentsIntersect = (line1: Line, line2: Line): boolean => {
	const ccw = (A: Point, B: Point, C: Point) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
	return (
		ccw(line1.start, line1.end, line2.start) !== ccw(line1.start, line1.end, line2.end) &&
		ccw(line1.start, line2.start, line2.end) !== ccw(line1.end, line2.start, line2.end)
	);
};

export class Box {
	start: Point;
	end: Point;

	constructor({ start, end }: { start: Point; end: Point }) {
		this.start = start;
		this.end = end;
	}

	get minX() {
		return Math.min(this.start.x, this.end.x);
	}
	get maxX() {
		return Math.max(this.start.x, this.end.x);
	}
	get minY() {
		return Math.min(this.start.y, this.end.y);
	}
	get maxY() {
		return Math.max(this.start.y, this.end.y);
	}

	get topEdge(): Line {
		return {
			start: { x: this.minX, y: this.minY },
			end: { x: this.maxX, y: this.minY },
		};
	}

	get rightEdge(): Line {
		return {
			start: { x: this.maxX, y: this.minY },
			end: { x: this.maxX, y: this.maxY },
		};
	}

	get bottomEdge(): Line {
		return {
			start: { x: this.maxX, y: this.maxY },
			end: { x: this.minX, y: this.maxY },
		};
	}

	get leftEdge(): Line {
		return {
			start: { x: this.minX, y: this.maxY },
			end: { x: this.minX, y: this.minY },
		};
	}

	get edges(): Line[] {
		return [this.topEdge, this.rightEdge, this.bottomEdge, this.leftEdge];
	}

	contains(p: Point) {
		return p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY;
	}

	intersects(line: Line): boolean {
		// If either endpoint is inside, it intersects
		if (this.contains(line.start) || this.contains(line.end)) {
			return true;
		}

		// Check if segment crosses any of the 4 box edges
		for (const edge of this.edges) {
			if (segmentsIntersect(line, edge)) {
				return true;
			}
		}
		return false;
	}
}
