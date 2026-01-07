import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isSimpleRouteDefinition, Navigator, ROUTES } from '../../utils/routes';
import { OmniBoxContext } from '../omni/OmniBoxContext';
import { OmniBoxOption, OmniBoxOptionType } from '../omni/OmniBoxOption';

const ROW_HEIGHT = 24;
const VISIBLE_ROWS = 8;

interface OmniBoxModalProps {
	context: OmniBoxContext | undefined;
	onClose: () => void;
}

export const OmniBoxModal: React.FC<OmniBoxModalProps> = ({ context, onClose }) => {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const selectedRef = useRef<HTMLDivElement>(null);

	const allOptions: OmniBoxOption[] = useMemo(
		() => [
			{ type: OmniBoxOptionType.Misc, label: 'Close', action: () => {} },
			...buildNavigationOptions(),
			// TODO: add more options
		],
		[],
	);

	const filteredOptions = useMemo(() => {
		const q = query.toLowerCase();
		return allOptions.filter(opt => opt.label.toLowerCase().includes(q));
	}, [allOptions, query]);

	useEffect(() => setSelectedIndex(0), [filteredOptions.length]);
	useEffect(() => selectedRef.current?.scrollIntoView({ block: 'nearest' }), [selectedIndex]);

	const act = useCallback(
		(option: OmniBoxOption) => {
			option.action();
			onClose();
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
			{context && <ContextBadge context={context} />}
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

const ContextBadge: React.FC<{ context: OmniBoxContext }> = ({ context }) => (
	<div style={{ padding: '4px 8px', fontSize: '11px', opacity: 0.6, borderBottom: '1px solid var(--text)' }}>
		{JSON.stringify(context)}
	</div>
);

const buildNavigationOptions = (): OmniBoxOption[] =>
	Object.values(ROUTES)
		.filter(isSimpleRouteDefinition)
		.map(def => ({
			type: OmniBoxOptionType.Navigation,
			label: def.label,
			action: () => Navigator.to(def.route),
		}));
