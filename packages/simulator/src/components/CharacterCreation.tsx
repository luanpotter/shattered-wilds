import React, { useState, useEffect } from 'react';

import { useStore } from '../store';
import { HexPosition } from '../types';
import { findNextCharacterNumber } from '../utils';

import { Button } from './shared/Button';

interface CharacterCreationModalProps {
	hexPosition: HexPosition | undefined;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ hexPosition }) => {
	const addCharacter = useStore(state => state.addCharacter);
	const characters = useStore(state => state.characters);
	const removeModal = useStore(state => state.removeModal);
	const modals = useStore(state => state.modals);
	const [characterName, setCharacterName] = useState('');

	// Set default name on mount - use utility function to find next available number
	useEffect(() => {
		const nextNumber = findNextCharacterNumber(characters);
		setCharacterName(`Character ${nextNumber}`);
	}, [characters]);

	const handleCreateCharacter = () => {
		if (characterName.trim()) {
			const newCharacter = {
				id: window.crypto.randomUUID(),
				props: {
					name: characterName.trim(),
				},
			};

			// If we have hex position, add it to the character
			if (hexPosition) {
				Object.assign(newCharacter, { position: hexPosition });
			}

			addCharacter(newCharacter);

			// Find and close this modal
			const currentModal = modals.find(
				modal =>
					modal.type === 'character-creation' &&
					(hexPosition
						? modal.hexPosition?.q === hexPosition.q && modal.hexPosition?.r === hexPosition.r
						: !modal.hexPosition),
			);

			if (currentModal) {
				removeModal(currentModal.id);
			}
		}
	};

	const handleCancel = () => {
		// Find and close this modal
		const currentModal = modals.find(
			modal =>
				modal.type === 'character-creation' &&
				(hexPosition
					? modal.hexPosition?.q === hexPosition.q && modal.hexPosition?.r === hexPosition.r
					: !modal.hexPosition),
		);

		if (currentModal) {
			removeModal(currentModal.id);
		}
	};

	return (
		<div>
			<div style={{ marginBottom: '8px' }}>
				<label htmlFor='character-name' style={{ fontSize: '0.9em', display: 'block', marginBottom: '2px' }}>
					Name:
				</label>
				<input
					id='character-name'
					type='text'
					value={characterName}
					onChange={e => setCharacterName(e.target.value)}
					style={{
						width: 'calc(100% - 8px)',
						boxSizing: 'border-box',
						padding: '4px',
						fontSize: '0.9em',
					}}
				/>
			</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
				<Button onClick={handleCancel} title='Cancel' variant='inline' />
				<Button onClick={handleCreateCharacter} title='Create' variant='inline' />
			</div>
		</div>
	);
};
