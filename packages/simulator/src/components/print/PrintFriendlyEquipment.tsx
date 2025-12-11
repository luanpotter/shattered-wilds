import {
	ArcaneComponentMode,
	ArmorMode,
	ArmorModeOption,
	CharacterSheet,
	CheckFactory,
	getItemType,
	Item,
	ModeType,
	ShieldMode,
	ShieldModeOption,
	WeaponMode,
	WeaponModeOption,
} from '@shattered-wilds/commons';

import { Bold, Dash, ValueBox } from './print-friendly-commons';

export const PrintFriendlyEquipment = ({ characterSheet }: { characterSheet: CharacterSheet }) => {
	const wrapTraits = (traits: string[]) => {
		return traits.map(trait => (
			<span key={trait} style={{ marginLeft: '0.25em', backgroundColor: '#6bffeeff' }}>
				[{trait}]
			</span>
		));
	};

	const checkFactory = new CheckFactory({ characterSheet });

	const defaultArmor = characterSheet.equipment.defaultArmor();

	const renderItem = (item: Item) => {
		const itemType = getItemType(item);

		// Weapon item (all modes are weapon modes)
		if (itemType === ModeType.Weapon) {
			const weaponModes = item.modes as WeaponMode[];
			return (
				<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
					<Bold>{item.name}</Bold>
					{weaponModes.map((mode, idx) => {
						const parts = [
							`${mode.type} ${mode.bonus.description}`,
							mode.range.isMelee() ? undefined : `Range: ${mode.range.description}`,
						].filter(e => e !== undefined);
						return (
							<div key={idx} style={{ display: 'flex', marginLeft: '1em' }}>
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<span>[{parts.join(', ')}]</span>
									{wrapTraits(item.traits)}
								</div>
								<Dash />
								<div style={{ display: 'flex', gap: '0.1em' }}>
									{mode.range.isMelee() ? undefined : <ValueBox value={mode.range} />}
									<ValueBox
										value={checkFactory.weapon({ weaponMode: new WeaponModeOption({ item, mode }) }).modifierValue}
									/>
								</div>
							</div>
						);
					})}
				</div>
			);
		}

		// Armor item (all modes are armor modes)
		if (itemType === ModeType.Armor) {
			const armorMode = item.modes[0] as ArmorMode;
			const parts = [
				armorMode.type,
				armorMode.bonus.description,
				armorMode.dexPenalty.isNotZero ? `DEX Penalty: ${armorMode.dexPenalty.description}` : undefined,
			].filter(e => e !== undefined);
			return (
				<>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>[{parts.join(' ')}]</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<ValueBox
						value={checkFactory.armor({ armor: new ArmorModeOption({ item, mode: armorMode }) }).modifierValue}
					/>
				</>
			);
		}

		// Shield item (all modes are shield modes)
		if (itemType === ModeType.Shield) {
			const shieldMode = item.modes[0] as ShieldMode;
			return (
				<>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>
							[{shieldMode.type} {shieldMode.bonus.description}]
						</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<ValueBox
						value={
							checkFactory.shield({ armor: defaultArmor, shield: new ShieldModeOption({ item, mode: shieldMode }) })
								.modifierValue
						}
					/>
				</>
			);
		}

		// Arcane component item (all modes are arcane modes)
		if (itemType === ModeType.Arcane) {
			const arcaneMode = item.modes[0] as ArcaneComponentMode;
			return (
				<>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>[{arcaneMode.description}]</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<ValueBox value={arcaneMode.bonus} />
				</>
			);
		}

		// Other/mixed item - just show name and traits
		return (
			<>
				<Bold>{item.name}</Bold>
				{item.modes.length > 0 && (
					<>
						&nbsp;
						<span style={{ fontSize: '0.95em' }}>{item.modes.map(m => m.description).join('; ')}</span>
					</>
				)}
				{wrapTraits(item.traits)}
			</>
		);
	};

	const getColorForItemType = (item: Item) => {
		const itemType = getItemType(item);
		switch (itemType) {
			case ModeType.Weapon:
				return '#c62828ff';
			case ModeType.Armor:
				return '#2e7d32ff';
			case ModeType.Shield:
				return '#1565c0ff';
			default:
				return '#6d4c41ff';
		}
	};

	return (
		<>
			{characterSheet.equipment.items.map((item, idx) => {
				const color = getColorForItemType(item);
				return (
					<div key={idx} style={{ display: 'flex', borderLeft: `2px solid ${color}`, paddingLeft: '4px' }}>
						{renderItem(item)}
					</div>
				);
			})}
		</>
	);
};
