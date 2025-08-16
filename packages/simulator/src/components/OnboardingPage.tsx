import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

import { Button } from './shared/Button';

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

	const getAttributesByRealm = (realm: string) => {
		const attributes = {
			body: [
				{
					key: 'STR',
					description: 'Strength is a measure of the power of the Body. Think punch hard, big muscles, heavy lifting.',
				},
				{
					key: 'DEX',
					description: 'Dexterity is a measure of speed of the Body. Think reflexes, quickness, agility, precision.',
				},
				{
					key: 'CON',
					description:
						'Constitution is a measure of the resilience of the Body. Think how much it can take, both from external sources or self-exhaustion.',
				},
			],
			mind: [
				{
					key: 'INT',
					description:
						"Intelligence is a measure of the Mind's ability to learn, reason, and understand. Think logic, reasoning, and knowledge.",
				},
				{
					key: 'WIS',
					description:
						"Wisdom is a measure of the Mind's ability to perceive and interpret the world around you. Think perception, awareness, and intuition.",
				},
				{
					key: 'CHA',
					description:
						"Charisma is a measure of the Mind's ability to influence, persuade, inspire, and connect with others, as well as understand emotions.",
				},
			],
			spirit: [
				{
					key: 'DIV',
					description:
						"Divinity is a measure of the Soul's ability to connect with the Aether. It determines the conviction of your faith and devotion in the unknown.",
				},
				{
					key: 'FOW',
					description:
						"Force of Will is a measure of the Soul's ability to resist temptations, vices, and instant gratification. Think willpower, determination, and psychological resilience.",
				},
				{
					key: 'LCK',
					description:
						"Luck is a measure of the Soul's connection with forces even beyond the Aether, measuring a person's unexplainable connection with Luck as a concept.",
				},
			],
		};
		return attributes[realm as keyof typeof attributes] || [];
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

	const getRaces = () => {
		return [
			{
				key: 'Human',
				description: 'Neutral modifiers. Medium size. Typical upbringings: Urban, Nomadic.',
			},
			{
				key: 'Elf',
				description: '+DEX, -CON. Medium size. Typical upbringings: Urban, Sylvan.',
			},
			{
				key: 'Dwarf',
				description: '+CON, -DEX. Small size. Typical upbringings: Tribal, Telluric.',
			},
			{
				key: 'Orc',
				description: '+STR, -DEX. Large size. Typical upbringings: Nomadic, Telluric.',
			},
			{
				key: 'Fey',
				description: '+DEX, -STR. Small size. Typical upbringings: Tribal, Sylvan.',
			},
			{
				key: 'Goliath',
				description: '+STR, -CON. Large size. Typical upbringings: Tribal, Telluric.',
			},
			{
				key: 'Goblin',
				description: '+CON, -STR. Small size. Typical upbringings: Nomadic, Sylvan.',
			},
		];
	};

	const getUpbringings = () => {
		return [
			{
				key: 'Urban',
				description:
					'Lived in a medium-sized village or town. Gains Specialized Training (2 Minor Feats). Familiar with politics, commerce, and urban life.',
			},
			{
				key: 'Nomadic',
				description:
					'Grew up traveling through the Wilds in a small group. Gains Nomadic Alertness for spotting danger while sleeping. Skilled in survival and tracking.',
			},
			{
				key: 'Tribal',
				description:
					'Raised in a settlement with strong tribal structure and hierarchies. Gains Tribal Endurance to reduce exhaustion through duty. Understands clan dynamics.',
			},
			{
				key: 'Sylvan',
				description:
					'Grew up in small settlements deep within the woods. Gains Light Feet to ignore natural difficult terrain. Knowledgeable about fauna and flora.',
			},
			{
				key: 'Telluric',
				description:
					'Raised in cave-dwelling settlements deep underground. Gains Dark Vision to see in black-and-white in darkness. Expert in caves, mining, and ores.',
			},
		];
	};

	const steps = [
		<>
			<p>
				Welcome, <strong>Hero</strong>, to <strong>Shattered Wilds</strong>, a work-in-progress base setting for a new{' '}
				<strong>TTRPG</strong> system based on <strong>D12</strong> dice rolls. Heavily inspired by{' '}
				<strong>D&D 5e</strong>, accidentally similar to <strong>Pathfinder 2e</strong>, with some elements of{' '}
				<strong>Fate</strong>, <strong>D&D 3.5</strong>, and some original ideas.
			</p>
			<p>
				In <strong>Shattered Wilds</strong>, the world is ever-shifting. Not fast enough that you could see - but within
				a few weeks or months, routes between settlements could be lost; rivers could change course, mountains could
				start to emerge or dwindle back into the ground; forests could wander, and trails could lead to new places and
				ruins that had not been seen for ages. The only constants are the settlements, villages, towns, cities or any
				sufficient congregation of people - those are stable and do not move. But the routes between them are always
				changing, compasses are useless (always spinning seemingly at random), and maps become outdated quickly after
				they are drawn.
			</p>
			<p>
				Travel, therefore, is a risky proposition. The Wilds, when uncharted, are perilous, presenting harsh conditions
				for the unprepared, and filled with dangerous creatures - both beasts and people - and of course, the{' '}
				<strong>Hollow</strong>. Adventurers double as cartographers, and venture forth into the wild to establish new
				temporary routes, to allow for bursts of commerce and passage for the common folk, at least for a brief period
				of time. Some strong enough to withstand the Wilds choose to live by themselves; others form parties to explore
				and learn more about the world.
			</p>
			<p>
				<StepButton onClick={nextStep()}>Continue</StepButton>
			</p>
		</>,
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
						If you roll at least one <code>12</code>, you get a <code>+6</code>.
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
				<StepButton onClick={nextStep()}>Continue</StepButton>
			</p>
		</>,
		<>
			<p>
				<strong>Stats</strong> are the core of your character. They are divided into three <strong>Realms</strong>:
			</p>

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
						justifyContent: 'end',
						gap: '1rem',
						paddingRight: '2rem',
						borderRight: '1px solid var(--text)',
						padding: '1rem',
						height: '100%',
					}}
				>
					<p>
						<strong>Body</strong>: The realm of physical capabilities, representing your character&apos;s bodily
						strength, agility, and endurance.
					</p>
					<StepButton onClick={nextStep({ realm: 'body' })}>Choose Body</StepButton>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'end',
						gap: '1rem',
						paddingRight: '2rem',
						borderRight: '1px solid var(--text)',
						padding: '1rem',
						height: '100%',
					}}
				>
					<p>
						<strong>Mind</strong>: The realm of mental capabilities, representing your character&apos;s wisdom,
						perception, and creativity.
					</p>
					<StepButton onClick={nextStep({ realm: 'mind' })}>Choose Mind</StepButton>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'end',
						gap: '1rem',
						paddingRight: '2rem',
						padding: '1rem',
						height: '100%',
					}}
				>
					<p>
						<strong>Spirit</strong>: The realm of spiritual capabilities, representing your character&apos;s connection
						to the divine, your own Soul, and Luck itself.
					</p>
					<StepButton onClick={nextStep({ realm: 'spirit' })}>Choose Spirit</StepButton>
				</div>
			</div>
		</>,
		<>
			<p>
				You chose <strong>{options['realm']}</strong> as your Realm. Now choose your <strong>Primary Attribute</strong>:
			</p>
			<div
				style={{
					display: 'grid',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2rem 0',
					gridTemplateColumns: '1fr 1fr 1fr',
				}}
			>
				{getAttributesByRealm(options['realm']).map((attribute, index) => {
					const isLast = index === 2;
					return (
						<div
							key={attribute.key}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'end',
								gap: '1rem',
								paddingRight: '2rem',
								borderRight: isLast ? undefined : '1px solid var(--text)',
								padding: '1rem',
								height: '100%',
							}}
						>
							<div style={{ textAlign: 'center' }}>
								<strong style={{ fontSize: '1.5rem' }}>{attribute.key}</strong>
								<p style={{ margin: '1rem 0' }}>{attribute.description}</p>
							</div>
							<StepButton onClick={nextStep({ attribute: attribute.key })}>Choose {attribute.key}</StepButton>
						</div>
					);
				})}
			</div>
		</>,
		<>
			<p>
				You chose <strong>{options['attribute']}</strong> as your primary attribute. Now choose your{' '}
				<strong>Class</strong>:
			</p>
			<div
				style={{
					display: 'grid',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2rem',
					gridTemplateColumns:
						getClassesByAttribute(options['attribute']).length === 4 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr',
				}}
			>
				{getClassesByAttribute(options['attribute']).map((characterClass, index) => {
					const isLast = index === getClassesByAttribute(options['attribute']).length - 1;
					return (
						<div
							key={characterClass.key}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'end',
								gap: '1rem',
								padding: '1rem',
								height: '100%',
								borderRight: isLast ? undefined : '1px solid var(--text)',
							}}
						>
							<div style={{ textAlign: 'center' }}>
								<strong style={{ fontSize: '1.5rem' }}>{characterClass.key}</strong>
								<p style={{ margin: '1rem 0' }}>{characterClass.description}</p>
							</div>
							<StepButton onClick={nextStep({ class: characterClass.key })}>Choose {characterClass.key}</StepButton>
						</div>
					);
				})}
			</div>
		</>,
		<>
			<p>
				You chose <strong>{options['class']}</strong> as your class. Now choose your <strong>Race</strong>:
			</p>
			<div
				style={{
					display: 'grid',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2rem',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
				}}
			>
				{getRaces().map((race, index) => {
					const isLast = index === getRaces().length - 1;
					return (
						<div
							key={race.key}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'end',
								gap: '1rem',
								padding: '1rem',
								height: '100%',
								borderRight: isLast ? undefined : '1px solid var(--text)',
							}}
						>
							<div style={{ textAlign: 'center' }}>
								<strong style={{ fontSize: '1.5rem' }}>{race.key}</strong>
								<p style={{ margin: '1rem 0' }}>{race.description}</p>
							</div>
							<StepButton onClick={nextStep({ race: race.key })}>Choose {race.key}</StepButton>
						</div>
					);
				})}
			</div>
		</>,
		<>
			<p>
				You chose <strong>{options['race']}</strong> as your race. Now choose your <strong>Upbringing</strong>:
			</p>
			<div
				style={{
					display: 'grid',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2rem',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
				}}
			>
				{getUpbringings().map((upbringing, index) => {
					const isLast = index === getUpbringings().length - 1;
					return (
						<div
							key={upbringing.key}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'end',
								gap: '1rem',
								padding: '1rem',
								height: '100%',
								borderRight: isLast ? undefined : '1px solid var(--text)',
							}}
						>
							<div style={{ textAlign: 'center' }}>
								<strong style={{ fontSize: '1.5rem' }}>{upbringing.key}</strong>
								<p style={{ margin: '1rem 0' }}>{upbringing.description}</p>
							</div>
							<StepButton onClick={nextStep({ upbringing: upbringing.key })}>Choose {upbringing.key}</StepButton>
						</div>
					);
				})}
			</div>
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
				<StepButton onClick={onNavigateToCharacterSheets}>Create Character</StepButton>
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

const StepButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
	return (
		<button
			style={{
				fontSize: '4rem',
				padding: '2rem 8rem',
				textTransform: 'uppercase',
				backgroundColor: 'var(--primary)',
				color: 'var(--text)',
			}}
			onClick={onClick}
		>
			{children}
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
					margin: '2rem',
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
					maxWidth: step === 5 || step === 6 ? 'none' : '1600px',
					margin: step === 5 || step === 6 ? '0' : '0 auto',
					width: '100%',
					boxSizing: 'border-box',
					fontSize: '2rem',
					textAlign: 'center',
				}}
			>
				{children}
			</main>
		</div>
	);
};
