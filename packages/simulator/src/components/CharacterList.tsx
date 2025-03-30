import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

import { useStore } from '../store';
import { Character } from '../types';

export const CharacterList: React.FC = () => {
	const characters = useStore(state => state.characters);
	const addWindow = useStore(state => state.addWindow);
	const removeCharacter = useStore(state => state.removeCharacter);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const handleOpenNewCharacterModal = () => {
		addWindow({
			id: window.crypto.randomUUID(),
			title: 'Create Character',
			type: 'character-creation',
			position: { x: 200, y: 150 },
		});
	};

	const handleOpenCharacterSheet = (character: Character) => {
		addWindow({
			id: window.crypto.randomUUID(),
			title: `${character.name}'s Sheet`,
			type: 'character-sheet',
			characterId: character.id,
			position: { x: 100, y: 100 },
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
						Delete {characters.find(c => c.id === confirmDelete)?.name}?
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
						<span>{character.name}</span>
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
