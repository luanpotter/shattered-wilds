import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';
import { findNextWindowPosition, findNextEmptyHexPosition } from '../utils';

export const CharacterList: React.FC = () => {
	const characters = useStore(state => state.characters);
	const windows = useStore(state => state.windows);
	const addWindow = useStore(state => state.addWindow);
	const removeCharacter = useStore(state => state.removeCharacter);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const handleOpenNewCharacterModal = () => {
		const hexPosition = findNextEmptyHexPosition(characters);

		addWindow({
			id: window.crypto.randomUUID(),
			title: `Create Character (${hexPosition.q}, ${hexPosition.r})`,
			type: 'character-creation',
			position: findNextWindowPosition(windows),
			hexPosition: hexPosition,
		});
	};

	const handleOpenCharacterSheet = (character: Character) => {
		addWindow({
			id: window.crypto.randomUUID(),
			title: `${character.props.name}'s Sheet`,
			type: 'character-sheet',
			characterId: character.id,
			position: findNextWindowPosition(windows),
		});
	};

	const handleRequestDelete = (id: string) => {
		setConfirmDelete(id);
	};

	const handleConfirmDelete = () => {
		if (confirmDelete) {
			removeCharacter(confirmDelete);
			setConfirmDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setConfirmDelete(null);
	};

	return (
		<div>
			{confirmDelete && (
				<div
					style={{
						padding: '6px',
						marginBottom: '8px',
						backgroundColor: 'var(--background-alt)',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						fontSize: '0.9em',
					}}
				>
					<p style={{ margin: '0 0 6px 0' }}>
						Delete {characters.find(c => c.id === confirmDelete)?.props.name}?
					</p>
					<div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
						<button onClick={handleCancelDelete} style={{ padding: '2px 6px', fontSize: '0.9em' }}>
							Cancel
						</button>
						<button
							onClick={handleConfirmDelete}
							style={{
								padding: '2px 6px',
								fontSize: '0.9em',
								backgroundColor: 'var(--error)',
								color: 'white',
							}}
						>
							Delete
						</button>
					</div>
				</div>
			)}
			<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
				<button
					onClick={handleOpenNewCharacterModal}
					style={{ padding: '4px 8px', fontSize: '0.9em' }}
				>
					<FaPlus /> New Character
				</button>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9em' }}>
				{characters.map(character => (
					<div
						key={character.id}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '4px 6px',
							border: '1px solid var(--text)',
							borderRadius: '4px',
						}}
					>
						<span>{character.props.name}</span>
						<div style={{ display: 'flex', gap: '4px' }}>
							<button
								onClick={() => handleOpenCharacterSheet(character)}
								style={{ padding: '2px 6px', fontSize: '0.9em' }}
							>
								<FaEdit /> Edit
							</button>
							<button
								onClick={() => handleRequestDelete(character.id)}
								style={{
									padding: '2px 6px',
									fontSize: '0.9em',
								}}
							>
								<FaTrash /> Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
