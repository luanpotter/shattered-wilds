import { CharacterSheet, CheckFactory, Resource } from '@shattered-wilds/commons';
import React, { useState, useCallback, useMemo } from 'react';
import { FaDice, FaPlay, FaStop, FaForward, FaBackward } from 'react-icons/fa6';

import { useStore } from '../../store';
import { TurnTracker, Character } from '../../types/ui';
import { diceRoller } from '../../utils/dice-roller';
import { DiamondIcon } from '../circumstances/ResourceDiamonds';
import { Button } from '../shared/Button';

interface TurnTrackerModalProps {
	encounterId: string;
}

const rollInitiative = async (character: Character): Promise<number> => {
	const characterSheet = CharacterSheet.from(character.props);
	const checkFactory = new CheckFactory({ characterSheet });
	const check = checkFactory.initiative();
	const results = await diceRoller.roll({
		characterName: characterSheet.name,
		check,
		extra: undefined,
		luck: undefined,
		targetDC: undefined,
	});
	return results.total;
};

interface CharacterWithInitiative {
	character: Character;
	initiative: number | null;
}

export const TurnTrackerModal: React.FC<TurnTrackerModalProps> = ({ encounterId }) => {
	const characters = useStore(state => state.characters);
	const encounters = useStore(state => state.encounters);
	const updateEncounter = useStore(state => state.updateEncounter);
	const addModal = useStore(state => state.addModal);

	const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState('');
	const [isRolling, setIsRolling] = useState(false);
	const [rollingCharacterId, setRollingCharacterId] = useState<string | null>(null);

	const encounter = encounters.find(e => e.id === encounterId);
	const encounterCharacterIds = useMemo(
		() => (encounter ? Object.keys(encounter.characterPositions) : []),
		[encounter],
	);

	// Get characters with their initiatives, sorted by initiative (highest first)
	const sortedCharacters = useMemo((): CharacterWithInitiative[] => {
		if (!encounter) return [];
		const turnTracker = encounter.turnTracker;

		const withInitiatives = encounterCharacterIds
			.map(id => {
				const character = characters.find(c => c.id === id);
				const initiative = turnTracker?.initiatives[id] ?? null;
				return { character, initiative };
			})
			.filter((item): item is CharacterWithInitiative => item.character !== undefined);

		// Sort: characters with initiative (highest first), then characters without initiative
		return withInitiatives.sort((a, b) => {
			if (a.initiative === null && b.initiative === null) return 0;
			if (a.initiative === null) return 1;
			if (b.initiative === null) return -1;
			return b.initiative - a.initiative; // Descending order
		});
	}, [encounter, encounterCharacterIds, characters]);

	const currentTurnCharacterId = useMemo(() => {
		if (!encounter?.turnTracker || sortedCharacters.length === 0) return null;
		const sortedWithInit = sortedCharacters.filter(c => c.initiative !== null);
		if (sortedWithInit.length === 0) return null;
		const index = Math.min(encounter.turnTracker.currentTurnIndex, sortedWithInit.length - 1);
		return sortedWithInit[index]?.character.id ?? null;
	}, [encounter?.turnTracker, sortedCharacters]);

	const handleBeginEncounter = useCallback(async () => {
		if (!encounter) return;
		setIsRolling(true);

		try {
			const initiativePromises = encounterCharacterIds.map(async id => {
				const character = characters.find(c => c.id === id);
				if (character) {
					const initiative = await rollInitiative(character);
					return { id, initiative };
				}
				return null;
			});

			const results = await Promise.all(initiativePromises);
			const initiatives: Record<string, number | null> = {};
			for (const result of results) {
				if (result) {
					initiatives[result.id] = result.initiative;
				}
			}

			const newTracker: TurnTracker = {
				initiatives,
				currentTurnIndex: 0,
			};

			updateEncounter({
				...encounter,
				turnTracker: newTracker,
			});
		} finally {
			setIsRolling(false);
		}
	}, [encounter, encounterCharacterIds, characters, updateEncounter]);

	const handleEndEncounter = useCallback(() => {
		if (!encounter) return;
		// Show confirmation modal
		addModal({
			id: `confirm-end-encounter-${encounterId}`,
			type: 'confirmation',
			title: 'End Encounter',
			position: { x: 400, y: 300 },
			message: 'Are you sure you want to end this encounter? This will clear all initiative values.',
			confirmText: 'End Encounter',
			cancelText: 'Cancel',
			onConfirm: () => {
				updateEncounter({
					...encounter,
					turnTracker: null,
				});
			},
			onCancel: () => {},
		});
	}, [encounter, encounterId, updateEncounter, addModal]);

	const handleRerollCharacter = useCallback(
		async (characterId: string) => {
			if (!encounter?.turnTracker) return;
			const character = characters.find(c => c.id === characterId);
			if (!character) return;

			setRollingCharacterId(characterId);
			try {
				const newInitiative = await rollInitiative(character);
				updateEncounter({
					...encounter,
					turnTracker: {
						...encounter.turnTracker,
						initiatives: {
							...encounter.turnTracker.initiatives,
							[characterId]: newInitiative,
						},
					},
				});
			} finally {
				setRollingCharacterId(null);
			}
		},
		[encounter, characters, updateEncounter],
	);

	const handleInitiativeChange = useCallback(
		(characterId: string, newValue: number | null) => {
			if (!encounter?.turnTracker) return;

			updateEncounter({
				...encounter,
				turnTracker: {
					...encounter.turnTracker,
					initiatives: {
						...encounter.turnTracker.initiatives,
						[characterId]: newValue,
					},
				},
			});
		},
		[encounter, updateEncounter],
	);

	const handleEditStart = (characterId: string, currentValue: number | null) => {
		setEditingCharacterId(characterId);
		setEditValue(currentValue?.toString() ?? '');
	};

	const handleEditConfirm = () => {
		if (editingCharacterId) {
			const numValue = editValue.trim() === '' ? null : parseInt(editValue, 10);
			handleInitiativeChange(editingCharacterId, isNaN(numValue as number) ? null : numValue);
			setEditingCharacterId(null);
		}
	};

	const handleEditKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleEditConfirm();
		} else if (e.key === 'Escape') {
			setEditingCharacterId(null);
		}
	};

	const handleNextTurn = useCallback(() => {
		if (!encounter?.turnTracker) return;
		const sortedWithInit = sortedCharacters.filter(c => c.initiative !== null);
		if (sortedWithInit.length === 0) return;

		const nextIndex = (encounter.turnTracker.currentTurnIndex + 1) % sortedWithInit.length;
		updateEncounter({
			...encounter,
			turnTracker: {
				...encounter.turnTracker,
				currentTurnIndex: nextIndex,
			},
		});
	}, [encounter, sortedCharacters, updateEncounter]);

	const handlePrevTurn = useCallback(() => {
		if (!encounter?.turnTracker) return;
		const sortedWithInit = sortedCharacters.filter(c => c.initiative !== null);
		if (sortedWithInit.length === 0) return;

		const prevIndex = (encounter.turnTracker.currentTurnIndex - 1 + sortedWithInit.length) % sortedWithInit.length;
		updateEncounter({
			...encounter,
			turnTracker: {
				...encounter.turnTracker,
				currentTurnIndex: prevIndex,
			},
		});
	}, [encounter, sortedCharacters, updateEncounter]);

	if (!encounter) {
		return <div style={{ padding: '1rem' }}>Encounter not found</div>;
	}

	const turnTracker = encounter.turnTracker;
	const isEncounterActive = turnTracker !== null;

	return (
		<div style={{ padding: '1rem', minWidth: '320px', maxWidth: '400px' }}>
			{!isEncounterActive ? (
				<div style={{ textAlign: 'center' }}>
					<p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
						No encounter in progress. Begin an encounter to roll initiative for all characters.
					</p>
					<Button
						onClick={handleBeginEncounter}
						icon={FaPlay}
						title={isRolling ? 'Rolling...' : 'Begin Encounter'}
						disabled={encounterCharacterIds.length === 0 || isRolling}
					/>
					{encounterCharacterIds.length === 0 && (
						<p style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.85rem' }}>
							Add characters to the encounter first
						</p>
					)}
				</div>
			) : (
				<>
					{/* Turn Controls */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							gap: '0.5rem',
							marginBottom: '1rem',
							paddingBottom: '1rem',
							borderBottom: '1px solid var(--text-muted)',
						}}
					>
						<Button onClick={handlePrevTurn} icon={FaBackward} tooltip='Previous Turn' title='' />
						<Button onClick={handleNextTurn} icon={FaForward} tooltip='Next Turn' title='' />
					</div>

					{/* Initiative List */}
					<div style={{ marginBottom: '1rem' }}>
						<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Initiative Order</span>
						{sortedCharacters.length === 0 ? (
							<p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters in encounter</p>
						) : (
							<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
								{sortedCharacters.map(({ character, initiative }) => {
									const isCurrentTurn = character.id === currentTurnCharacterId;
									const isEditing = editingCharacterId === character.id;
									const characterSheet = CharacterSheet.from(character.props);
									const actionPoints = characterSheet.getResource(Resource.ActionPoint);

									return (
										<li
											key={character.id}
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '0.5rem',
												borderRadius: '4px',
												backgroundColor: isCurrentTurn ? 'var(--accent-alpha)' : 'transparent',
												border: `2px solid ${isCurrentTurn ? 'var(--accent)' : 'transparent'}`,
												marginBottom: '0.25rem',
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<span
													style={{
														color: isCurrentTurn ? 'var(--accent)' : 'transparent',
														fontWeight: 'bold',
													}}
												>
													▶
												</span>
												<span style={{ fontWeight: isCurrentTurn ? 'bold' : 'normal' }}>{character.props.name}</span>
											</div>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: 4 }}>
													{Array.from({ length: actionPoints.max }).map((_, i) => (
														<DiamondIcon key={i} filled={i < actionPoints.current} color='#E53935' size={14} />
													))}
												</div>
												{isEditing ? (
													<input
														type='number'
														value={editValue}
														onChange={e => setEditValue(e.target.value)}
														onBlur={handleEditConfirm}
														onKeyDown={handleEditKeyDown}
														// eslint-disable-next-line jsx-a11y/no-autofocus
														autoFocus
														style={{
															width: '60px',
															padding: '0.25rem',
															textAlign: 'center',
															border: '1px solid var(--accent)',
															borderRadius: '4px',
															backgroundColor: 'var(--background)',
															color: 'var(--text)',
														}}
													/>
												) : (
													<button
														type='button'
														onClick={() => handleEditStart(character.id, initiative)}
														style={{
															minWidth: '40px',
															textAlign: 'center',
															cursor: 'pointer',
															padding: '0.25rem 0.5rem',
															borderRadius: '4px',
															backgroundColor: 'var(--background-muted)',
															fontWeight: 'bold',
															color: initiative === null ? 'var(--text-muted)' : 'var(--text)',
															border: 'none',
														}}
														title='Click to edit'
													>
														{initiative ?? '—'}
													</button>
												)}
												<Button
													onClick={() => handleRerollCharacter(character.id)}
													icon={FaDice}
													variant='inline'
													tooltip='Re-roll initiative'
													disabled={rollingCharacterId === character.id}
												/>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{/* End Encounter Button */}
					<div style={{ textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--text-muted)' }}>
						<Button onClick={handleEndEncounter} icon={FaStop} title='End Encounter' />
					</div>
				</>
			)}
		</div>
	);
};
