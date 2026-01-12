import { CharacterSheet, Resource, RESOURCES } from '@shattered-wilds/d12';
import React from 'react';

import { Character, getCharacterInitials } from '../types/ui';

import { BoxedText } from './hex/BoxedText';

export interface CharacterTokenProps {
	character: Character;
	onClick?: (e: React.MouseEvent) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	isGhost?: boolean;
	interactive?: boolean;
	highlight?: boolean;
}

export const CharacterToken: React.FC<CharacterTokenProps> = ({
	character,
	onClick,
	onMouseEnter,
	onMouseLeave,
	isGhost = false,
	interactive = true,
	highlight = false,
}) => {
	const handleMouseDown = (e: React.MouseEvent) => {
		if (onClick) {
			onClick(e);
		}
	};

	const handleMouseEnter = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMouseEnter) {
			onMouseEnter();
		}
	};

	const handleMouseLeave = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMouseLeave) {
			onMouseLeave();
		}
	};

	const sheet = CharacterSheet.from(character.props);
	const resources = [Resource.VitalityPoint, Resource.FocusPoint, Resource.SpiritPoint].map(type => {
		const resource = RESOURCES[type];
		const values = sheet.getResource(type);
		return { color: resource.color, current: values.current, max: values.max };
	});

	return (
		<g
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				cursor: isGhost ? 'grabbing' : interactive ? 'grab' : 'default',
				opacity: isGhost ? 0.7 : interactive ? 1 : 0.5,
				pointerEvents: isGhost ? 'none' : 'auto',
			}}
		>
			{/* Character Name on Top */}
			<BoxedText x={0} y={-6} text={character.props.name} />

			{/* Token Circle */}
			<circle
				cx='0'
				cy='0'
				r='3'
				fill='var(--primary)'
				strokeWidth={0.5}
				stroke={highlight ? 'var(--accent)' : 'var(--text)'}
				style={highlight ? { filter: 'drop-shadow(0 0 2.5px var(--accent))' } : {}}
			/>

			{/* Initials in the center */}
			<text
				x='0'
				y='0.5'
				textAnchor='middle'
				dominantBaseline='middle'
				fill='var(--text)'
				fontSize='3.5'
				style={{
					userSelect: 'none',
					pointerEvents: 'none',
					fontWeight: 'bold',
					letterSpacing: '-0.25px',
				}}
			>
				{getCharacterInitials(character)}
			</text>

			{/* Resource Bars on Bottom */}
			<g>
				{resources.map((resource, idx) => (
					<ResourceBar key={idx} idx={idx} resource={resource} />
				))}
			</g>
		</g>
	);
};

const ResourceBar: React.FC<{
	idx: number;
	resource: { color: string; current: number; max: number };
}> = ({ idx, resource: { color, current, max } }) => {
	const height = 1.2;
	const fullWidth = 16;
	const x = -fullWidth / 2;
	const y = 4 + idx * (height + 0.3);
	return (
		<>
			<rect x={x} y={y} width={fullWidth} height={height} fill='#333' rx='0.2' />
			<rect x={x} y={y} width={(fullWidth * current) / max} height={height} fill={color} rx='0.2' />
			<text
				x='0'
				y={y + height / 2}
				textAnchor='middle'
				dominantBaseline='middle'
				fill='#000'
				fontSize='1.0'
				style={{ userSelect: 'none', pointerEvents: 'none' }}
			>
				{current}/{max}
			</text>
		</>
	);
};
