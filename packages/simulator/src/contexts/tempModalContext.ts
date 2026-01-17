import { Point } from '@shattered-wilds/commons';
import { createContext, ReactNode } from 'react';

// Types for temporary modals
export interface TempModal<T = void> {
	id: string;
	ownerModalId: string | null;
	title: string;
	position: Point;
	widthPixels?: number | undefined;
	heightPixels?: number | undefined;
	content: ReactNode;
	resolve: (value: T) => void;
}

export interface TempModalContextType {
	tempModals: TempModal<unknown>[];
	addTempModal: <T>(modal: Omit<TempModal<T>, 'id'>) => string;
	removeTempModal: (id: string) => void;
	updateTempModal: (id: string, updates: Partial<Pick<TempModal, 'position'>>) => void;
	closeTempModalsOwnedBy: (ownerModalId: string) => void;
}

export const TempModalContext = createContext<TempModalContextType | null>(null);
