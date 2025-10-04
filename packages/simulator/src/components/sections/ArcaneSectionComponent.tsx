import {
	ARCANE_SCHOOLS,
	ArcaneSection,
	ArcaneSectionCastingTimeOption,
	ArcaneSectionDefaults,
	ArcaneSectionInputValues,
	ArcaneSectionSpell,
	ArcaneSpellComponentType,
	CharacterSheet,
	Check,
	CheckMode,
	CheckNature,
	Distance,
	FUNDAMENTAL_ARCANE_SPELL_DESCRIPTION,
	StatModifier,
	StatType,
} from '@shattered-wilds/commons';
import React, { useMemo } from 'react';
import { FaDice } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useUIStateFactory } from '../../hooks/useUIState';
import { useStore } from '../../store';
import { Character } from '../../types/ui';
import { CostBoxComponent } from '../CostBoxComponent';
import { ParameterBoxComponent } from '../ParameterBoxComponent';
import Block from '../shared/Block';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';

interface ArcaneSectionProps {
	characterId: string;
}

export const ArcaneSectionComponent: React.FC<ArcaneSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);

	const { primaryAttribute } = sheet.characterClass.definition;
	if (!StatType.mindAttributes.includes(primaryAttribute.name)) {
		return null; // not a caster
	}

	return <ArcaneSectionInner character={character} sheet={sheet} />;
};

const ArcaneSectionInner: React.FC<{
	character: Character;
	sheet: CharacterSheet;
}> = ({ character, sheet }) => {
	const { useState, useStateArrayItem } = useUIStateFactory(`arcane-${character.id}`);

	// Get component options to create defaults
	const componentOptions = useMemo(() => ArcaneSection.getComponentsForFlavor(sheet), [sheet]);

	const defaultInputValues = useMemo(
		() => ArcaneSectionDefaults.createDefaultInputValues(componentOptions),
		[componentOptions],
	);

	// State management
	const [selectedRange, setSelectedRange] = useState<Distance>('selectedRange', ArcaneSectionDefaults.INITIAL_RANGE);
	const [selectedSchool, setSelectedSchool] = useStateArrayItem(
		'selectedSchool',
		ArcaneSection.allSchoolOptions,
		ArcaneSectionDefaults.INITIAL_SCHOOL,
	);
	const [selectedAttackOption, setSelectedAttackOption] = useStateArrayItem(
		'selectedAttackOption',
		ArcaneSection.allAttackOptions,
		ArcaneSectionDefaults.INITIAL_ATTACK_OPTION,
	);
	const [selectedCastingTime, setSelectedCastingTimeState] = useStateArrayItem(
		'selectedCastingTime',
		ArcaneSection.allCastingTimeOptions,
		ArcaneSection.allCastingTimeOptions[ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX],
	);

	const focusCostOptions = useMemo(
		() => ArcaneSection.getAvailableFocusCostOptions(selectedCastingTime),
		[selectedCastingTime],
	);

	const [selectedFocusCost, setSelectedFocusCost] = useStateArrayItem(
		'selectedFocusCost',
		focusCostOptions,
		focusCostOptions[ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX],
	);

	const [selectedSomaticComponent, setSelectedSomaticComponent] = useStateArrayItem(
		'selectedSomaticComponent',
		componentOptions[ArcaneSpellComponentType.Somatic] ?? [],
		defaultInputValues.selectedSomaticComponent,
	);
	const [selectedVerbalComponent, setSelectedVerbalComponent] = useStateArrayItem(
		'selectedVerbalComponent',
		componentOptions[ArcaneSpellComponentType.Verbal] ?? [],
		defaultInputValues.selectedVerbalComponent,
	);
	const [selectedFocalComponent, setSelectedFocalComponent] = useStateArrayItem(
		'selectedFocalComponent',
		componentOptions[ArcaneSpellComponentType.Focal] ?? [],
		defaultInputValues.selectedFocalComponent,
	);

	const [spellAugmentationValues, setSpellAugmentationValues] = useState(
		'spellAugmentationValues',
		{} as Record<string, Record<string, number>>,
	);

	const setSpellAugmentationValue = (spellName: string, key: string, value: number) => {
		setSpellAugmentationValues(prev => ({
			...prev,
			[spellName]: { ...(prev[spellName] ?? {}), [key]: value },
		}));
	};

	const setSelectedCastingTime = (option: ArcaneSectionCastingTimeOption) => {
		setSelectedCastingTimeState(option);
		if ('maxFocusCost' in option && option.maxFocusCost && selectedFocusCost.value > option.maxFocusCost) {
			setSelectedFocusCost(focusCostOptions[0]);
		}
	};

	const arcaneSection = useMemo(() => {
		const inputValues: ArcaneSectionInputValues = {
			selectedRange,
			selectedSchool,
			selectedAttackOption,
			selectedCastingTime,
			selectedFocusCost,
			selectedSomaticComponent,
			selectedVerbalComponent,
			selectedFocalComponent,
			spellAugmentationValues,
		};
		return ArcaneSection.create({ characterId: character.id, sheet, inputValues });
	}, [
		character,
		sheet,
		selectedRange,
		selectedSchool,
		selectedAttackOption,
		selectedCastingTime,
		selectedFocusCost,
		selectedSomaticComponent,
		selectedVerbalComponent,
		selectedFocalComponent,
		spellAugmentationValues,
	]);

	const { schoolOptions, castingTimeOptions, attackOptions } = arcaneSection;

	const componentsWithState = [
		{
			type: ArcaneSpellComponentType.Somatic,
			get: selectedSomaticComponent,
			set: setSelectedSomaticComponent,
			options: componentOptions[ArcaneSpellComponentType.Somatic],
		},
		{
			type: ArcaneSpellComponentType.Verbal,
			get: selectedVerbalComponent,
			set: setSelectedVerbalComponent,
			options: componentOptions[ArcaneSpellComponentType.Verbal],
		},
		{
			type: ArcaneSpellComponentType.Focal,
			get: selectedFocalComponent,
			set: setSelectedFocalComponent,
			options: componentOptions[ArcaneSpellComponentType.Focal],
		},
	];

	return (
		<Block>
			<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Arcane</h3>
			<div style={{ display: 'flex', gap: '8px' }}>
				<LabeledInput
					variant='normal'
					label='Base Modifier'
					value={`${arcaneSection.baseModifier.name} (${arcaneSection.baseModifier.value.description})`}
					tooltip={arcaneSection.baseModifier.description}
					disabled
				/>
				<LabeledInput
					variant='normal'
					label='Range Increment'
					tooltip={arcaneSection.influenceRange.description}
					value={arcaneSection.influenceRange.value.description}
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
							describe={component => component?.name ?? ''}
							onChange={set}
						/>
					) : null,
				)}
				<LabeledInput
					label='Combined Modifier'
					value={arcaneSection.combinedModifier.value.description}
					tooltip={arcaneSection.combinedModifier.description}
					disabled
				/>
			</div>
			<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
			<div style={{ display: 'flex', gap: '2px' }}>
				<CostBoxComponent cost={arcaneSection.fundamentalSpellCost} />
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
							<span style={{ fontWeight: 'bold' }}>Fundamental Arcane Spell</span>
						</div>
					</div>
					<div style={{ fontSize: '0.9em' }}>
						{(() => {
							const school = selectedSchool === 'All Schools' ? null : selectedSchool;
							return (
								<RichText>
									{school ? ARCANE_SCHOOLS[school].description : FUNDAMENTAL_ARCANE_SPELL_DESCRIPTION}
								</RichText>
							);
						})()}
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '8px',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						backgroundColor: 'var(--background-alt)',
						textAlign: 'center',
					}}
				>
					<LabeledDropdown
						label='Casting Time'
						value={selectedCastingTime}
						options={castingTimeOptions}
						describe={option => `${option.name} (${option.modifier.description})`}
						onChange={setSelectedCastingTime}
					/>
					<LabeledDropdown
						label='Focus Cost'
						tooltip='Note: You can only spend up to the number of AP used for the spell.'
						value={selectedFocusCost}
						options={focusCostOptions}
						describe={option => `${option.name} (${option.modifier.description})`}
						onChange={setSelectedFocusCost}
					/>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '8px',
						border: '1px solid var(--text)',
						borderRadius: '4px',
						backgroundColor: 'var(--background-alt)',
						textAlign: 'center',
					}}
				>
					<LabeledDropdown
						label='Filter by School'
						value={selectedSchool}
						options={schoolOptions}
						onChange={setSelectedSchool}
					/>
					<LabeledDropdown
						label='Filter Attacks'
						value={selectedAttackOption}
						options={attackOptions}
						onChange={setSelectedAttackOption}
					/>
				</div>
				<SpellCheckBox character={character} finalModifier={arcaneSection.fundamentalModifier} />
			</div>
			<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '12px 0 12px 0', opacity: 0.3 }} />
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{arcaneSection.spells.map(spell => (
					<SpellBox
						key={spell.key}
						character={character}
						spell={spell}
						setSpellAugmentationValue={setSpellAugmentationValue}
					/>
				))}
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
			<FaDice size={12} />
		</ParameterBoxComponent>
	);
};

const SpellBox: React.FC<{
	character: Character;
	spell: ArcaneSectionSpell;
	setSpellAugmentationValue: (spellName: string, key: string, value: number) => void;
}> = ({ character, spell, setSpellAugmentationValue }) => {
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
						<span style={{ fontWeight: 'bold' }}>
							<a href={`/wiki/${spell.slug}`} target='_blank' rel='noreferrer'>
								{spell.name}
							</a>
						</span>
						<span className='school'>{spell.school}</span>
						{spell.traits.map(trait => (
							<span className='trait' key={trait}>
								{trait}
							</span>
						))}
					</div>
				</div>
				<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
					<RichText>{spell.description}</RichText>
				</div>
			</div>
			{spell.augmentations.map(augmentation => {
				const value = augmentation.value;
				return (
					<ParameterBoxComponent
						key={augmentation.key}
						title={
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<span>{`${augmentation.type}:`}</span>
								<span>{augmentation.shortDescription}</span>
							</div>
						}
						tooltip={augmentation.tooltip}
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
										setSpellAugmentationValue(spell.name, augmentation.key, parsedValue);
									}}
								/>
								<span> = {augmentation.bonus.description}</span>
							</div>
						) : (
							<span>{augmentation.bonus.description}</span>
						)}
					</ParameterBoxComponent>
				);
			})}
			<SpellCheckBox character={character} finalModifier={spell.finalModifier} />
		</div>
	);
};
