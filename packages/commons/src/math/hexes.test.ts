import { describe, it, expect } from 'vitest';
import { HexGrid, HexOrientation } from './hexes.js';

const pointyGrid = new HexGrid({ size: 10, orientation: HexOrientation.PointyTop });
const flatGrid = new HexGrid({ size: 10, orientation: HexOrientation.FlatTop });

describe('axialToPixel', () => {
	describe('pointy-top', () => {
		it('should convert origin hex to origin pixel', () => {
			const result = pointyGrid.axialToPixel({ q: 0, r: 0 });
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it('should convert positive q to positive x', () => {
			const result = pointyGrid.axialToPixel({ q: 1, r: 0 });
			expect(result.x).toBe(10);
			expect(result.y).toBe(0);
		});

		it('should offset x by half hexSize per row', () => {
			const result = pointyGrid.axialToPixel({ q: 0, r: 1 });
			expect(result.x).toBe(5);
			expect(result.y).toBeCloseTo(8.66, 1);
		});
	});

	describe('flat-top', () => {
		it('should convert origin hex to origin pixel', () => {
			const result = flatGrid.axialToPixel({ q: 0, r: 0 });
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it('should convert positive r to positive y', () => {
			const result = flatGrid.axialToPixel({ q: 0, r: 1 });
			expect(result.x).toBe(0);
			expect(result.y).toBe(10);
		});

		it('should offset y by half hexSize per column', () => {
			const result = flatGrid.axialToPixel({ q: 1, r: 0 });
			expect(result.x).toBeCloseTo(8.66, 1);
			expect(result.y).toBe(5);
		});
	});
});

describe('pixelToAxial', () => {
	describe('pointy-top', () => {
		it('should convert origin pixel to origin hex', () => {
			const result = pointyGrid.pixelToAxial({ x: 0, y: 0 });
			expect(result.q).toBe(0);
			expect(result.r).toBe(0);
		});

		it('should round to nearest hex', () => {
			const result = pointyGrid.pixelToAxial({ x: 10, y: 0 });
			expect(result.q).toBe(1);
			expect(result.r).toBe(0);
		});

		it('should be inverse of axialToPixel', () => {
			const original = { q: 3, r: -2 };
			const pixel = pointyGrid.axialToPixel(original);
			const result = pointyGrid.pixelToAxial(pixel);
			expect(result.q).toBe(original.q);
			expect(result.r).toBe(original.r);
		});
	});

	describe('flat-top', () => {
		it('should convert origin pixel to origin hex', () => {
			const result = flatGrid.pixelToAxial({ x: 0, y: 0 });
			expect(result.q).toBe(0);
			expect(result.r).toBe(0);
		});

		it('should round to nearest hex', () => {
			const result = flatGrid.pixelToAxial({ x: 0, y: 10 });
			expect(result.q).toBe(0);
			expect(result.r).toBe(1);
		});

		it('should be inverse of axialToPixel', () => {
			const original = { q: 3, r: -2 };
			const pixel = flatGrid.axialToPixel(original);
			const result = flatGrid.pixelToAxial(pixel);
			expect(result.q).toBe(original.q);
			expect(result.r).toBe(original.r);
		});
	});
});

describe('hexDistance', () => {
	it('should return 0 for same hex', () => {
		expect(pointyGrid.hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
	});

	it('should return 1 for adjacent hexes', () => {
		expect(pointyGrid.hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
		expect(pointyGrid.hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
		expect(pointyGrid.hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
	});

	it('should return correct distance for farther hexes', () => {
		expect(pointyGrid.hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
		expect(pointyGrid.hexDistance({ q: -2, r: -2 }, { q: 2, r: 2 })).toBe(8);
	});
});

describe('findHexPath', () => {
	it('should return single hex for same start and end', () => {
		const path = pointyGrid.findHexPath({ q: 0, r: 0 }, { q: 0, r: 0 });
		expect(path).toHaveLength(1);
		expect(path[0]).toEqual({ q: 0, r: 0 });
	});

	it('should return path including start and end', () => {
		const path = pointyGrid.findHexPath({ q: 0, r: 0 }, { q: 2, r: 0 });
		expect(path).toHaveLength(3);
		expect(path[0]).toEqual({ q: 0, r: 0 });
		expect(path[2]).toEqual({ q: 2, r: 0 });
	});

	it('should return path of correct length', () => {
		const start = { q: 0, r: 0 };
		const end = { q: 3, r: -2 };
		const path = pointyGrid.findHexPath(start, end);
		expect(path.length).toBe(pointyGrid.hexDistance(start, end) + 1);
	});
});

describe('getHexVertices', () => {
	describe('pointy-top', () => {
		it('should return 6 vertices', () => {
			const vertices = pointyGrid.getHexVertices({ q: 0, r: 0 });
			expect(vertices).toHaveLength(6);
		});

		it('should return vertices around hex center', () => {
			const vertices = pointyGrid.getHexVertices({ q: 0, r: 0 });
			const radius = 10 / Math.sqrt(3);
			for (const v of vertices) {
				const dist = Math.sqrt(v.x * v.x + v.y * v.y);
				expect(dist).toBeCloseTo(radius, 5);
			}
		});

		it('should have first vertex at top (90 degrees)', () => {
			const vertices = pointyGrid.getHexVertices({ q: 0, r: 0 });
			// First vertex should be at top (x=0, y negative in screen coords)
			expect(vertices[0]!.x).toBeCloseTo(0, 5);
			expect(vertices[0]!.y).toBeLessThan(0);
		});
	});

	describe('flat-top', () => {
		it('should return 6 vertices', () => {
			const vertices = flatGrid.getHexVertices({ q: 0, r: 0 });
			expect(vertices).toHaveLength(6);
		});

		it('should return vertices around hex center', () => {
			const vertices = flatGrid.getHexVertices({ q: 0, r: 0 });
			const radius = 10 / Math.sqrt(3);
			for (const v of vertices) {
				const dist = Math.sqrt(v.x * v.x + v.y * v.y);
				expect(dist).toBeCloseTo(radius, 5);
			}
		});

		it('should have first vertex at top-right (30 degrees)', () => {
			const vertices = flatGrid.getHexVertices({ q: 0, r: 0 });
			// First vertex should be at 30 degrees (positive x, negative y in screen coords)
			expect(vertices[0]!.x).toBeGreaterThan(0);
			expect(vertices[0]!.y).toBeLessThan(0);
		});
	});
});

describe('getHexNeighbors', () => {
	it('should return 6 neighbors', () => {
		const neighbors = pointyGrid.getHexNeighbors({ q: 0, r: 0 });
		expect(neighbors).toHaveLength(6);
	});

	it('should return all adjacent hexes', () => {
		const neighbors = pointyGrid.getHexNeighbors({ q: 0, r: 0 });
		for (const n of neighbors) {
			expect(pointyGrid.hexDistance({ q: 0, r: 0 }, n)).toBe(1);
		}
	});
});

describe('findNearestVertex', () => {
	describe('pointy-top', () => {
		it('should find vertex near hex corner', () => {
			const vertex = pointyGrid.findNearestVertex({ x: 0, y: -5.8 });
			expect(vertex).not.toBeNull();
			expect(vertex!.x).toBeCloseTo(0, 1);
			expect(vertex!.y).toBeCloseTo(-5.77, 1);
		});
	});

	describe('flat-top', () => {
		it('should find vertex near hex corner', () => {
			// For flat-top, top-right vertex is at 30 degrees
			const radius = 10 / Math.sqrt(3);
			const expectedX = radius * Math.cos((30 * Math.PI) / 180);
			const expectedY = -radius * Math.sin((30 * Math.PI) / 180);
			const vertex = flatGrid.findNearestVertex({ x: expectedX, y: expectedY + 0.1 });
			expect(vertex).not.toBeNull();
			expect(vertex!.x).toBeCloseTo(expectedX, 1);
			expect(vertex!.y).toBeCloseTo(expectedY, 1);
		});
	});
});

describe('getHexesInRange', () => {
	it('should return single hex for range 0', () => {
		const hexes = pointyGrid.getHexesInRange({ q: 0, r: 0 }, 0);
		expect(hexes).toHaveLength(1);
		expect(hexes[0]).toEqual({ q: 0, r: 0 });
	});

	it('should return 7 hexes for range 1', () => {
		const hexes = pointyGrid.getHexesInRange({ q: 0, r: 0 }, 1);
		expect(hexes).toHaveLength(7);
	});

	it('should return 19 hexes for range 2', () => {
		const hexes = pointyGrid.getHexesInRange({ q: 0, r: 0 }, 2);
		expect(hexes).toHaveLength(19);
	});
});

describe('isHexInBounds', () => {
	it('should return true for origin in any positive bounds', () => {
		expect(pointyGrid.isHexInBounds({ q: 0, r: 0 }, { width: 5, height: 5 })).toBe(true);
	});

	it('should return false for hex outside bounds', () => {
		expect(pointyGrid.isHexInBounds({ q: 0, r: 10 }, { width: 5, height: 5 })).toBe(false);
		expect(pointyGrid.isHexInBounds({ q: 10, r: 0 }, { width: 5, height: 5 })).toBe(false);
	});

	it('should account for row offset in q bounds', () => {
		expect(pointyGrid.isHexInBounds({ q: -5, r: 0 }, { width: 5, height: 5 })).toBe(true);
		expect(pointyGrid.isHexInBounds({ q: -6, r: 0 }, { width: 5, height: 5 })).toBe(false);
	});
});
