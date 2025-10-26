import { ArcaneFocus, Armor, CharacterSheet, Item, OtherItem, Shield, Weapon } from '@shattered-wilds/commons';

import { Bold, Box, Dash } from './printer-friendly-commons';

export const PrintFriendlyEquipment = ({ sheet }: { sheet: CharacterSheet }) => {
	const wrapTraits = (traits: string[]) => {
		return traits.map(trait => (
			<span key={trait} style={{ marginLeft: '0.25em' }}>
				[{trait}]
			</span>
		));
	};

	const renderItem = (item: Item) => {
		if (item instanceof Weapon) {
			return (
				<div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
					<Bold>{item.name}</Bold>
					{item.modes.map((mode, idx) => (
						<div key={idx} style={{ display: 'flex', marginLeft: '1em' }}>
							<div>
								<span>
									[{mode.type} {mode.bonus.description}, Range: {mode.range.description}]
								</span>
								{wrapTraits(item.traits)}
							</div>
							<Dash />
							<Box>{mode.bonus.description}</Box>
						</div>
					))}
				</div>
			);
		} else if (item instanceof Armor) {
			return (
				<>
					<div>
						<Bold>{item.name}</Bold>
						&nbsp;
						<span>
							[{item.type} {item.bonus.description}, Dex Penalty: {item.dexPenalty.description}]
						</span>
						{wrapTraits(item.traits)}
					</div>
					<Dash />
					<Box>{item.bonus.description}</Box>
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
					<Box>{item.bonus.description}</Box>
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
					<Box>{item.bonus.description}</Box>
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

	return (
		<>
			{sheet.equipment.items.map((item, idx) => {
				return (
					<div key={idx} style={{ display: 'flex', width: '100%' }}>
						{renderItem(item)}
					</div>
				);
			})}
		</>
	);
};
