import { Check, CheckMode, CheckNature, StatNode, StatTree } from '@shattered-wilds/commons';
import React from 'react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';

import { useHandleAllocatePoint, useHandleDeallocatePoint } from './shared-logic';

interface StatValueComponentProps {
	tree: StatTree;
	node: StatNode;
	characterId?: string;
	variant?: 'default' | 'text-only';
	onUpdateCharacterProp: (key: string, value: string) => void;
}

export const StatValueComponent: React.FC<StatValueComponentProps> = ({
	tree,
	node,
	characterId,
	variant = 'default',
	onUpdateCharacterProp,
}) => {
	const onAllocate = useHandleAllocatePoint(onUpdateCharacterProp);
	const onDeallocate = useHandleDeallocatePoint(onUpdateCharacterProp);

	const canAllocate = node.canAllocatePoint;
	const canDeallocate = node.canDeallocatePoint;
	const onClick = () => onAllocate(node);
	const onRightClick = () => onDeallocate(node);

	const editMode = useStore(state => state.editMode);
	const { openDiceRollModal } = useModals();

	const modifier = tree.getNodeModifier(node);
	const value = modifier.value;

	const attributeName = node.type.name;

	const handleContextMenu = (e: React.MouseEvent) => {
		// Always prevent default context menu
		e.preventDefault();
		if (canDeallocate && onRightClick && editMode) {
			onRightClick();
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click from reaching parent elements
		e.stopPropagation();
		if (editMode) {
			if (canAllocate && onClick) {
				onClick();
			}
		} else {
			// In play mode, open dice roll modal
			if (characterId) {
				openDiceRollModal({
					characterId,
					check: new Check({
						mode: CheckMode.Static,
						nature: CheckNature.Active,
						statModifier: modifier,
					}),
					title: `Roll ${attributeName} Check`,
				});
			}
		}
	};

	const tooltip = modifier.appliedModifiers.map(mod => mod.description);
	const hasWarning = modifier.wasLevelCapped;
	if (hasWarning) {
		tooltip.push(
			`This stat was capped from ${modifier.baseValuePreCap.description} to ${modifier.baseValue.description}.`,
		);
	}
	const hasTooltip = tooltip.length > 0;

	const commonClickProps = !editMode
		? {
				onClick: handleClick,
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleClick(e as unknown as React.MouseEvent);
					}
				},
				role: 'button',
				tabIndex: 0,
			}
		: {};

	const pointsElement = (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				width: '24px',
				height: '24px',
				borderRadius: '50%',
				backgroundColor:
					(editMode && (canAllocate || canDeallocate)) || !editMode ? 'var(--background-alt)' : 'transparent',
				border: '1px solid var(--text)',
				cursor: (editMode && (canAllocate || canDeallocate)) || !editMode ? 'pointer' : 'default',
				fontSize: '0.9em',
				fontWeight: 'bold',
				position: 'relative',
			}}
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			onKeyDown={canAllocate ? e => e.key === 'Enter' && onClick?.() : undefined}
			tabIndex={canAllocate ? 0 : undefined}
			role={canAllocate ? 'button' : undefined}
			aria-label={canAllocate ? `Allocate point to attribute` : undefined}
		>
			{node.points}
		</div>
	);

	const iconStyle: React.CSSProperties = {
		position: 'absolute',
		top: '-4px',
		right: '-4px',
		width: '10px',
		height: '10px',
		color: 'var(--text)',
		cursor: 'help',
	};

	const valueElement =
		variant === 'text-only' ? (
			<span
				style={{
					fontSize: '0.9em',
					fontWeight: 'bold',
					cursor: !editMode ? 'pointer' : 'default',
				}}
				title={tooltip.join('\n')}
				{...commonClickProps}
			>
				{value.description}
				{hasTooltip && (
					<FaInfoCircle
						style={{
							marginLeft: '4px',
							width: '10px',
							height: '10px',
							color: 'var(--text)',
							cursor: 'help',
						}}
					/>
				)}
			</span>
		) : (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '24px',
					height: '24px',
					borderRadius: '4px',
					backgroundColor: 'var(--background-alt)',
					fontSize: '0.9em',
					fontWeight: 'bold',
					position: 'relative',
					cursor: !editMode ? 'pointer' : 'default',
				}}
				title={tooltip.join('\n')}
				{...commonClickProps}
			>
				{value.description}
				{hasWarning && <FaExclamationTriangle style={{ ...iconStyle, color: 'orange' }} />}
				{!hasWarning && hasTooltip && <FaInfoCircle style={iconStyle} />}
			</div>
		);

	return (
		<div
			style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
			onClick={e => e.stopPropagation()}
			role='presentation'
		>
			{pointsElement}
			{valueElement}
		</div>
	);
};
