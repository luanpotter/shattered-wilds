import {
	ARCANE_SPELL_COMPONENTS,
	ArcaneSpellComponentType,
	ArcaneSpellDefinition,
	Bonus,
	Check,
	CheckMode,
	CheckNature,
	CircumstanceModifier,
	DerivedStatType,
	Distance,
	ModifierSource,
	PREDEFINED_ARCANE_SPELLS,
	StatModifier,
	StatTree,
	StatType,
} from '@shattered-wilds/commons';
import React, { useMemo } from 'react';
import { FaDice } from 'react-icons/fa';

import { useModals } from '../hooks/useModals';
import { useUIStateFactory } from '../hooks/useUIState';
import { useStore } from '../store';
import { Character, CharacterSheet } from '../types';
import { numberToOrdinal } from '../utils';

import Block from './shared/Block';
import LabeledDropdown from './shared/LabeledDropdown';
import LabeledInput from './shared/LabeledInput';
import { ParameterBoxComponent } from './shared/ParameterBoxComponent';
import { RichText } from './shared/RichText';

interface ArcaneSectionProps {
	characterId: string;
}

export const ArcaneSection: React.FC<ArcaneSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);
	const tree = sheet.getStatTree();

	const { primaryAttribute } = sheet.characterClass.definition;
	if (!StatType.mindAttributes.includes(primaryAttribute.name)) {
		return null; // not a caster
	}

	return <ArcaneSectionInner character={character} sheet={sheet} tree={tree} primaryAttribute={primaryAttribute} />;
};

const ArcaneSectionInner: React.FC<{
	character: Character;
	sheet: CharacterSheet;
	tree: StatTree;
	primaryAttribute: StatType;
}> = ({ character, sheet, tree, primaryAttribute }) => {
	const { useState, useStateArrayItem } = useUIStateFactory(`actions-${character.id}`);
	const [selectedRange, setSelectedRange] = useState<Distance>('selectedRange', Distance.of(0));

	const components = Object.groupBy(
		ARCANE_SPELL_COMPONENTS.filter(component => component.flavors.includes(sheet.characterClass.definition.flavor)),
		component => component.type,
	);
	const [selectedSomaticComponent, setSelectedSomaticComponent] = useStateArrayItem(
		'selectedSomaticComponent',
		components[ArcaneSpellComponentType.Somatic] ?? [],
		null,
	);
	const [selectedVerbalComponent, setSelectedVerbalComponent] = useStateArrayItem(
		'selectedVerbalComponent',
		components[ArcaneSpellComponentType.Verbal] ?? [],
		null,
	);
	const [selectedFocalComponent, setSelectedFocalComponent] = useStateArrayItem(
		'selectedFocalComponent',
		components[ArcaneSpellComponentType.Focal] ?? [],
		null,
	);

	const influenceRange = tree.getDistance(DerivedStatType.InfluenceRange);
	const rangeIncrementModifier = useMemo(() => {
		const rangeIncrements = Math.max(0, Math.floor((selectedRange.value - 1) / influenceRange.value.value));

		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});
	}, [influenceRange, selectedRange]);

	const combinedModifiers = [
		rangeIncrementModifier,
		selectedSomaticComponent?.toComponentModifier(),
		selectedVerbalComponent?.toComponentModifier(),
		selectedFocalComponent?.toComponentModifier(),
	].filter(e => e !== undefined);
	const baseModifier = tree.getModifier(primaryAttribute);
	const combinedModifier = tree.getModifier(primaryAttribute, combinedModifiers);

	const componentsWithState = [
		{
			type: ArcaneSpellComponentType.Somatic,
			get: selectedSomaticComponent,
			set: setSelectedSomaticComponent,
			options: components[ArcaneSpellComponentType.Somatic],
		},
		{
			type: ArcaneSpellComponentType.Verbal,
			get: selectedVerbalComponent,
			set: setSelectedVerbalComponent,
			options: components[ArcaneSpellComponentType.Verbal],
		},
		{
			type: ArcaneSpellComponentType.Focal,
			get: selectedFocalComponent,
			set: setSelectedFocalComponent,
			options: components[ArcaneSpellComponentType.Focal],
		},
	];

	return (
		<Block>
			<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Arcane</h3>
			<div style={{ display: 'flex', gap: '8px' }}>
				<LabeledInput
					variant='normal'
					label='Base Modifier'
					value={`${baseModifier.name} (${baseModifier.value.description})`}
					tooltip={baseModifier.description}
					disabled
				/>
				<LabeledInput
					variant='normal'
					label='Range Increment'
					tooltip={influenceRange.description}
					value={influenceRange.value.description}
					disabled
				/>
				<LabeledInput
					label='Target (Hexes)'
					value={selectedRange?.value.toString() ?? ''}
					onBlur={value => {
						const parsedValue = (() => {
							const parsedValue = parseInt(value);
							if (isNaN(parsedValue) || parsedValue < 0) {
								return 0;
							}
							return parsedValue;
						})();
						setSelectedRange(Distance.of(parsedValue));
					}}
				/>
				{componentsWithState.map(({ type, get, set, options }) =>
					options && options.length > 1 ? (
						<LabeledDropdown
							key={type}
							variant='normal'
							label={`${type} Component`}
							value={get}
							options={options}
							describe={component => component.name}
							onChange={set}
						/>
					) : null,
				)}
				<LabeledInput
					label='Combined Modifier'
					value={combinedModifier.value.description}
					tooltip={combinedModifier.description}
					disabled
				/>
			</div>
			<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{Object.values(PREDEFINED_ARCANE_SPELLS).map(spell => {
					return (
						<SpellBox
							key={spell.name}
							character={character}
							tree={tree}
							primaryAttribute={primaryAttribute}
							spell={spell}
							combinedModifiers={combinedModifiers}
						/>
					);
				})}
			</div>
		</Block>
	);
};

const SpellCheckBox: React.FC<{
	character: Character;
	finalModifier: StatModifier;
}> = ({ character, finalModifier }) => {
	const { openDiceRollModal } = useModals();

	return (
		<ParameterBoxComponent
			title={`${finalModifier.name} (${finalModifier.value.description})`}
			tooltip={finalModifier.description}
			onClick={() => {
				openDiceRollModal({
					characterId: character.id,
					check: new Check({
						mode: CheckMode.Contested,
						nature: CheckNature.Active,
						statModifier: finalModifier,
					}),
					title: `Roll ${finalModifier.name} Check`,
				});
			}}
		>
			{finalModifier.value.description}
			<FaDice size={12} style={{ color: 'var(--text-secondary)' }} />
		</ParameterBoxComponent>
	);
};

const SpellBox: React.FC<{
	character: Character;
	tree: StatTree;
	primaryAttribute: StatType;
	spell: ArcaneSpellDefinition;
	combinedModifiers: CircumstanceModifier[];
}> = ({ character, tree, primaryAttribute, spell, combinedModifiers }) => {
	const { useState } = useUIStateFactory(`actions-${character.id}-spell-${spell.name}`);
	const [augmentationValues, setAugmentationValues] = useState(`augmentationValues`, {} as Record<string, number>);
	const getAugmentationValue = (key: string) => {
		return augmentationValues[key] ?? 1;
	};
	const setAugmentationValue = (key: string, value: number) => {
		setAugmentationValues(prev => ({ ...prev, [key]: value }));
	};

	const finalModifiers = [
		...combinedModifiers,
		...spell.augmentations.map(augmentation => {
			const value = getAugmentationValue(augmentation.key);
			return new CircumstanceModifier({
				source: ModifierSource.Augmentation,
				name: augmentation.getTooltip(value),
				value: Bonus.of(augmentation.computeBonus(value)),
			});
		}),
	];
	const finalModifier = tree.getModifier(primaryAttribute, finalModifiers);

	return (
		<div style={{ display: 'flex', gap: '2px' }}>
			<div
				style={{
					flex: 1,
					padding: '12px',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					backgroundColor: 'var(--background-alt)',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
					<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
						<span style={{ fontWeight: 'bold' }}>{spell.name}</span>
						<span className='trait'>{spell.school}</span>
					</div>
				</div>
				<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
					<RichText>{spell.description}</RichText>
				</div>
			</div>
			{spell.augmentations.map(augmentation => {
				const value = getAugmentationValue(augmentation.key);
				return (
					<ParameterBoxComponent
						key={augmentation.key}
						title={
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<span>{`${augmentation.type}:`}</span>
								<span>{augmentation.shortDescription}</span>
							</div>
						}
						tooltip={augmentation.getTooltip(value)}
					>
						{augmentation.variable ? (
							<div style={{ display: 'flex', gap: '4px' }}>
								<LabeledInput
									variant='inline'
									value={`${value}`}
									onBlur={value => {
										const parsedValue = (() => {
											const parsedValue = parseInt(value);
											if (isNaN(parsedValue) || parsedValue < 0) {
												return 1;
											}
											return parsedValue;
										})();
										setAugmentationValue(augmentation.key, parsedValue);
									}}
								/>
								<span> = {augmentation.computeBonus(value)}</span>
							</div>
						) : (
							<span>{augmentation.bonus.description}</span>
						)}
					</ParameterBoxComponent>
				);
			})}
			<SpellCheckBox character={character} finalModifier={finalModifier} />
		</div>
	);
};
