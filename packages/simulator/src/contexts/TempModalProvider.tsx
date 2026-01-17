import React, { useState, useCallback, ReactNode, useRef, useEffect } from 'react';

import { TempModal, TempModalContext, TempModalContextType } from './tempModalContext';

export const TempModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [tempModals, setTempModals] = useState<TempModal<unknown>[]>([]);

	// Use ref to track modals for closure purposes
	const tempModalsRef = useRef<TempModal<unknown>[]>([]);
	useEffect(() => {
		tempModalsRef.current = tempModals;
	}, [tempModals]);

	const addTempModal = useCallback(<T,>(modal: Omit<TempModal<T>, 'id'>): string => {
		const id = window.crypto.randomUUID();
		setTempModals(prev => [...prev, { ...modal, id } as TempModal<unknown>]);
		return id;
	}, []);

	const removeTempModal = useCallback((id: string) => {
		setTempModals(prev => {
			const modal = prev.find(m => m.id === id);
			if (modal) {
				// Resolve with undefined when closed without explicit result
				modal.resolve(undefined);
			}
			return prev.filter(m => m.id !== id);
		});
	}, []);

	const updateTempModal = useCallback((id: string, updates: Partial<Pick<TempModal, 'position'>>) => {
		setTempModals(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
	}, []);

	const closeTempModalsOwnedBy = useCallback((ownerModalId: string) => {
		setTempModals(prev => {
			const toClose = prev.filter(m => m.ownerModalId === ownerModalId);
			// Resolve all with undefined
			toClose.forEach(m => m.resolve(undefined));
			return prev.filter(m => m.ownerModalId !== ownerModalId);
		});
	}, []);

	const contextValue: TempModalContextType = {
		tempModals,
		addTempModal,
		removeTempModal,
		updateTempModal,
		closeTempModalsOwnedBy,
	};

	return <TempModalContext.Provider value={contextValue}>{children}</TempModalContext.Provider>;
};
