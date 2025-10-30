import {
	ArcaneSection,
	ArcaneSectionDefaults,
	CharacterSheet,
	DerivedStatType,
	DivineSection,
	FeatInfo,
	FeatsSection,
	StatType,
} from '@shattered-wilds/commons';
import { asc, map } from 'type-comparator';

import { useStore } from '../../store';
import { Bold, PartialComponent, PrintRichText, ValueBox } from '../print/print-friendly-commons';
import { PrintFriendlyArcane } from '../print/PrintFriendlyArcane';
import { PrintFriendlyEquipment } from '../print/PrintFriendlyEquipment';
import { PrintFriendlyPersonality } from '../print/PrintFriendlyPersonality';
import { PrintFriendlyTree } from '../print/PrintFriendlyTree';

export const PrintFriendlyCharacterSheetPage = ({ characterId }: { characterId: string }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId));
	if (!character) {
		return <div style={{ color: 'var(--error-color)', width: '100%', textAlign: 'center' }}>Character not found</div>;
	}
	const sheet = CharacterSheet.from(character.props);

	return <CharacterSheetPrintContent characterId={characterId} sheet={sheet} />;
};

const maybeCreateArcaneSection = ({
	characterId,
	sheet,
}: {
	characterId: string;
	sheet: CharacterSheet;
}): ArcaneSection | null => {
	const { primaryAttribute } = sheet.characterClass.definition;
	if (!StatType.mindAttributes.includes(primaryAttribute.name)) {
		return null; // not a caster
	}

	const inputValues = ArcaneSectionDefaults.createDefaultInputValues(ArcaneSection.getComponentsForFlavor(sheet));
	return ArcaneSection.create({ characterId, sheet, inputValues });
};

export const CharacterSheetPrintContent = ({ characterId, sheet }: { characterId: string; sheet: CharacterSheet }) => {
	const statTree = sheet.getStatTree();

	const featsSection = FeatsSection.create(sheet);
	const feats = featsSection.featsOrSlotsByLevel
		.flatMap(f => f.featsOrSlots)
		.map(f => f.info)
		.filter(info => info != null)
		.filter(info => !info.feat.hideForPrint)
		.sort(map((info: FeatInfo<void>) => (info.feat.isGeneral ? 0 : 1), asc));

	const arcaneSection = maybeCreateArcaneSection({ characterId, sheet });
	const divineSection = DivineSection.create({ characterId, characterSheet: sheet });

	const Blocks = ({ children }: { children: React.ReactNode }) => {
		return (
			<div
				className='print-container'
				style={{
					background: 'white',
					padding: '1rem',
					width: '210mm',
					margin: '0 auto',
					marginBottom: '1em',
					display: 'flex',
					flexDirection: 'column',
					gap: '0.25em',
					color: 'black',
					height: '100%',
				}}
			>
				{children}
			</div>
		);
	};

	return (
		<>
			<Blocks>
				<div style={{ borderBottom: '1px solid black' }}>
					<Bold>{sheet.name}</Bold>
					<span style={{ float: 'right' }}>
						Level {sheet.level} {sheet.race.toString()} {sheet.characterClass.toString()}
					</span>
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
						<Bold>Size:</Bold> {sheet.size.toString()}
					</div>
					<div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
						<Bold>Movement: </Bold>
						<ValueBox value={statTree.getDistance(DerivedStatType.Movement).value} />
					</div>
					<div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
						<Bold>Influence Range: </Bold>
						<ValueBox value={statTree.getDistance(DerivedStatType.InfluenceRange).value} />
					</div>
					<div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
						<Bold>Initiative: </Bold>
						<ValueBox value={statTree.valueOf(DerivedStatType.Initiative)} />
					</div>
				</div>
				<PrintFriendlyTree characterSheet={sheet} />
				<div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '64px' }}>
					<div style={{ width: '50%', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Conditions</Bold>
						</div>
					</div>
					<div style={{ width: '50%', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Consequences</Bold>
						</div>
					</div>
				</div>
				<div style={{ display: 'flex', gap: '2rem' }}>
					<div style={{ flex: 1, border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Equipment</Bold>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '8px' }}>
							<PrintFriendlyEquipment characterSheet={sheet} />
						</div>
					</div>
				</div>
			</Blocks>
			<Blocks>
				<div style={{ display: 'flex', gap: '2rem' }}>
					<div style={{ width: '100%', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Feats</Bold>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '8px' }}>
							{feats.map((feat, idx) => (
								<div key={idx} style={{ borderLeft: '2px solid #217be2ff', paddingLeft: '4px' }}>
									<Bold>{feat.name}</Bold>
									<PrintRichText>{feat.description}</PrintRichText>
								</div>
							))}
						</div>
					</div>
				</div>
				{arcaneSection && <PrintFriendlyArcane arcaneSection={arcaneSection} />}
				{divineSection && (
					<div style={{ display: 'flex', gap: '2rem' }}>
						<div style={{ width: '100%', border: '1px solid black' }}>
							<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
								<Bold>Divine Channeling</Bold>
							</div>
							<div style={{ display: 'flex', gap: '0.5rem', margin: '8px', justifyContent: 'center' }}>
								<PartialComponent label='Base Modifier' value={divineSection.baseModifier.value} />
							</div>
						</div>
					</div>
				)}
				<PrintFriendlyPersonality personality={sheet.personality} />
				<div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '64px' }}>
					<div style={{ width: '100%', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Notes</Bold>
						</div>
					</div>
				</div>
			</Blocks>
		</>
	);
};
