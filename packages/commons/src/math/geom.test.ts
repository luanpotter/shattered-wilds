import { describe, it, expect } from 'vitest';
import { Box } from './geom.js';

describe('Box', () => {
	describe('contains', () => {
		it('should return true for points inside the box', () => {
			const box = new Box({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
			expect(box.contains({ x: 5, y: 5 })).toBe(true);
			expect(box.contains({ x: 0, y: 0 })).toBe(true);
			expect(box.contains({ x: 10, y: 10 })).toBe(true);
		});

		it('should return false for points outside the box', () => {
			const box = new Box({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
			expect(box.contains({ x: -1, y: 5 })).toBe(false);
			expect(box.contains({ x: 11, y: 5 })).toBe(false);
			expect(box.contains({ x: 5, y: -1 })).toBe(false);
			expect(box.contains({ x: 5, y: 11 })).toBe(false);
		});

		it('should handle reversed coordinates', () => {
			const box = new Box({ start: { x: 10, y: 10 }, end: { x: 0, y: 0 } });
			expect(box.contains({ x: 5, y: 5 })).toBe(true);
			expect(box.contains({ x: -1, y: 5 })).toBe(false);
		});
	});

	describe('intersects', () => {
		it('should return true when line endpoint is inside', () => {
			const box = new Box({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
			const line = { start: { x: 5, y: 5 }, end: { x: 20, y: 20 } };
			expect(box.intersects(line)).toBe(true);
		});

		it('should return true when line crosses the box', () => {
			const box = new Box({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
			const line = { start: { x: -5, y: 5 }, end: { x: 15, y: 5 } };
			expect(box.intersects(line)).toBe(true);
		});

		it('should return false when line misses the box', () => {
			const box = new Box({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
			const line = { start: { x: -5, y: -5 }, end: { x: -1, y: -1 } };
			expect(box.intersects(line)).toBe(false);
		});
	});
});
