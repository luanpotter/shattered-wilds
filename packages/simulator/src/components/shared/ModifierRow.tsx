import { Bonus, CircumstanceModifier, Check, InherentModifier, ModifierSource } from '@shattered-wilds/d12';
import React from 'react';

interface ModifierRowProps {
	check: Check;
	additionalModifiers?: (CircumstanceModifier | null | undefined)[];
}

interface ModifierBox {
	label: string;
	value: Bonus;
	tooltip: string;
}

const ModifierRow: React.FC<ModifierRowProps> = ({ check, additionalModifiers = [] }) => {
	const validAdditionalModifiers = additionalModifiers.filter(
		(cm): cm is CircumstanceModifier => cm !== null && cm !== undefined,
	);

	// Separate modifiers by type
	const inherentModifiers = check.statModifier.appliedModifiers.filter(mod => mod instanceof InherentModifier);
	const equipmentModifiers = check.statModifier.appliedModifiers.filter(
		mod => !(mod instanceof InherentModifier) && mod.source === ModifierSource.Equipment,
	);
	const circumstanceModifiers = [
		...check.statModifier.appliedModifiers.filter(
			mod => !(mod instanceof InherentModifier) && mod.source !== ModifierSource.Equipment,
		),
		...validAdditionalModifiers,
	];

	// Build boxes
	const boxes: ModifierBox[] = [];

	// 1. Inherent box (base stat + inherent modifiers like racial/class)
	const inherentValue = check.statModifier.inherentModifier;
	const inherentTooltip = [
		`${check.statModifier.baseValue.description} (Base)`,
		...inherentModifiers.map(mod => `${mod.value.description} (${mod.name})`),
	].join('\n');
	boxes.push({
		label: String(check.statModifier.name),
		value: inherentValue,
		tooltip: inherentTooltip,
	});

	// 2. Equipment box (if any)
	if (equipmentModifiers.length > 0) {
		const equipValue = Bonus.add(equipmentModifiers.map(m => m.value));
		const equipTooltip = equipmentModifiers.map(mod => `${mod.value.description} (${mod.name})`).join('\n');
		boxes.push({
			label: 'Equip',
			value: equipValue,
			tooltip: equipTooltip,
		});
	}

	// 3. Circumstance box (if any)
	if (circumstanceModifiers.length > 0) {
		const cmValue = Bonus.add(circumstanceModifiers.map(m => m.value));
		const cmTooltip = circumstanceModifiers.map(mod => `${mod.value.description} (${mod.name})`).join('\n');
		boxes.push({
			label: 'CM',
			value: cmValue,
			tooltip: cmTooltip,
		});
	}

	// Calculate total
	const additionalTotal = validAdditionalModifiers.reduce((sum, cm) => sum + cm.value.value, 0);
	const total = check.statModifier.value.value + additionalTotal;
	const totalFormatted = total >= 0 ? `+${total}` : `${total}`;

	const boxStyle: React.CSSProperties = {
		display: 'inline-flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '3px 8px',
		backgroundColor: 'var(--background-alt)',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		cursor: 'default',
		minWidth: '36px',
	};

	const valueStyle: React.CSSProperties = {
		fontWeight: 'bold',
		fontSize: '0.95em',
		lineHeight: 1.1,
	};

	const labelStyle: React.CSSProperties = {
		fontSize: '0.65em',
		opacity: 0.7,
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
	};

	const separatorStyle: React.CSSProperties = {
		margin: '0 3px',
		opacity: 0.5,
		fontSize: '0.8em',
	};

	const totalBoxStyle: React.CSSProperties = {
		...boxStyle,
		border: '1px solid var(--accent)',
		color: 'var(--accent-text)',
	};

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '3px',
			}}
		>
			{boxes.map((box, index) => (
				<React.Fragment key={box.label}>
					{index > 0 && <span style={separatorStyle}>+</span>}
					<div style={boxStyle} title={box.tooltip}>
						<span style={valueStyle}>{box.value.description}</span>
						<span style={labelStyle}>{box.label}</span>
					</div>
				</React.Fragment>
			))}

			<span style={{ ...separatorStyle, marginLeft: 'auto' }}>=</span>
			<div style={totalBoxStyle}>
				<span style={valueStyle}>{totalFormatted}</span>
				<span style={labelStyle}>Total</span>
			</div>
		</div>
	);
};

export default ModifierRow;
