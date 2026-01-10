import { CharacterSheet, CheckFactory, Resource } from '@shattered-wilds/d12';
import React, { useCallback, useMemo, useState } from 'react';
import { FaBackward, FaDice, FaForward, FaPlay, FaStop } from 'react-icons/fa6';

import { useEncounters } from '../../hooks/useEncounters';
import { useModals } from '../../hooks/useModals';
import { useResetCharacterAP } from '../../hooks/useResetCharacterAP';
import { useTurnTrackerHooks } from '../../hooks/useTurnTrackerHooks';
import { useStore } from '../../store';
import { Character, TurnTracker } from '../../types/ui';
import { semanticClick } from '../../utils';
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

	const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState('');
	const [isRolling, setIsRolling] = useState(false);
	const [rollingCharacterId, setRollingCharacterId] = useState<string | null>(null);

	const { openConfirmationModal, openCharacterSheetModal } = useModals();

	const { updateEncounter, findEncounter } = useEncounters();
	const encounter = findEncounter(encounterId);

	const encounterCharacterIds = useMemo(
		() => (encounter ? Object.keys(encounter.characterPositions) : []),
		[encounter],
	);

	const { sortCharactersByInitiative, endTurn } = useTurnTrackerHooks();

	const sortedCharacters = useMemo((): CharacterWithInitiative[] => {
		return encounter ? sortCharactersByInitiative(encounter) : [];
	}, [sortCharactersByInitiative, encounter]);

	const resetCharacterAP = useResetCharacterAP();

	const handleBeginEncounter = useCallback(async () => {
		if (!encounter) return;
		setIsRolling(true);

		try {
			encounterCharacterIds.forEach(resetCharacterAP);

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

			// Sort by initiative descending, pick first character as current
			const sorted = Object.entries(initiatives)
				.filter(([, init]) => init !== null)
				.sort((a, b) => (b[1]! as number) - (a[1]! as number));
			const firstCharacterId = sorted.length > 0 ? sorted[0][0] : undefined;

			const newTracker: TurnTracker = {
				initiatives,
				currentTurnCharacterId: firstCharacterId,
			};

			updateEncounter({
				...encounter,
				turnTracker: newTracker,
			});
		} finally {
			setIsRolling(false);
		}
	}, [encounter, encounterCharacterIds, updateEncounter, characters, resetCharacterAP]);

	const handleEndEncounter = useCallback(async () => {
		if (!encounter) return;

		const confirmed = await openConfirmationModal({
			title: 'End Encounter',
			message: ['Are you sure you want to end this encounter?', 'This will clear all initiative values.'].join('\n\n'),
			confirmText: 'End Encounter',
		});
		if (confirmed) {
			updateEncounter({
				...encounter,
				turnTracker: null,
			});
		}
	}, [encounter, openConfirmationModal, updateEncounter]);

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

	const handlePrevTurn = useCallback(() => {
		if (!encounter?.turnTracker) return;
		const sortedWithInit = sortedCharacters.filter(c => c.initiative !== null);
		if (sortedWithInit.length === 0) return;

		// Find current index
		const currentTurnCharacterId = encounter.turnTracker?.currentTurnCharacterId ?? null;
		const currentIdx = sortedWithInit.findIndex(c => c.character.id === currentTurnCharacterId);
		const prevIndex = (currentIdx - 1 + sortedWithInit.length) % sortedWithInit.length;
		const prevCharacterId = sortedWithInit[prevIndex]?.character.id ?? null;
		updateEncounter({
			...encounter,
			turnTracker: {
				...encounter.turnTracker!, // non-null, checked above
				currentTurnCharacterId: prevCharacterId,
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
						<Button onClick={handlePrevTurn} icon={FaBackward} tooltip='Revert Turn' title='Revert Turn' />
						<Button onClick={() => endTurn(encounter)} icon={FaForward} tooltip='End Turn' title='End Turn' />
					</div>

					{/* Initiative List */}
					<div style={{ marginBottom: '1rem' }}>
						<span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Initiative Order</span>
						{sortedCharacters.length === 0 ? (
							<p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters in encounter</p>
						) : (
							<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
								{sortedCharacters.map(({ character, initiative }) => {
									const isCurrentTurn = character.id === encounter?.turnTracker?.currentTurnCharacterId;
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
												<span
													{...semanticClick('button', () => {
														openCharacterSheetModal({ characterId: character.id });
													})}
													style={{ fontWeight: isCurrentTurn ? 'bold' : 'normal', cursor: 'pointer' }}
												>
													{character.props.name}
												</span>
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
