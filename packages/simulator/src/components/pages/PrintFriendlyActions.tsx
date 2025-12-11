import {
	ACTIONS,
	ActionType,
	firstParagraph,
	getRecordValues,
	PREDEFINED_ARCANE_SPELLS,
} from '@shattered-wilds/commons';

import { Blocks, Bold, InfoBox, PrintRichText } from '../print/print-friendly-commons';

export const PrintFriendlyActions = () => {
	const actionTypesToColors = {
		[ActionType.Movement]: '#3c3c3c',
		[ActionType.Attack]: '#c62828ff',
		[ActionType.Defense]: '#2e7d32ff',
		[ActionType.Support]: '#217be2ff',
		[ActionType.Heroic]: '#9436e7ff',
		[ActionType.Meta]: '#c01587ff',
	};

	const actionsPerType = Object.groupBy(getRecordValues(ACTIONS), action => action.type);
	const spellsPerSchool = Object.groupBy(getRecordValues(PREDEFINED_ARCANE_SPELLS), spell => spell.school);

	return (
		<>
			{Object.entries(actionsPerType).map(([type, actions]) => (
				<Blocks key={type}>
					<div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '64px' }}>
						<div style={{ width: '100%', border: '1px solid black' }}>
							<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
								<Bold>{type} Actions</Bold>
							</div>
							{actions.map(action => (
								<div
									key={action.name}
									style={{
										borderLeft: `2px solid ${actionTypesToColors[action.type]}`,
										paddingLeft: '4px',
										margin: '8px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
										<Bold>{action.name}</Bold>
										<InfoBox
											style={{
												textDecoration: 'double underline',
												textDecorationColor: actionTypesToColors[action.type],
											}}
										>
											{action.type}
										</InfoBox>
										{action.costs.map(cost => (
											<InfoBox key={cost.resource}>{cost.shortDescription}</InfoBox>
										))}
										{action.traits.map(trait => (
											<InfoBox key={trait}>{trait}</InfoBox>
										))}
									</div>
									<PrintRichText>{firstParagraph(action.description)}</PrintRichText>
								</div>
							))}
						</div>
					</div>
				</Blocks>
			))}
			{Object.entries(spellsPerSchool).map(([school, spells]) => (
				<Blocks key={school}>
					<div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '64px' }}>
						<div style={{ width: '100%', border: '1px solid black' }}>
							<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
								<Bold>Predefined {school} Spells</Bold>
							</div>
							{spells.map(spell => (
								<div
									key={spell.name}
									style={{
										borderLeft: `2px solid #e28b21ff`,
										paddingLeft: '4px',
										margin: '8px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
										<Bold>{spell.name}</Bold>
										<InfoBox>{spell.school}</InfoBox>
										{spell.traits.map(trait => (
											<InfoBox key={trait}>{trait}</InfoBox>
										))}
										{spell.augmentations.map(augmentation => (
											<InfoBox key={augmentation.type}>{augmentation.description}</InfoBox>
										))}
									</div>
									<PrintRichText>{firstParagraph(spell.description)}</PrintRichText>
								</div>
							))}
						</div>
					</div>
				</Blocks>
			))}
		</>
	);
};
