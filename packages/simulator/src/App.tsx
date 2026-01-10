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
import { useEncounters } from './hooks/useEncounters';
import { useModals } from './hooks/useModals';
import { useStore } from './store';
import { DragState } from './types/ui';
import { Navigator, Route, type RouteState } from './utils/routes';

const getCharacterId = (route: RouteState): string | undefined => {
	if (route.route === Route.Character || route.route === Route.PrintSheet) {
		return route.characterId;
	}
	return undefined;
};

const getEncounterId = (route: RouteState): string | undefined => {
	if (route.route === Route.Encounter) {
		return route.encounterId;
	}
	return undefined;
};

const App = (): React.ReactElement => {
	const [currentRoute, setCurrentRoute] = useState<RouteState>(() => Navigator.parseRoute());
	const [initialCharacterId, setInitialCharacterId] = useState<string | undefined>(() =>
		getCharacterId(Navigator.parseRoute()),
	);
	const [initialEncounterId, setInitialEncounterId] = useState<string | undefined>(() =>
		getEncounterId(Navigator.parseRoute()),
	);
	const [dragState, setDragState] = useState<DragState>({ type: 'none' });

	const gridState = useStore(state => state.gridState);
	const updateGridState = useStore(state => state.updateGridState);
	const modals = useStore(state => state.modals);
	const { closeAllModals, updateModal, openOmniBoxModal } = useModals();
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);

	const { findEncounter } = useEncounters();

	// Handle browser navigation (back/forward buttons)
	useEffect(() => {
		const handleHashChange = () => {
			const route = Navigator.parseRoute();
			setCurrentRoute(route);
			setInitialCharacterId(getCharacterId(route));
			setInitialEncounterId(getEncounterId(route));
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	useEffect(() => {
		const omniSearchHandler = (e: KeyboardEvent) => {
			const isControl = e.ctrlKey || e.metaKey;
			if (isControl && e.key.toLowerCase() === 'o') {
				e.preventDefault();
				const encounterId = getEncounterId(currentRoute);
				const characterId =
					getCharacterId(currentRoute) ?? findEncounter(encounterId)?.turnTracker?.currentTurnCharacterId;
				const context = { encounterId, characterId };
				openOmniBoxModal({ context });
			}
		};

		window.addEventListener('keydown', omniSearchHandler);
		return () => window.removeEventListener('keydown', omniSearchHandler);
	}, [currentRoute, findEncounter, openOmniBoxModal]);

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

	const hasHeaderAndFooter = (route: Route): boolean => {
		return ![Route.Onboarding, Route.PrintSheet, Route.Encounter].includes(route);
	};

	if (currentRoute.route === Route.PrintSheet) {
		return <PrintFriendlyCharacterSheetPage characterId={initialCharacterId!} />;
	} else if (currentRoute.route === Route.PrintActions) {
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
			{hasHeaderAndFooter(currentRoute.route) && (
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
								<Button onClick={() => Navigator.to(Route.Home)} icon={FaHome} title='Home' />
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
						width: currentRoute.route === Route.Onboarding || currentRoute.route === Route.Encounter ? '100%' : '100vw',
						height: '100%',
						position:
							currentRoute.route === Route.Onboarding || currentRoute.route === Route.Encounter
								? 'relative'
								: 'absolute',
						left: currentRoute.route === Route.Onboarding || currentRoute.route === Route.Encounter ? 'auto' : '50%',
						transform:
							currentRoute.route === Route.Onboarding || currentRoute.route === Route.Encounter
								? 'none'
								: 'translateX(-50%)',
						padding: currentRoute.route === Route.Onboarding || currentRoute.route === Route.Encounter ? '0' : '0 16px',
						boxSizing: 'border-box',
					}}
				>
					{currentRoute.route === Route.NotFound && <NotFoundPage />}
					{currentRoute.route === Route.Home && <HomePage />}
					{currentRoute.route === Route.Encounters && <EncountersPage initialEncounterId={undefined} />}
					{currentRoute.route === Route.Encounter && <EncountersPage initialEncounterId={initialEncounterId} />}
					{(currentRoute.route === Route.Characters || currentRoute.route === Route.Character) && (
						<CharacterSheetsPage
							onNavigateToCharacterSheet={id => Navigator.to(Route.Character, { characterId: id })}
							onNavigateToOnboarding={() => Navigator.to(Route.Onboarding)}
							initialCharacterId={initialCharacterId}
						/>
					)}
					{currentRoute.route === Route.Onboarding && (
						<OnboardingPage onNavigateToCharacterSheets={() => Navigator.to(Route.Characters)} />
					)}
				</div>
			</main>
			{hasHeaderAndFooter(currentRoute.route) && (
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
