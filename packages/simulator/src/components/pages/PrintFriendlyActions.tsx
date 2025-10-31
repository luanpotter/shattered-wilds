import { ACTIONS, ActionType, firstParagraph, getRecordValues, RESOURCES } from '@shattered-wilds/commons';

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
											<InfoBox key={cost.resource}>
												{cost.amount}
												{cost.variable ? '+' : ''} {RESOURCES[cost.resource].shortCode}
											</InfoBox>
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
		</>
	);
};
