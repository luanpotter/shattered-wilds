import {
	ArcaneFocus,
	Armor,
	CharacterSheet,
	CheckFactory,
	Item,
	OtherItem,
	Shield,
	Weapon,
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
		if (item instanceof Weapon) {
			return (
				<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
					<Bold>{item.name}</Bold>
					{item.modes.map((mode, idx) => {
						const parts = [
							`${mode.type} ${mode.bonus.description}`,
							mode.range.isMelee() ? undefined : `Range: ${mode.range.description}`,
						].filter(e => e !== undefined);
						return (
							<div key={idx} style={{ display: 'flex', marginLeft: '1em' }}>
								<div>
									<span>[{parts.join(', ')}]</span>
									{wrapTraits(item.traits)}
								</div>
								<Dash />
								<ValueBox
									value={
										checkFactory.weapon({ weaponMode: new WeaponModeOption({ weapon: item, mode }) }).modifierValue
									}
								/>
							</div>
						);
					})}
				</div>
			);
		} else if (item instanceof Armor) {
			const parts = [
				item.type,
				item.bonus.description,
				item.dexPenalty.isNotZero ? `DEX Penalty: ${item.dexPenalty.description}` : undefined,
			].filter(e => e !== undefined);
			return (
				<>
					<div>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>[{parts.join(' ')}]</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<ValueBox value={checkFactory.armor({ armor: item }).modifierValue} />
				</>
			);
		} else if (item instanceof Shield) {
			return (
				<>
					<div>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>
							[{item.type} {item.bonus.description}]
						</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<ValueBox value={checkFactory.shield({ armor: defaultArmor, shield: item }).modifierValue} />
				</>
			);
		} else if (item instanceof ArcaneFocus) {
			return (
				<>
					<Bold>{item.name}</Bold>
					&nbsp;
					<span>[{item.description}]</span>
					{wrapTraits(item.traits)}
					<Dash />
					<ValueBox value={item.bonus} />
				</>
			);
		} else if (item instanceof OtherItem) {
			return (
				<>
					<Bold>{item.name}</Bold>
					&nbsp;
					{item.details && <span style={{ fontSize: '0.95em' }}>{item.details}</span>}
					{wrapTraits(item.traits)}
				</>
			);
		} else {
			return <>{item.name}</>;
		}
	};

	const getColorForItemType = (item: Item) => {
		if (item instanceof Weapon) {
			return '#c62828ff';
		} else if (item instanceof Armor) {
			return '#2e7d32ff';
		} else if (item instanceof Shield) {
			return '#1565c0ff';
		}
		return '#6d4c41ff';
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
