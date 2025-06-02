import React, { useState, useEffect } from 'react';
import { FaUsers, FaCrosshairs, FaTimes, FaEdit, FaPlay } from 'react-icons/fa';

import { BasicAttacksModal } from './components/BasicAttacksModal';
import { CharacterCreationModal } from './components/CharacterCreation';
import { CharacterList } from './components/CharacterList';
import { CharacterSheetModal } from './components/CharacterSheet';
import { DiceRollModal } from './components/DiceRollModal';
import { DraggableWindow } from './components/DraggableWindow';
import { BattleGrid } from './components/HexGrid';
import RaceSetupModal from './components/RaceSetupModal';
import { useStore } from './store';
import { Point, Character, CharacterSheet } from './types';
import { findNextWindowPosition } from './utils';

const App = (): React.ReactElement => {
	const [dragState, setDragState] = useState<{
		type: 'none' | 'window' | 'grid' | 'character';
		objectId?: string;
		offset?: Point;
		startPosition?: Point;
	}>({ type: 'none' });

	const windows = useStore(state => state.windows);
	const characters = useStore(state => state.characters);
	const addWindow = useStore(state => state.addWindow);
	const updateGridState = useStore(state => state.updateGridState);
	const updateWindow = useStore(state => state.updateWindow);
	const updateCharacterPos = useStore(state => state.updateCharacterPos);
	const removeWindow = useStore(state => state.removeWindow);
	const gridState = useStore(state => state.gridState);
	const editMode = useStore(state => state.editMode);
	const toggleEditMode = useStore(state => state.toggleEditMode);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (dragState.type === 'window' && dragState.objectId && dragState.offset) {
				const newX = e.clientX - dragState.offset.x;
				const newY = e.clientY - dragState.offset.y;

				updateWindow({
					...windows.find(w => w.id === dragState.objectId)!,
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
						const existingCharacter = characters.find(
							c => c.position?.q === q && c.position?.r === r
						);

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
	}, [
		dragState,
		gridState,
		updateGridState,
		updateWindow,
		windows,
		characters,
		updateCharacterPos,
	]);

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
		addWindow({
			id: window.crypto.randomUUID(),
			title: 'Characters',
			type: 'character-list',
			position: findNextWindowPosition(windows),
		});
	};

	const handleRecenter = () => {
		updateGridState({
			scale: 1,
			offset: { x: 0, y: 0 },
		});
	};

	const handleCloseAllWindows = () => {
		// Close all windows by removing each one
		windows.forEach(window => {
			removeWindow(window.id);
		});
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
							<button onClick={handleOpenCharacterList}>
								<FaUsers /> Characters
							</button>
							<button onClick={toggleEditMode}>
								{editMode ? <FaPlay /> : <FaEdit />}{' '}
								{editMode ? 'Switch to Play' : 'Switch to Edit'}
							</button>
							<button onClick={handleRecenter}>
								<FaCrosshairs /> Re-center
							</button>
							<button onClick={handleCloseAllWindows}>
								<FaTimes /> Close All
							</button>
						</div>
					</div>
				</div>
			</header>
			<main
				style={{
					flex: 1,
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						width: '100vw',
						height: '100%',
						position: 'absolute',
						left: '50%',
						transform: 'translateX(-50%)',
						padding: '0 16px',
						boxSizing: 'border-box',
					}}
				>
					<BattleGrid
						disabled={dragState.type !== 'none'}
						onStartCharacterDrag={handleStartCharacterDrag}
						dragState={dragState}
					/>
				</div>
			</main>
			<footer
				style={{
					padding: '1rem',
					borderTop: '1px solid var(--text)',
					flexShrink: 0,
					marginTop: '-8px',
					width: '1200px',
					margin: '0 auto',
				}}
			>
				<div style={{ margin: '0 auto' }}>
					<p style={{ margin: 0, paddingBottom: '8px' }}>&copy; 2025 - D12 Simulator - Luan Nico</p>
				</div>
			</footer>
			{windows.map(window => (
				<DraggableWindow
					key={window.id}
					window={window}
					onStartDrag={(e: React.MouseEvent) => {
						const rect = e.currentTarget.getBoundingClientRect();
						setDragState({
							type: 'window',
							objectId: window.id,
							offset: {
								x: e.clientX - rect.left,
								y: e.clientY - rect.top,
							},
						});
					}}
				>
					{window.type === 'character-sheet' && window.characterId && (
						<CharacterSheetModal character={characters.find(c => c.id === window.characterId)!} />
					)}
					{window.type === 'character-list' && <CharacterList />}
					{window.type === 'character-creation' && (
						<CharacterCreationModal hexPosition={window.hexPosition} />
					)}
					{window.type === 'race-setup' && window.characterId && (
						<RaceSetupModal
							characterId={window.characterId}
							currentRace={
								CharacterSheet.from(characters.find(c => c.id === window.characterId)?.props || {})
									.race
							}
							onClose={() => removeWindow(window.id)}
						/>
					)}
					{window.type === 'basic-attacks' && window.characterId && (
						<BasicAttacksModal
							attacks={CharacterSheet.from(
								characters.find(c => c.id === window.characterId)?.props || {}
							).getBasicAttacks()}
							characterSheet={CharacterSheet.from(
								characters.find(c => c.id === window.characterId)?.props || {}
							)}
							onClose={() => removeWindow(window.id)}
						/>
					)}
					{window.type === 'dice-roll' && window.modifier !== undefined && window.attributeName && (
						<DiceRollModal
							modifier={window.modifier}
							onClose={() => removeWindow(window.id)}
							attributeName={window.attributeName}
							characterSheet={window.characterSheet}
							initialRollType={window.initialRollType ?? 'Static'}
						/>
					)}
				</DraggableWindow>
			))}
		</div>
	);
};

export default App;
