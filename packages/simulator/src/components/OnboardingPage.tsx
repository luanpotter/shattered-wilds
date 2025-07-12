import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface OnboardingPageProps {
	onNavigateToCharacterSheets: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigateToCharacterSheets }) => {
	const [step, setStep] = useState(1);
	const nextStep = () => setStep(step + 1);

	const steps = [
		<>
			<p>
				Welcome, <strong>Hero</strong>, to <strong>Shattered Wilds</strong>, a work-in-progress base
				setting for a new <strong>TTRPG</strong> system based on <strong>D12</strong> dice rolls.
				Heavily inspired by <strong>D&D 5e</strong>, accidentally similar to{' '}
				<strong>Pathfinder 2e</strong>, with some elements of <strong>Fate</strong>,{' '}
				<strong>D&D 3.5</strong>, and some original ideas.
			</p>
			<p>
				In <strong>Shattered Wilds</strong>, the world is ever-shifting. Not fast enough that you
				could see - but within a few weeks or months, routes between settlements could be lost;
				rivers could change course, mountains could start to emerge or dwindle back into the ground;
				forests could wander, and trails could lead to new places and ruins that had not been seen
				for ages. The only constants are the settlements, villages, towns, cities or any sufficient
				congregation of people - those are stable and do not move. But the routes between them are
				always changing, compasses are useless (always spinning seemingly at random), and maps
				become outdated quickly after they are drawn.
			</p>
			<p>
				Travel, therefore, is a risky proposition. The Wilds, when uncharted, are perilous,
				presenting harsh conditions for the unprepared, and filled with dangerous creatures - both
				beasts and people - and of course, the <strong>Hollow</strong>. Adventurers double as
				cartographers, and venture forth into the wild to establish new temporary routes, to allow
				for bursts of commerce and passage for the common folk, at least for a brief period of time.
				Some strong enough to withstand the Wilds choose to live by themselves; others form parties
				to explore and learn more about the world.
			</p>
			<p>
				<StepButton onClick={nextStep}>Continue</StepButton>
			</p>
		</>,
	];
	return (
		<StepWrapper
			step={step}
			totalSteps={steps.length}
			onNavigateToCharacterSheets={onNavigateToCharacterSheets}
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
	onNavigateToCharacterSheets,
	children,
}: {
	step: number;
	totalSteps: number;
	onNavigateToCharacterSheets: () => void;
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
				<button onClick={onNavigateToCharacterSheets}>
					<FaArrowLeft /> Cancel
				</button>
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
