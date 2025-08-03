import React, { useState, useEffect } from 'react';
import { FaUsers, FaCrosshairs, FaTimes, FaEdit, FaPlay, FaHome } from 'react-icons/fa';

import { CharacterSheetsPage } from './components/CharacterSheetsPage';
import { BattleGrid } from './components/HexGrid';
import { OnboardingPage } from './components/OnboardingPage';
import { Button } from './components/shared/Button';
import { ModalComponent } from './components/Window';
import { useModals } from './hooks/useModals';
import { useStore } from './store';
import { Point, Character, DragState } from './types';

type ViewType = 'simulator' | 'character-sheets' | 'onboarding';

const getInitialView = (): ViewType => {
	const hash = window.location.hash.slice(1); // Remove the # prefix
	if (hash === '/characters' || hash.startsWith('/characters/')) {
		return 'character-sheets';
	}
	if (hash === '/onboarding') {
		return 'onboarding';
	}
	return 'simulator';
};

const getInitialCharacterId = (): string | null => {
	const hash = window.location.hash.slice(1); // Remove the # prefix
	const match = hash.match(/^\/characters\/(.+)$/);
	return match ? match[1] : null;
};

const App = (): React.ReactElement => {
	const [currentView, setCurrentView] = useState<ViewType>(getInitialView());
	const [initialCharacterId, setInitialCharacterId] = useState<string | null>(getInitialCharacterId());
	const [dragState, setDragState] = useState<DragState>({ type: 'none' });

	const characters = useStore(state => state.characters);
	const updateGridState = useStore(state => state.updateGridState);
	const updateCharacterPos = useStore(state => state.updateCharacterPos);
	const gridState = useStore(state => state.gridState);
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);
	const modals = useStore(state => state.modals);
	const { openCharacterListModal, closeAllModals, updateModal } = useModals();

	// Handle browser navigation (back/forward buttons)
	useEffect(() => {
		const handleHashChange = () => {
			setCurrentView(getInitialView());
			setInitialCharacterId(getInitialCharacterId());
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	// Navigation functions with URL updates

	const navigateToCharacterSheets = () => {
		window.location.hash = '#/characters';
		setCurrentView('character-sheets');
		setInitialCharacterId(null);
	};

	const navigateToCharacterSheet = (characterId: string) => {
		window.location.hash = `#/characters/${characterId}`;
		setCurrentView('character-sheets');
		setInitialCharacterId(characterId);
	};

	const navigateToOnboarding = () => {
		window.location.hash = '#/onboarding';
		setCurrentView('onboarding');
		setInitialCharacterId(null);
	};

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
			} else if (dragState.type === 'character' && dragState.objectId) {
				// Just update the mouse position for the ghost token
				setDragState(prev => ({
					...prev,
					startPosition: { x: e.clientX, y: e.clientY },
				}));
			}
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (dragState.type === 'character' && dragState.objectId) {
				// Find the character
				const character = characters.find(c => c.id === dragState.objectId);
				if (!character) {
					setDragState({ type: 'none' });
					return;
				}

				// Find the hex under the mouse
				const element = document.elementFromPoint(e.clientX, e.clientY);
				if (!element) {
					setDragState({ type: 'none' });
					return;
				}

				// Try to find the closest element with data-hex attribute
				let current = element;
				while (current && !current.hasAttribute('data-hex') && current.parentElement) {
					current = current.parentElement;
				}

				if (current && current.hasAttribute('data-hex')) {
					const hexData = current.getAttribute('data-hex');
					if (hexData) {
						const [q, r] = hexData.split(',').map(Number);
						const existingCharacter = characters.find(c => c.position?.q === q && c.position?.r === r);

						if (!existingCharacter) {
							updateCharacterPos(character, { q, r });
						}
					}
				}
			}

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
	}, [dragState, gridState, updateGridState, updateModal, modals, characters, updateCharacterPos]);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 1) {
			// Middle click for grid
			e.preventDefault();
			e.stopPropagation();
			setDragState({ type: 'grid' });
		}
	};

	const handleStartCharacterDrag = (character: Character, startPosition: Point) => {
		setDragState({
			type: 'character',
			objectId: character.id,
			startPosition,
		});
	};

	const handleOpenCharacterList = () => {
		openCharacterListModal();
	};

	const handleRecenter = () => {
		updateGridState({
			scale: 1,
			offset: { x: 0, y: 0 },
		});
	};

	const handleCloseAllModals = () => {
		closeAllModals();
	};

	return (
		<div
			style={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				margin: 0,
				padding: 0,
				overflow: 'hidden',
				width: '100%',
			}}
			onMouseDown={handleMouseDown}
			onMouseLeave={() => setDragState({ type: 'none' })}
		>
			{currentView !== 'onboarding' && (
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
								<Button onClick={() => (window.location.href = '/')} icon={FaHome} title='Back to Site' />
								<Button onClick={handleOpenCharacterList} icon={FaUsers} title='Characters' />
								<Button
									onClick={toggleEditMode}
									icon={editMode ? FaPlay : FaEdit}
									title={editMode ? 'Switch to Play' : 'Switch to Edit'}
								/>
								<Button onClick={handleRecenter} icon={FaCrosshairs} title='Re-center' />
								<Button onClick={handleCloseAllModals} icon={FaTimes} title='Close All' />
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
						width: currentView === 'onboarding' ? '100%' : '100vw',
						height: '100%',
						position: currentView === 'onboarding' ? 'relative' : 'absolute',
						left: currentView === 'onboarding' ? 'auto' : '50%',
						transform: currentView === 'onboarding' ? 'none' : 'translateX(-50%)',
						padding: currentView === 'onboarding' ? '0' : '0 16px',
						boxSizing: 'border-box',
					}}
				>
					{currentView === 'simulator' && (
						<BattleGrid
							disabled={dragState.type !== 'none'}
							onStartCharacterDrag={handleStartCharacterDrag}
							dragState={dragState}
						/>
					)}
					{currentView === 'character-sheets' && (
						<CharacterSheetsPage
							onNavigateToCharacterSheet={navigateToCharacterSheet}
							onNavigateToOnboarding={navigateToOnboarding}
							initialCharacterId={initialCharacterId}
						/>
					)}
					{currentView === 'onboarding' && <OnboardingPage onNavigateToCharacterSheets={navigateToCharacterSheets} />}
				</div>
			</main>
			{currentView !== 'onboarding' && (
				<footer
					style={{
						padding: '1rem',
						borderTop: '1px solid var(--text)',
						flexShrink: 0,
						marginTop: '-8px',
						width: '1200px',
						margin: '0 auto',
						fontSize: '12px',
					}}
				>
					<div style={{ margin: '0 auto', textAlign: 'right' }}>
						<p style={{ margin: 0, paddingBottom: '8px' }}>&copy; 2025 Shattered Wilds - Luan Nico</p>
					</div>
				</footer>
			)}
			{modals.map(modal => (
				<ModalComponent
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
					onNavigateToCharacterSheets={navigateToCharacterSheets}
					onNavigateToCharacterSheet={navigateToCharacterSheet}
				/>
			))}
		</div>
	);
};

export default App;
