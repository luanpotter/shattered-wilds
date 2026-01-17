import { Point } from '@shattered-wilds/commons';
import { ReactNode, useContext } from 'react';

import { TempModalContext, TempModalContextType } from '../contexts/tempModalContext';
import { ModalPositionType } from '../types/ui';
import { Mouse } from '../utils/mouse';

export const useTempModals = (): TempModalContextType => {
	const context = useContext(TempModalContext);
	if (!context) {
		throw new Error('useTempModals must be used within TempModalProvider');
	}
	return context;
};

// Helper type for display modal options
export interface DisplayModalOptions {
	ownerModalId?: string | null;
	title: string;
	content: ReactNode;
	widthPixels?: number;
	heightPixels?: number;
	positionType?: ModalPositionType;
}

// Helper to calculate modal position
export const calculateModalPosition = (
	positionType: ModalPositionType = ModalPositionType.MousePosition,
	widthPixels?: number,
	heightPixels?: number,
): Point => {
	if (positionType === ModalPositionType.ScreenCenter) {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const modalWidth = widthPixels ?? 600;
		const modalHeight = heightPixels ?? 400;

		const yOffset = -150; // prop it up a bit from exact center
		return {
			x: (screenWidth - modalWidth) / 2,
			y: (screenHeight - modalHeight) / 2 + yOffset,
		};
	} else {
		const mousePosition = Mouse.getPosition();
		return Mouse.getAdjustedPosition(
			mousePosition,
			widthPixels && heightPixels ? { width: widthPixels, height: heightPixels } : undefined,
		);
	}
};
