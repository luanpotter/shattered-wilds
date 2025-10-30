import { ArcaneSection, ArcaneSectionDefaults, Bonus, Value } from '@shattered-wilds/commons';

import { Bold, Dash, PartialComponent, PrintRichText, ValueBox } from './print-friendly-commons';

export const PrintFriendlyArcane = ({ arcaneSection }: { arcaneSection: ArcaneSection }) => {
	const ColumnItem = ({ label, value }: { label: string; value: Value }) => (
		<div
			style={{
				fontSize: '0.75em',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			<span>{label}</span>
			<Dash />
			<ValueBox value={value} />
		</div>
	);

	const defaultCastingTime = ArcaneSection.allCastingTimeOptions[ArcaneSectionDefaults.INITIAL_CASTING_TIME_INDEX];
	const defaultFocusCost = ArcaneSection.allFocusCostOptions[ArcaneSectionDefaults.INITIAL_FOCUS_COST_INDEX];

	return (
		<div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
			<div style={{ width: '100%', border: '1px solid black' }}>
				<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
					<Bold>Arcane Casting</Bold>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem', margin: '8px', justifyContent: 'center' }}>
					<PartialComponent label='Base Modifier' value={arcaneSection.baseModifier.value} />
					{Object.entries(arcaneSection.componentOptions).map(([key, options]) => {
						const option = options[options.length - 1]!;
						return (
							<>
								<span>+</span>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} key={key}>
									<PartialComponent key={key} label={option.name} value={option.toComponentModifier().value} />
									{option.cost && <PrintRichText style={{ fontSize: '0.5em' }}>{`[${option.cost}]`}</PrintRichText>}
								</div>
							</>
						);
					})}
					<span>=</span>
					<PartialComponent label='Total' value={arcaneSection.fundamentalCheck.statModifier.value} />
					<span>(&ge;</span>
					<PartialComponent label='Base DC' value='15' />
					<span>or Contested)</span>
				</div>
				<div style={{ display: 'flex', gap: '0.5rem', margin: '8px', justifyContent: 'stretch' }}>
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>Casting Time</div>
						<ColumnItem label={`${defaultCastingTime.name} [default]`} value={defaultCastingTime.modifier} />
						{arcaneSection.castingTimeOptions
							.filter(option => option.name !== defaultCastingTime.name)
							.map((option, idx) => (
								<ColumnItem key={idx} label={option.name} value={option.modifier} />
							))}
					</div>
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>Focus Points</div>
						<ColumnItem label={`${defaultFocusCost.name} [default]`} value={defaultFocusCost.modifier} />
						{arcaneSection.focusCostOptions
							.filter(option => option.name !== defaultFocusCost.name)
							.map((option, idx) => (
								<ColumnItem key={idx} label={option.name} value={option.modifier} />
							))}
						<PrintRichText style={{ textAlign: 'center' }}>
							(_You can only spend [[FP]] up the [[AP]] used._)
						</PrintRichText>
					</div>
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>Range</div>
						<ColumnItem label='Influence Range' value={arcaneSection.influenceRange.value} />
						<ColumnItem
							label={`1st Increment (${arcaneSection.influenceRange.value.times(2).description})`}
							value={Bonus.of(-3)}
						/>
						<ColumnItem
							label={`2nd Increment (${arcaneSection.influenceRange.value.times(3).description})`}
							value={Bonus.of(-6)}
						/>
						<ColumnItem
							label={`3rd Increment (${arcaneSection.influenceRange.value.times(4).description})`}
							value={Bonus.of(-9)}
						/>
						<ColumnItem
							label={`4th Increment (${arcaneSection.influenceRange.value.times(5).description})`}
							value={Bonus.of(-12)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
