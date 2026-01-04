import React, { useEffect, useState } from 'react';
import { FaArrowAltCircleLeft, FaEdit, FaHome, FaPlay, FaTimes } from 'react-icons/fa';

import { ModalRenderer } from './components/ModalRenderer';
import { CharacterSheetsPage } from './components/pages/CharacterSheetsPage';
import { EncountersPage } from './components/pages/EncountersPage';
import { HomePage } from './components/pages/HomePage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { OnboardingPage } from './components/pages/OnboardingPage';
import { PrintFriendlyActions } from './components/pages/PrintFriendlyActions';
import { PrintFriendlyCharacterSheetPage } from './components/pages/PrintFriendlyCharacterSheetPage';
import { Button } from './components/shared/Button';
import { useModals } from './hooks/useModals';
import { useStore } from './store';
import { DragState } from './types/ui';
import { Navigator, type ViewType } from './utils/routes';

const App = (): React.ReactElement => {
	const [currentView, setCurrentView] = useState<ViewType>(() => Navigator.parseRoute().view);
	const [initialCharacterId, setInitialCharacterId] = useState<string | null>(
		() => Navigator.parseRoute().characterId || null,
	);
	const [initialEncounterId, setInitialEncounterId] = useState<string | null>(
		() => Navigator.parseRoute().encounterId || null,
	);
	const [dragState, setDragState] = useState<DragState>({ type: 'none' });

	const gridState = useStore(state => state.gridState);
	const updateGridState = useStore(state => state.updateGridState);
	const modals = useStore(state => state.modals);
	const { closeAllModals, updateModal } = useModals();
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);

	// Handle browser navigation (back/forward buttons)
	useEffect(() => {
		const handleHashChange = () => {
			const route = Navigator.parseRoute();
			setCurrentView(route.view);
			setInitialCharacterId(route.characterId || null);
			setInitialEncounterId(route.encounterId || null);
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (dragState.type === 'modal' && dragState.objectId && dragState.offset) {
				const newX = e.clientX - dragState.offset.x;
				const newY = e.clientY - dragState.offset.y;

				updateModal({
					...modals.find(modal => modal.id === dragState.objectId)!,
					position: { x: newX, y: newY },
				});
			} else if (dragState.type === 'grid') {
				const dx = e.movementX;
				const dy = e.movementY;

				const currentScale = gridState.scale;
				const currentOffset = gridState.offset;

				updateGridState({
					...gridState,
					offset: {
						x: currentOffset.x + dx / currentScale,
						y: currentOffset.y + dy / currentScale,
					},
				});
			}
		};

		const handleMouseUp = () => {
			setDragState({ type: 'none' });
		};

		if (dragState.type !== 'none') {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}

		return () => {};
	}, [dragState, gridState, updateGridState, updateModal, modals]);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 1) {
			const tag = (e.target as HTMLElement).tagName.toLowerCase();
			if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'textarea' || tag === 'select') {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			setDragState({ type: 'grid' });
		}
	};

	const hasHeaderAndFooter = (view: ViewType): boolean => {
		return !['onboarding', 'print-sheet', 'encounter'].includes(view);
	};

	if (currentView === 'print-sheet') {
		return <PrintFriendlyCharacterSheetPage characterId={initialCharacterId!} />;
	} else if (currentView === 'print-actions') {
		return <PrintFriendlyActions />;
	}

	return (
		<div
			style={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				margin: 0,
				padding: 0,
				width: '100%',
			}}
			onMouseDown={handleMouseDown}
			onMouseLeave={() => setDragState({ type: 'none' })}
		>
			{hasHeaderAndFooter(currentView) && (
				<header
					style={{
						padding: '1rem',
						borderBottom: '1px solid var(--text)',
						flexShrink: 0,
						width: '1200px',
						margin: '0 auto',
					}}
				>
					<div style={{ margin: '0 auto' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<h1 style={{ margin: 0 }}>D12 Simulator</h1>
							<div style={{ display: 'flex', gap: '1rem' }}>
								<Button
									onClick={toggleEditMode}
									icon={editMode ? FaPlay : FaEdit}
									title={editMode ? 'To Play Mode' : 'To Edit Mode'}
								/>
								<Button onClick={closeAllModals} icon={FaTimes} title='Close All' />
								<Button onClick={Navigator.toHome} icon={FaHome} title='Home' />
								<Button onClick={Navigator.toSite} icon={FaArrowAltCircleLeft} title='Site' />
							</div>
						</div>
					</div>
				</header>
			)}
			<main
				style={{
					flex: 1,
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						width: currentView === 'onboarding' || currentView === 'encounter' ? '100%' : '100vw',
						height: '100%',
						position: currentView === 'onboarding' || currentView === 'encounter' ? 'relative' : 'absolute',
						left: currentView === 'onboarding' || currentView === 'encounter' ? 'auto' : '50%',
						transform: currentView === 'onboarding' || currentView === 'encounter' ? 'none' : 'translateX(-50%)',
						padding: currentView === 'onboarding' || currentView === 'encounter' ? '0' : '0 16px',
						boxSizing: 'border-box',
					}}
				>
					{currentView === '404' && <NotFoundPage />}
					{currentView === 'home' && <HomePage />}
					{currentView === 'encounters' && <EncountersPage initialEncounterId={null} />}
					{currentView === 'encounter' && <EncountersPage initialEncounterId={initialEncounterId} />}
					{currentView === 'character-sheets' && (
						<CharacterSheetsPage
							onNavigateToCharacterSheet={Navigator.toCharacterSheet}
							onNavigateToOnboarding={Navigator.toOnboarding}
							initialCharacterId={initialCharacterId}
						/>
					)}
					{currentView === 'onboarding' && <OnboardingPage onNavigateToCharacterSheets={Navigator.toCharacterSheets} />}
				</div>
			</main>
			{hasHeaderAndFooter(currentView) && (
				<footer
					style={{
						borderTop: '1px solid var(--text)',
						flexShrink: 0,
						width: '1200px',
						margin: '0 auto',
						fontSize: '12px',
						display: 'flex',
						justifyContent: 'right',
						marginBottom: '8px',
					}}
				>
					<p style={{ margin: 0, padding: 0 }}>&copy; 2025 Shattered Wilds - Luan Nico</p>
				</footer>
			)}
			{modals.map(modal => (
				<ModalRenderer
					key={modal.id}
					modal={modal}
					onStartDrag={(e: React.MouseEvent) => {
						const rect = e.currentTarget.getBoundingClientRect();
						setDragState({
							type: 'modal',
							objectId: modal.id,
							offset: {
								x: e.clientX - rect.left,
								y: e.clientY - rect.top,
							},
						});
					}}
				/>
			))}
		</div>
	);
};

export default App;
