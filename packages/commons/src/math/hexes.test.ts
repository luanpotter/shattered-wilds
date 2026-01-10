import { describe, it, expect } from 'vitest';
import {
	axialToPixel,
	pixelToAxial,
	hexDistance,
	findHexPath,
	getHexVertices,
	getHexNeighbors,
	findNearestVertex,
	getHexesInRange,
	isHexInBounds,
} from './hexes.js';

describe('axialToPixel', () => {
	it('should convert origin hex to origin pixel', () => {
		const result = axialToPixel({ q: 0, r: 0 });
		expect(result.x).toBe(0);
		expect(result.y).toBe(0);
	});

	it('should convert positive q to positive x', () => {
		const result = axialToPixel({ q: 1, r: 0 }, 10);
		expect(result.x).toBe(10);
		expect(result.y).toBe(0);
	});

	it('should offset x by half hexSize per row', () => {
		const result = axialToPixel({ q: 0, r: 1 }, 10);
		expect(result.x).toBe(5);
		expect(result.y).toBeCloseTo(8.66, 1);
	});
});

describe('pixelToAxial', () => {
	it('should convert origin pixel to origin hex', () => {
		const result = pixelToAxial({ x: 0, y: 0 });
		expect(result.q).toBe(0);
		expect(result.r).toBe(0);
	});

	it('should round to nearest hex', () => {
		const result = pixelToAxial({ x: 10, y: 0 }, 10);
		expect(result.q).toBe(1);
		expect(result.r).toBe(0);
	});

	it('should be inverse of axialToPixel', () => {
		const original = { q: 3, r: -2 };
		const pixel = axialToPixel(original, 10);
		const result = pixelToAxial(pixel, 10);
		expect(result.q).toBe(original.q);
		expect(result.r).toBe(original.r);
	});
});

describe('hexDistance', () => {
	it('should return 0 for same hex', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
	});

	it('should return 1 for adjacent hexes', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
		expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
		expect(hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
	});

	it('should return correct distance for farther hexes', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
		expect(hexDistance({ q: -2, r: -2 }, { q: 2, r: 2 })).toBe(8);
	});
});

describe('findHexPath', () => {
	it('should return single hex for same start and end', () => {
		const path = findHexPath({ q: 0, r: 0 }, { q: 0, r: 0 });
		expect(path).toHaveLength(1);
		expect(path[0]).toEqual({ q: 0, r: 0 });
	});

	it('should return path including start and end', () => {
		const path = findHexPath({ q: 0, r: 0 }, { q: 2, r: 0 });
		expect(path).toHaveLength(3);
		expect(path[0]).toEqual({ q: 0, r: 0 });
		expect(path[2]).toEqual({ q: 2, r: 0 });
	});

	it('should return path of correct length', () => {
		const start = { q: 0, r: 0 };
		const end = { q: 3, r: -2 };
		const path = findHexPath(start, end);
		expect(path.length).toBe(hexDistance(start, end) + 1);
	});
});

describe('getHexVertices', () => {
	it('should return 6 vertices', () => {
		const vertices = getHexVertices({ q: 0, r: 0 });
		expect(vertices).toHaveLength(6);
	});

	it('should return vertices around hex center', () => {
		const vertices = getHexVertices({ q: 0, r: 0 }, 10);
		const radius = 10 / Math.sqrt(3);
		for (const v of vertices) {
			const dist = Math.sqrt(v.x * v.x + v.y * v.y);
			expect(dist).toBeCloseTo(radius, 5);
		}
	});
});

describe('getHexNeighbors', () => {
	it('should return 6 neighbors', () => {
		const neighbors = getHexNeighbors({ q: 0, r: 0 });
		expect(neighbors).toHaveLength(6);
	});

	it('should return all adjacent hexes', () => {
		const neighbors = getHexNeighbors({ q: 0, r: 0 });
		for (const n of neighbors) {
			expect(hexDistance({ q: 0, r: 0 }, n)).toBe(1);
		}
	});
});

describe('findNearestVertex', () => {
	it('should find vertex near hex corner', () => {
		const vertex = findNearestVertex({ x: 0, y: -5.8 }, 10);
		expect(vertex).not.toBeNull();
		expect(vertex!.x).toBeCloseTo(0, 1);
		expect(vertex!.y).toBeCloseTo(-5.77, 1);
	});
});

describe('getHexesInRange', () => {
	it('should return single hex for range 0', () => {
		const hexes = getHexesInRange({ q: 0, r: 0 }, 0);
		expect(hexes).toHaveLength(1);
		expect(hexes[0]).toEqual({ q: 0, r: 0 });
	});

	it('should return 7 hexes for range 1', () => {
		const hexes = getHexesInRange({ q: 0, r: 0 }, 1);
		expect(hexes).toHaveLength(7);
	});

	it('should return 19 hexes for range 2', () => {
		const hexes = getHexesInRange({ q: 0, r: 0 }, 2);
		expect(hexes).toHaveLength(19);
	});
});

describe('isHexInBounds', () => {
	it('should return true for origin in any positive bounds', () => {
		expect(isHexInBounds({ q: 0, r: 0 }, { width: 5, height: 5 })).toBe(true);
	});

	it('should return false for hex outside bounds', () => {
		expect(isHexInBounds({ q: 0, r: 10 }, { width: 5, height: 5 })).toBe(false);
		expect(isHexInBounds({ q: 10, r: 0 }, { width: 5, height: 5 })).toBe(false);
	});

	it('should account for row offset in q bounds', () => {
		expect(isHexInBounds({ q: -5, r: 0 }, { width: 5, height: 5 })).toBe(true);
		expect(isHexInBounds({ q: -6, r: 0 }, { width: 5, height: 5 })).toBe(false);
	});
});
