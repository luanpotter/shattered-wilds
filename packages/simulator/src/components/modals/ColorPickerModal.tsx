import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from '../shared/Button';

interface ColorPickerModalProps {
	currentColor: string;
	onSelect: (color: string) => void;
	onClose: () => void;
}

// Preset colors from CSS variables and some useful additions
const PRESET_COLORS = [
	// UI colors
	{ label: 'Primary', value: '#4a9eff' },
	{ label: 'Accent', value: '#ffb300' },
	{ label: 'Error', value: '#ff6b6b' },
	{ label: 'Text', value: '#ffffff' },
	// Basic colors
	{ label: 'Red', value: '#ff0000' },
	{ label: 'Green', value: '#00ff00' },
	{ label: 'Blue', value: '#0000ff' },
	{ label: 'Yellow', value: '#ffff00' },
	{ label: 'Cyan', value: '#00ffff' },
	{ label: 'Magenta', value: '#ff00ff' },
	{ label: 'Orange', value: '#ff8800' },
	{ label: 'Purple', value: '#8800ff' },
	{ label: 'Pink', value: '#ff88cc' },
	{ label: 'Lime', value: '#88ff00' },
	{ label: 'Teal', value: '#00ff88' },
	{ label: 'Sky', value: '#0088ff' },
	// Darker variants
	{ label: 'Dark Red', value: '#880000' },
	{ label: 'Dark Green', value: '#008800' },
	{ label: 'Dark Blue', value: '#000088' },
	{ label: 'Brown', value: '#884400' },
	// Grays
	{ label: 'Black', value: '#000000' },
	{ label: 'Dark Gray', value: '#444444' },
	{ label: 'Gray', value: '#888888' },
	{ label: 'Light Gray', value: '#cccccc' },
];

// Helper to convert CSS variable to hex if needed
const resolveColor = (color: string): string => {
	if (color.startsWith('var(')) {
		// Extract variable name and find in presets
		const varName = color.match(/var\(--([^)]+)\)/)?.[1];
		if (varName === 'primary') return '#4a9eff';
		if (varName === 'accent') return '#ffb300';
		if (varName === 'error-color') return '#ff6b6b';
		if (varName === 'text') return '#ffffff';
		return '#ffffff';
	}
	return color;
};

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: { r: 255, g: 255, b: 255 };
};

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
	return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// Convert HSV to RGB
const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	let r: number, g: number, b: number;
	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
		default:
			r = v;
			g = p;
			b = q;
			break;
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
};

// Convert RGB to HSV
const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;

	let h = 0;
	const s = max === 0 ? 0 : d / max;
	const v = max;

	if (max !== min) {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return { h, s, v };
};

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ currentColor, onSelect, onClose }) => {
	const resolvedInitial = resolveColor(currentColor);
	const initialRgb = hexToRgb(resolvedInitial);
	const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);

	const [hue, setHue] = useState(initialHsv.h);
	const [saturation, setSaturation] = useState(initialHsv.s);
	const [value, setValue] = useState(initialHsv.v);
	const [rgb, setRgb] = useState(initialRgb);
	const [hexInput, setHexInput] = useState(resolvedInitial);

	const svPickerRef = useRef<HTMLDivElement>(null);
	const hueSliderRef = useRef<HTMLDivElement>(null);
	const [isDraggingSV, setIsDraggingSV] = useState(false);
	const [isDraggingHue, setIsDraggingHue] = useState(false);

	// Update RGB when HSV changes
	useEffect(() => {
		const newRgb = hsvToRgb(hue, saturation, value);
		setRgb(newRgb);
		setHexInput(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
	}, [hue, saturation, value]);

	const updateFromSVPicker = useCallback((clientX: number, clientY: number) => {
		if (!svPickerRef.current) return;
		const rect = svPickerRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
		setSaturation(x);
		setValue(1 - y);
	}, []);

	const updateFromHueSlider = useCallback((clientX: number) => {
		if (!hueSliderRef.current) return;
		const rect = hueSliderRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		setHue(x);
	}, []);

	// Mouse handlers for SV picker
	const handleSVMouseDown = (e: React.MouseEvent) => {
		setIsDraggingSV(true);
		updateFromSVPicker(e.clientX, e.clientY);
	};

	// Mouse handlers for hue slider
	const handleHueMouseDown = (e: React.MouseEvent) => {
		setIsDraggingHue(true);
		updateFromHueSlider(e.clientX);
	};

	// Global mouse move/up handlers
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDraggingSV) {
				updateFromSVPicker(e.clientX, e.clientY);
			}
			if (isDraggingHue) {
				updateFromHueSlider(e.clientX);
			}
		};

		const handleMouseUp = () => {
			setIsDraggingSV(false);
			setIsDraggingHue(false);
		};

		if (isDraggingSV || isDraggingHue) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDraggingSV, isDraggingHue, updateFromSVPicker, updateFromHueSlider]);

	const handleRgbChange = (channel: 'r' | 'g' | 'b', valueStr: string) => {
		const val = Math.max(0, Math.min(255, parseInt(valueStr) || 0));
		const newRgb = { ...rgb, [channel]: val };
		setRgb(newRgb);
		const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
		setHue(newHsv.h);
		setSaturation(newHsv.s);
		setValue(newHsv.v);
	};

	const handleHexChange = (hex: string) => {
		setHexInput(hex);
		if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
			const newRgb = hexToRgb(hex);
			setRgb(newRgb);
			const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
			setHue(newHsv.h);
			setSaturation(newHsv.s);
			setValue(newHsv.v);
		}
	};

	const handlePresetClick = (color: string) => {
		const newRgb = hexToRgb(color);
		setRgb(newRgb);
		const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
		setHue(newHsv.h);
		setSaturation(newHsv.s);
		setValue(newHsv.v);
		setHexInput(color);
	};

	const handleConfirm = () => {
		onSelect(rgbToHex(rgb.r, rgb.g, rgb.b));
		onClose();
	};

	const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);
	const hueColor = rgbToHex(...(Object.values(hsvToRgb(hue, 1, 1)) as [number, number, number]));

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
			{/* Visual Color Picker */}
			<div style={{ display: 'flex', gap: '12px' }}>
				{/* Saturation/Value picker */}
				<div
					ref={svPickerRef}
					onMouseDown={handleSVMouseDown}
					style={{
						width: '200px',
						height: '150px',
						position: 'relative',
						cursor: 'crosshair',
						background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, ${hueColor})`,
						borderRadius: '4px',
						border: '1px solid var(--text)',
					}}
				>
					{/* Picker indicator */}
					<div
						style={{
							position: 'absolute',
							left: `${saturation * 100}%`,
							top: `${(1 - value) * 100}%`,
							width: '12px',
							height: '12px',
							border: '2px solid white',
							borderRadius: '50%',
							transform: 'translate(-50%, -50%)',
							boxShadow: '0 0 2px rgba(0,0,0,0.5)',
							pointerEvents: 'none',
						}}
					/>
				</div>

				{/* Current color preview */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<div
						style={{
							width: '60px',
							height: '60px',
							backgroundColor: currentHex,
							borderRadius: '4px',
							border: '1px solid var(--text)',
						}}
					/>
					<div style={{ fontSize: '12px', textAlign: 'center' }}>{currentHex}</div>
				</div>
			</div>

			{/* Hue slider */}
			<div
				ref={hueSliderRef}
				onMouseDown={handleHueMouseDown}
				style={{
					width: '100%',
					height: '20px',
					position: 'relative',
					cursor: 'pointer',
					background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
					borderRadius: '4px',
					border: '1px solid var(--text)',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: `${hue * 100}%`,
						top: '50%',
						width: '6px',
						height: '24px',
						backgroundColor: 'white',
						border: '1px solid black',
						borderRadius: '2px',
						transform: 'translate(-50%, -50%)',
						pointerEvents: 'none',
					}}
				/>
			</div>

			{/* RGB and Hex inputs */}
			<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<span style={{ fontSize: '12px' }}>R:</span>
					<input
						type='number'
						min={0}
						max={255}
						value={rgb.r}
						onChange={e => handleRgbChange('r', e.target.value)}
						style={{ width: '50px' }}
						aria-label='Red'
					/>
				</div>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<span style={{ fontSize: '12px' }}>G:</span>
					<input
						type='number'
						min={0}
						max={255}
						value={rgb.g}
						onChange={e => handleRgbChange('g', e.target.value)}
						style={{ width: '50px' }}
						aria-label='Green'
					/>
				</div>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<span style={{ fontSize: '12px' }}>B:</span>
					<input
						type='number'
						min={0}
						max={255}
						value={rgb.b}
						onChange={e => handleRgbChange('b', e.target.value)}
						style={{ width: '50px' }}
						aria-label='Blue'
					/>
				</div>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<span style={{ fontSize: '12px' }}>Hex:</span>
					<input
						type='text'
						value={hexInput}
						onChange={e => handleHexChange(e.target.value)}
						style={{ width: '80px' }}
						aria-label='Hex color'
					/>
				</div>
			</div>

			{/* Preset palette */}
			<div>
				<div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text)' }}>Presets:</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
					{PRESET_COLORS.map(preset => (
						<button
							key={preset.value}
							onClick={() => handlePresetClick(preset.value)}
							title={preset.label}
							aria-label={`Select ${preset.label}`}
							style={{
								width: '24px',
								height: '24px',
								backgroundColor: preset.value,
								borderRadius: '4px',
								border:
									currentHex.toLowerCase() === preset.value.toLowerCase() ? '2px solid white' : '1px solid var(--text)',
								cursor: 'pointer',
								padding: 0,
							}}
						/>
					))}
				</div>
			</div>

			{/* Action buttons */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
				<Button variant='inline' onClick={onClose} title='Cancel' />
				<Button variant='inline' onClick={handleConfirm} title='Select' />
			</div>
		</div>
	);
};
