const Column = ({ idx, children }: { idx: number; children: React.ReactNode }) => (
	<div
		style={{
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			gap: '1rem',
			borderLeft: idx > 0 ? '1px solid var(--text)' : undefined,
			height: '100%',
			padding: '1rem',
		}}
	>
		{children}
	</div>
);
import {
	firstParagraph,
	getRecordValues,
	joinHumanReadableList,
	Race,
	RACE_DEFINITIONS,
	RacialStatModifier,
	StatType,
	StatTypeName,
	UPBRINGING_DEFINITIONS,
} from '@shattered-wilds/commons';
import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

import { Button } from '../shared/Button';
import { RichText } from '../shared/RichText';

interface OnboardingPageProps {
	onNavigateToCharacterSheets: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigateToCharacterSheets }) => {
	const [step, setStep] = useState(1);
	const [options, setOptions] = useState<Record<string, string>>({});
	const nextStep = (options?: Record<string, string>) => {
		return () => {
			setOptions(current => ({ ...current, ...options }));
			setStep(step + 1);
		};
	};

	const getAttributeInfo = (attribute: StatType): { key: string; description: string } => {
		return { key: attribute.name, description: attribute.description };
	};

	const getRealmInfo = (realm: StatType): [StatTypeName, { key: string; description: string }[]] => {
		return [realm.name, StatType.childrenOf(realm).map(getAttributeInfo)];
	};

	const attributesByRealm = Object.fromEntries(StatType.realms.map(getRealmInfo));

	const Bold = ({ children }: { children: React.ReactNode }) => (
		<strong style={{ fontWeight: 'bold', borderBottom: '1px solid white' }}>{children}</strong>
	);

	const Columns = ({ amount, children }: { amount: number; children: React.ReactNode }) => {
		// Convert children to array for easier manipulation
		const childArray = React.Children.toArray(children);
		// Group children into rows
		const rows: React.ReactNode[][] = [];
		for (let i = 0; i < childArray.length; i += amount) {
			rows.push(childArray.slice(i, i + amount));
		}

		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem 0', width: '100%' }}>
				{rows.map((row, rowIdx) => {
					const isFullRow = row.length === amount;
					return (
						<div
							key={rowIdx}
							style={{
								display: 'flex',
								flexDirection: 'row',
								gap: '0 2rem',
								justifyContent: isFullRow ? 'center' : 'center',
								width: '100%',
							}}
						>
							{row.map((child, colIdx) => (
								<div
									key={colIdx}
									style={{
										flex: isFullRow ? `1 1 0` : `1 1 ${100 / row.length}%`,
										minWidth: 0,
									}}
								>
									{child}
								</div>
							))}
						</div>
					);
				})}
			</div>
		);
	};

	const getClassesByAttribute = (attribute: string) => {
		const classes = {
			STR: [
				{
					key: 'Fighter',
					description:
						'A martial warrior specialized in melee combat. Gains Sweep Attack ability to strike multiple adjacent enemies.',
				},
				{
					key: 'Berserker',
					description:
						'A survivalist warrior who channels primal rage. Gains Rage ability for enhanced combat prowess.',
				},
				{
					key: 'Swashbuckler',
					description: 'A scoundrel warrior with finesse and flair. Gains Fancy Footwork to avoid opportunity attacks.',
				},
			],
			DEX: [
				{
					key: 'Marksman',
					description: 'A martial warrior specialized in ranged combat. Gains Take Aim ability for precise shots.',
				},
				{
					key: 'Hunter',
					description: 'A survivalist warrior who thrives in the wilderness. Gains Rage ability and sylvan knowledge.',
				},
				{
					key: 'Rogue',
					description:
						'A scoundrel warrior skilled in stealth and trickery. Gains Fancy Footwork and thieving abilities.',
				},
			],
			CON: [
				{
					key: 'Guardian',
					description:
						'A martial warrior focused on protection and defense. Gains Improved Taunt to draw enemy attention.',
				},
				{
					key: 'Barbarian',
					description:
						'A survivalist warrior who endures through toughness. Gains Rage ability and wilderness survival.',
				},
				{
					key: 'Scout',
					description: 'A scoundrel warrior skilled in reconnaissance. Gains Fancy Footwork and scouting abilities.',
				},
			],
			INT: [
				{
					key: 'Wizard',
					description:
						'An arcanist caster who masters all spell components. Gains Arcane Casting and a Signature Spell.',
				},
				{
					key: 'Engineer',
					description:
						'A mechanist caster who uses tools and contraptions. Gains Arcane Casting and Tool-Assisted Casting.',
				},
				{
					key: 'Alchemist',
					description: 'A naturalist caster who bonds with nature. Gains Arcane Casting and Focal Connection.',
				},
				{
					key: 'Storyteller',
					description: 'A musicist caster who weaves magic through words. Gains Arcane Casting and Lyrical Resonance.',
				},
			],
			WIS: [
				{
					key: 'Mage',
					description: 'An arcanist caster guided by intuition. Gains Arcane Casting and a Signature Spell.',
				},
				{
					key: 'Artificer',
					description: 'A mechanist caster who crafts magical items. Gains Arcane Casting and Tool-Assisted Casting.',
				},
				{
					key: 'Druid',
					description: 'A naturalist caster connected to the natural world. Gains Arcane Casting and Focal Connection.',
				},
				{
					key: 'Minstrel',
					description: 'A musicist caster who channels magic through song. Gains Arcane Casting and Lyrical Resonance.',
				},
			],
			CHA: [
				{
					key: 'Sorcerer',
					description: 'An arcanist caster with innate magical power. Gains Arcane Casting and a Signature Spell.',
				},
				{
					key: 'Machinist',
					description:
						'A mechanist caster who operates magical machines. Gains Arcane Casting and Tool-Assisted Casting.',
				},
				{
					key: 'Shaman',
					description: 'A naturalist caster who communes with spirits. Gains Arcane Casting and Focal Connection.',
				},
				{
					key: 'Bard',
					description:
						'A musicist caster who inspires through performance. Gains Arcane Casting and Lyrical Resonance.',
				},
			],
			DIV: [
				{
					key: 'Cleric',
					description:
						'A pure mystic devoted to a higher power. Gains Divine Channeling to invoke divine intervention.',
				},
				{
					key: 'Warlock',
					description: 'A mixed mystic with otherworldly pacts. (Currently in development)',
				},
				{
					key: 'Paladin',
					description: 'A martial mystic who fights with divine power. Gains Divine Smite for empowered attacks.',
				},
			],
			FOW: [
				{
					key: 'Sage',
					description: 'A pure mystic who channels inner strength. Gains Divine Channeling through willpower.',
				},
				{
					key: 'Monk',
					description: 'A mixed mystic balancing combat and spirituality. (Currently in development)',
				},
				{
					key: 'Ranger',
					description: 'A martial mystic who protects the wilderness. Gains Divine Smite and natural abilities.',
				},
			],
			LCK: [
				{
					key: 'Wanderer',
					description: 'A pure mystic guided by fortune. Gains Divine Channeling through luck itself.',
				},
				{
					key: 'Wayfarer',
					description: 'A mixed mystic who travels by chance. (Currently in development)',
				},
				{
					key: 'Warden',
					description: 'A martial mystic who guards through fortune. Gains Divine Smite and protective abilities.',
				},
			],
		};
		return classes[attribute as keyof typeof classes] || [];
	};

	const modifiersToString = (modifiers: RacialStatModifier[]) => {
		if (modifiers.length === 0) {
			return 'Neutral';
		}
		const toSign = (value: number): string => {
			if (value === 1) {
				return '+';
			} else if (value === -1) {
				return '-';
			} else {
				throw new Error(`Unexpected modifier value: ${value}`);
			}
		};
		return modifiers.map(mod => `${toSign(mod.value.value)}[[${mod.statType}]]`).join(', ');
	};

	const races = getRecordValues(RACE_DEFINITIONS).map(def => {
		const typicalUpbringings = def.typicalUpbringings.map(upbringing => `[[${upbringing}]]`);
		return {
			key: def.name,
			typicalUpbringings: joinHumanReadableList(typicalUpbringings),
			description: [
				`**Modifiers**: ${modifiersToString(def.modifiers)}`,
				`**Size**: ${def.size}`,
				`**Typical Upbringings**: ${typicalUpbringings.join(', ')}`,
			].join('\n\n'),
		};
	});

	const upbringings = getRecordValues(UPBRINGING_DEFINITIONS).map(def => {
		return {
			key: def.name,
			description: firstParagraph(def.description),
		};
	});

	const steps = [
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }} key={1}>
			<RichText>
				Welcome, **Hero**, to **Shattered Wilds**, a work-in-progress base setting for a new **TTRPG** system based on
				**D12** dice rolls. Heavily inspired by **D&D 5e**, accidentally similar to **Pathfinder 2e**, with some
				elements of **Fate**, **D&D 3.5**, and some original ideas.
			</RichText>
			<RichText>
				In **Shattered Wilds**, the world is ever-shifting. Not fast enough that you could see - but within a few weeks
				or months, routes between settlements could be lost; rivers could change course, mountains could start to emerge
				or dwindle back into the ground; forests could wander, and trails could lead to new places and ruins that had
				not been seen for ages. The only constants are the settlements, villages, towns, cities or any sufficient
				congregation of people - those are stable and do not move. But the routes between them are always changing,
				compasses are useless (always spinning seemingly at random), and maps become outdated quickly after they are
				drawn.
			</RichText>
			<RichText>
				Travel, therefore, is a risky proposition. The Wilds, when uncharted, are perilous, presenting harsh conditions
				for the unprepared, and filled with dangerous creatures - both beasts and people - and of course, the
				**Hollow**. Adventurers double as cartographers, and venture forth into the wild to establish new temporary
				routes, to allow for bursts of commerce and passage for the common folk, at least for a brief period of time.
				Some strong enough to withstand the **Wilds** choose to live by themselves; others form parties to explore and
				learn more about the world.
			</RichText>
			<StepButton onClick={nextStep()} text='Venture the Wilds' />
		</div>,
		<>
			<p>
				In the <strong>D12</strong> system, Checks are determined by a <code>2d12 + Modifiers</code> roll.
			</p>
			<p>
				Modifiers can come from your <strong>Stats</strong>, <strong>Equipment</strong> or{' '}
				<strong>Circumstances</strong>.
			</p>
			<p>However, you don&apos;t just add up the results; there are a few additional mechanics:</p>
			<div
				style={{
					display: 'grid',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2rem 0',
					gridTemplateColumns: '1fr 1fr 1fr',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'start',
						gap: '1rem',
						paddingRight: '2rem',
						borderRight: '1px solid var(--text)',
						padding: '1rem',
					}}
				>
					<strong style={{ margin: '0' }}>Crit Modifiers</strong>
					<p style={{ margin: '0' }}>
						If you roll a <code>12</code>, you get a <code>+6</code>.
					</p>
					<p style={{ margin: '0' }}>
						If you roll a pair, you get a <code>+6</code>.
					</p>
					<img src='/src/assets/crits.svg' alt='Crit Modifier' width={200} style={{ margin: '0' }} />
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'start',
						gap: '1rem',
						paddingRight: '2rem',
						borderRight: '1px solid var(--text)',
						padding: '1rem',
						height: '100%',
					}}
				>
					<strong style={{ margin: '0' }}>Crit Shifts</strong>
					<p style={{ margin: '0' }}>
						Then, if you rolled 6 or more above target, you get a <strong>Shift</strong>!
					</p>
					<p style={{ margin: '0' }}>
						Then, if you rolled 12 above the previous Shift, you get another <strong>Shift</strong>! (and so on)
					</p>
					<p style={{ margin: '0' }}>Shifts mean extra damage, or extra effects, depending on the situation.</p>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'start',
						gap: '1rem',
						paddingRight: '2rem',
						padding: '1rem',
						height: '100%',
					}}
				>
					<strong style={{ margin: '0' }}>Extra & Luck</strong>
					<p style={{ margin: '0' }}>Sometimes, you might get to roll one or even two additional dice!</p>
					<p style={{ margin: '0' }}>
						However, you will always pick two to add up. The other dice still count for{' '}
						<strong>Crit Modifiers & Auto Fails</strong>.
					</p>
					<hr style={{ width: '100%', margin: '0' }} />
					<p style={{ margin: '0' }}>
						If you roll a pair of <code>1</code>s in an <strong>Active Check</strong>, you get an{' '}
						<strong>Auto Fail</strong>.
					</p>
				</div>
			</div>
			<p>
				<StepButton onClick={nextStep()} text='Got it!' />
			</p>
		</>,
		<>
			<p>
				<strong>Stats</strong> are the core of your character. They are divided into three <strong>Realms</strong>:
			</p>

			<Columns amount={3}>
				{StatType.realms.map((realm, idx) => (
					<Column key={realm.name} idx={idx}>
						<Bold>{realm.name}</Bold>
						<RichText>{realm.description}</RichText>
						<StepButton onClick={nextStep({ realm: realm.name })} text={`Choose ${realm.name}`} />
					</Column>
				))}
			</Columns>
		</>,
		<>
			<p>
				You chose <strong>{options['realm']}</strong> as your Realm. Now choose your <strong>Primary Attribute</strong>:
			</p>

			<Columns amount={3}>
				{attributesByRealm[options.realm ?? StatType.Body.name].map((attribute, idx) => {
					return (
						<Column key={attribute.key} idx={idx}>
							<Bold>{attribute.key}</Bold>
							<RichText>{attribute.description}</RichText>
							<StepButton onClick={nextStep({ attribute: attribute.key })} text={`Choose ${attribute.key}`} />
						</Column>
					);
				})}
			</Columns>
		</>,
		<>
			<p>
				You chose <strong>{options['attribute']}</strong> as your primary attribute. Now choose your{' '}
				<strong>Class</strong>:
			</p>

			<Columns amount={getClassesByAttribute(options['attribute']).length}>
				{getClassesByAttribute(options['attribute']).map((characterClass, idx) => {
					return (
						<Column key={characterClass.key} idx={idx}>
							<Bold>{characterClass.key}</Bold>
							<RichText>{characterClass.description}</RichText>
							<StepButton
								onClick={nextStep({ class: characterClass.key })}
								text={`${characterClass.key}`}
								style={{ fontSize: '1em' }}
							/>
						</Column>
					);
				})}
			</Columns>
		</>,
		<>
			<p>
				You chose <strong>{options['class']}</strong> as your class. Now choose your <strong>Race</strong>:
			</p>
			<Columns amount={4}>
				{races.map((race, idx) => {
					return (
						<Column key={race.key} idx={idx % 4}>
							<Bold>{race.key}</Bold>
							<RichText>{race.description}</RichText>
							<StepButton onClick={nextStep({ race: race.key })} text={`${race.key}`} />
						</Column>
					);
				})}
			</Columns>
		</>,
		<>
			<p>
				You chose <strong>{options['race']}</strong> as your race. Now choose your <strong>Upbringing</strong>:
			</p>
			<RichText>
				{`While typical upbringings for **${options['race']}** are ${races.find(r => r.key === (options['race'] ?? Race.Human))!.typicalUpbringings},\n\nyou can pick any option according to your character's backstory.`}
			</RichText>
			<div style={{ height: '2rem' }} />
			<Columns amount={2}>
				{upbringings.map((upbringing, idx) => {
					return (
						<Column key={upbringing.key} idx={idx % 2}>
							<Bold>{upbringing.key}</Bold>
							<RichText>{upbringing.description}</RichText>
							<StepButton onClick={nextStep({ upbringing: upbringing.key })} text={`${upbringing.key}`} />
						</Column>
					);
				})}
			</Columns>
		</>,
		<>
			<p>Perfect! Here&apos;s your character summary:</p>
			<div style={{ textAlign: 'center', margin: '2rem 0' }}>
				<div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
					<strong>Realm:</strong> {options['realm']}
				</div>
				<div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
					<strong>Primary Attribute:</strong> {options['attribute']}
				</div>
				<div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
					<strong>Class:</strong> {options['class']}
				</div>
				<div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
					<strong>Race:</strong> {options['race']}
				</div>
				<div style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
					<strong>Upbringing:</strong> {options['upbringing']}
				</div>
			</div>
			<p>
				<StepButton onClick={onNavigateToCharacterSheets} text='Create Character' />
			</p>
		</>,
	];
	return (
		<StepWrapper
			step={step}
			totalSteps={steps.length}
			onQuit={onNavigateToCharacterSheets}
			onBack={() => (step > 1 ? setStep(step - 1) : undefined)}
		>
			{steps[step - 1]}
		</StepWrapper>
	);
};

const StepButton = ({ text, onClick, style }: { text: string; onClick: () => void; style?: React.CSSProperties }) => {
	return (
		<button
			style={{
				fontSize: '4rem',
				textTransform: 'uppercase',
				backgroundColor: 'var(--primary)',
				color: 'var(--text)',
				...style,
			}}
			onClick={onClick}
		>
			<div style={{ padding: '2rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{text}
			</div>
		</button>
	);
};

const StepWrapper = ({
	step,
	totalSteps,
	onQuit,
	onBack,
	children,
}: {
	step: number;
	totalSteps: number;
	onQuit: () => void;
	onBack: () => void;
	children: React.ReactNode;
}) => {
	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<header
				style={{
					margin: '0.5em 2em',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'right',
					gap: '1rem',
				}}
			>
				<Button onClick={onQuit} icon={FaArrowLeft} title='Quit' />
				<Button onClick={onBack} icon={FaArrowLeft} title='Go Back' />
				<div>
					Step {step}/{totalSteps}
				</div>
			</header>
			<main
				style={{
					flex: 1,
					padding: '2rem',
					overflow: 'auto',
					maxWidth: '1600px',
					margin: '0 auto',
					fontSize: '2rem',
					textAlign: 'center',
				}}
			>
				{children}
			</main>
		</div>
	);
};
