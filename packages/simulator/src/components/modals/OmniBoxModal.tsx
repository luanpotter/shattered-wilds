import { getEnumKeys } from '@shattered-wilds/commons';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { Character, Encounter } from '../../types/ui';
import { isSimpleRouteDefinition, Navigator, Route, ROUTES } from '../../utils/routes';
import { OmniBoxContext } from '../omni/OmniBoxContext';
import { OmniBoxOption, OmniBoxOptionType } from '../omni/OmniBoxOption';

const ROW_HEIGHT = 24;
const VISIBLE_ROWS = 8;

interface OmniBoxModalProps {
	context: OmniBoxContext;
	onClose: () => void;
}

export const OmniBoxModal: React.FC<OmniBoxModalProps> = ({ context, onClose }) => {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const selectedRef = useRef<HTMLDivElement>(null);

	const characters = useStore(state => state.characters);
	const encounters = useStore(state => state.encounters);
	const { closeAllModals } = useModals();

	const [currentContext, updateContext] = useState<OmniBoxContext>(context);

	const allOptions: OmniBoxOption[] = useMemo(
		() => [
			...buildMiscOptions({ closeAllModals }),
			...buildNavigationOptions({ characters, encounters }),
			...buildContextOptions({ characters, encounters, updateContext }),
		],
		[characters, closeAllModals, encounters],
	);

	const filteredOptions = useMemo(() => {
		const q = query.toLowerCase();
		return allOptions
			.filter(option => !currentContext.type || option.type === currentContext.type)
			.filter(option => option.label.toLowerCase().includes(q));
	}, [allOptions, currentContext.type, query]);

	useEffect(() => setSelectedIndex(0), [filteredOptions.length]);
	useEffect(() => selectedRef.current?.scrollIntoView({ block: 'nearest' }), [selectedIndex]);

	const act = useCallback(
		(option: OmniBoxOption) => {
			option.action();
			if (option.type === OmniBoxOptionType.Context) {
				// context-related options should not close the omni-box
				setQuery('');
			} else {
				onClose();
			}
		},
		[onClose],
	);

	const executeSelected = useCallback(() => {
		const option = filteredOptions[selectedIndex];
		if (option) {
			act(option);
		}
	}, [filteredOptions, selectedIndex, act]);

	const moveSelection = useCallback(
		(delta: number) => {
			const len = filteredOptions.length;
			setSelectedIndex(i => (((i + delta) % len) + len) % len);
		},
		[filteredOptions],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				moveSelection(-1);
				break;
			case 'ArrowDown':
				e.preventDefault();
				moveSelection(1);
				break;
			case 'Tab':
				e.preventDefault();
				moveSelection(e.shiftKey ? -1 : 1);
				break;
			case 'Enter':
				e.preventDefault();
				executeSelected();
				break;
			case 'Escape':
				e.preventDefault();
				onClose();
				break;
		}
	};

	const listHeight = Math.min(filteredOptions.length || 1, VISIBLE_ROWS) * ROW_HEIGHT;

	return (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			<ContextBadge context={currentContext} />
			<input
				ref={input => input?.focus()}
				type='text'
				placeholder='Type to search...'
				value={query}
				onChange={e => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={onClose}
				style={{
					padding: '6px 8px',
					fontSize: '14px',
					border: 'none',
					borderBottom: '1px solid var(--text)',
					background: 'transparent',
					color: 'var(--text)',
					outline: 'none',
				}}
			/>
			<div
				style={{
					height: listHeight,
					overflowY: filteredOptions.length > VISIBLE_ROWS ? 'auto' : 'hidden',
				}}
			>
				{filteredOptions.length === 0 ? (
					<NoMatches />
				) : (
					filteredOptions.map((option, index) => (
						<OptionRow
							key={`${option.type}-${option.label}`}
							ref={index === selectedIndex ? selectedRef : null}
							option={option}
							isSelected={index === selectedIndex}
							onMouseEnter={() => setSelectedIndex(index)}
							onMouseDown={e => {
								e.preventDefault();
								act(option);
							}}
						/>
					))
				)}
			</div>
		</div>
	);
};

const OptionRow = forwardRef<
	HTMLDivElement,
	{
		option: OmniBoxOption;
		isSelected: boolean;
		onMouseEnter: () => void;
		onMouseDown: (e: React.MouseEvent) => void;
	}
>(function OptionRow({ option, isSelected, onMouseEnter, onMouseDown }, ref) {
	return (
		<div
			ref={ref}
			onMouseEnter={onMouseEnter}
			onMouseDown={onMouseDown}
			style={{
				height: ROW_HEIGHT,
				padding: '0 8px',
				fontSize: '13px',
				cursor: 'pointer',
				background: isSelected ? 'var(--text)' : 'transparent',
				color: isSelected ? 'var(--background)' : 'var(--text)',
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				boxSizing: 'border-box',
			}}
		>
			<TypeBadge type={option.type} inverted={isSelected} />
			<span>{option.label}</span>
		</div>
	);
});

const TypeBadge: React.FC<{ type: OmniBoxOptionType; inverted: boolean }> = ({ type, inverted }) => {
	const labels: Record<OmniBoxOptionType, string> = {
		[OmniBoxOptionType.Context]: 'ctx',
		[OmniBoxOptionType.Navigation]: 'nav',
		[OmniBoxOptionType.Misc]: '...',
	};
	return (
		<span
			style={{
				fontSize: '10px',
				padding: '1px 4px',
				borderRadius: '2px',
				background: inverted ? 'var(--background)' : 'var(--text)',
				color: inverted ? 'var(--text)' : 'var(--background)',
				opacity: 0.7,
				fontFamily: 'monospace',
			}}
		>
			{labels[type]}
		</span>
	);
};

const NoMatches = () => (
	<div
		style={{
			height: ROW_HEIGHT,
			padding: '0 8px',
			opacity: 0.5,
			fontSize: '13px',
			display: 'flex',
			alignItems: 'center',
		}}
	>
		No matches
	</div>
);

const ContextBadge: React.FC<{ context: OmniBoxContext }> = ({ context }) => {
	const characters = useStore(state => state.characters);
	const character = context.characterId ? characters.find(c => c.id === context.characterId) : null;

	const encounters = useStore(state => state.encounters);
	const encounter = context.encounterId ? encounters.find(e => e.id === context.encounterId) : null;

	const pills: { label: string; value: string }[] = [
		context.type && { label: 'do', value: context.type },
		encounter && { label: 'in', value: encounter.name },
		character && { label: 'by', value: character.props.name },
	].filter(Boolean) as { label: string; value: string }[];

	if (pills.length === 0) return null;

	return (
		<div
			style={{
				padding: '4px 8px',
				fontSize: '11px',
				borderBottom: '1px solid var(--text)',
				display: 'flex',
				gap: '6px',
				flexWrap: 'wrap',
			}}
		>
			{pills.map(pill => (
				<span
					key={pill.label}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '4px',
						border: '1px solid var(--accent)',
						color: 'var(--text)',
						padding: '1px 8px 1px 6px',
					}}
				>
					<span style={{ opacity: 0.6, fontFamily: 'monospace' }}>{pill.label}:</span>
					<span style={{ fontWeight: 500 }}>{pill.value}</span>
				</span>
			))}
		</div>
	);
};

const buildNavigationOptions = ({
	characters,
	encounters,
}: {
	characters: Character[];
	encounters: Encounter[];
}): OmniBoxOption[] => [
	...buildSimpleNavigationOptions(),
	...characters.map(buildCharacterNavigationOption),
	...encounters.map(buildEncounterNavigationOption),
	{ type: OmniBoxOptionType.Navigation, label: 'Back to Site', action: Navigator.toSite },
];

const buildEncounterNavigationOption = (encounter: Encounter): OmniBoxOption => ({
	type: OmniBoxOptionType.Navigation,
	label: `Encounter: ${encounter.name}`,
	action: () => Navigator.to(Route.Encounter, { encounterId: encounter.id }),
});

const buildCharacterNavigationOption = (character: Character): OmniBoxOption => ({
	type: OmniBoxOptionType.Navigation,
	label: `Character: ${character.props.name}`,
	action: () => Navigator.to(Route.Character, { characterId: character.id }),
});

const buildSimpleNavigationOptions = (): OmniBoxOption[] =>
	Object.values(ROUTES)
		.filter(isSimpleRouteDefinition)
		.map(def => ({
			type: OmniBoxOptionType.Navigation,
			label: def.label,
			action: () => Navigator.to(def.route),
		}));

const buildMiscOptions = ({ closeAllModals }: { closeAllModals: () => void }): OmniBoxOption[] => [
	{ type: OmniBoxOptionType.Misc, label: 'Close All', action: closeAllModals },
	{ type: OmniBoxOptionType.Misc, label: 'Close', action: () => {} }, // just closes the omni-box
];

const buildContextOptions = ({
	characters,
	encounters,
	updateContext,
}: {
	characters: Character[];
	encounters: Encounter[];
	updateContext: React.Dispatch<React.SetStateAction<OmniBoxContext>>;
}): OmniBoxOption[] => {
	return [
		{ type: OmniBoxOptionType.Context, label: 'Clear Context', action: () => updateContext({}) },
		...characters.map(character => buildCharacterContextOption({ character, updateContext })),
		...encounters.map(encounter => buildEncounterContextOption({ encounter, updateContext })),
		...getEnumKeys(OmniBoxOptionType).map(type => buildTypeContextOption({ type, updateContext })),
	];
};

const buildCharacterContextOption = ({
	character,
	updateContext,
}: {
	character: Character;
	updateContext: React.Dispatch<React.SetStateAction<OmniBoxContext>>;
}): OmniBoxOption => ({
	type: OmniBoxOptionType.Context,
	label: `Context: by ${character.props.name}`,
	action: () => updateContext(prev => ({ ...prev, characterId: character.id })),
});

const buildEncounterContextOption = ({
	encounter,
	updateContext,
}: {
	encounter: Encounter;
	updateContext: React.Dispatch<React.SetStateAction<OmniBoxContext>>;
}): OmniBoxOption => ({
	type: OmniBoxOptionType.Context,
	label: `Context: in ${encounter.name}`,
	action: () => updateContext(prev => ({ ...prev, encounterId: encounter.id })),
});

const buildTypeContextOption = ({
	type,
	updateContext,
}: {
	type: OmniBoxOptionType;
	updateContext: React.Dispatch<React.SetStateAction<OmniBoxContext>>;
}): OmniBoxOption => ({
	type: OmniBoxOptionType.Context,
	label: `Context: do ${OmniBoxOptionType[type]}`,
	action: () => updateContext(prev => ({ ...prev, type })),
});
