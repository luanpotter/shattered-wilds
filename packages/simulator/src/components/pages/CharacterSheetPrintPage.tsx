import { CharacterSheet, DerivedStatType, FeatInfo, FeatsSection } from '@shattered-wilds/commons';
import { asc, map } from 'type-comparator';

import { useStore } from '../../store';
import { PrintFriendlyEquipment } from '../PrintFriendlyEquipment';
import { PrintFriendlyTree } from '../PrintFriendlyTree';
import { RichText } from '../shared/RichText';

export const CharacterSheetPrintPage = ({ characterId }: { characterId: string }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId));
	if (!character) {
		return <div style={{ color: 'var(--error-color)', width: '100%', textAlign: 'center' }}>Character not found</div>;
	}
	const sheet = CharacterSheet.from(character.props);

	return <CharacterSheetPrintContent sheet={sheet} />;
};

export const CharacterSheetPrintContent = ({ sheet }: { sheet: CharacterSheet }) => {
	const statTree = sheet.getStatTree();

	const featsSection = FeatsSection.create(sheet);
	const feats = featsSection.featsOrSlotsByLevel
		.flatMap(f => f.featsOrSlots)
		.map(f => f.info)
		.filter(info => info != null)
		.filter(info => !info.feat.hideForPrint)
		.sort(map((info: FeatInfo<void>) => (info.feat.isGeneral ? 0 : 1), asc));

	const baseStyle = {
		color: 'black',
	};
	const Bold = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
		<strong style={{ color: 'black', ...style }}>{children}</strong>
	);

	const Blocks = ({ children }: { children: React.ReactNode }) => {
		return (
			<div
				className='print-container'
				style={{
					background: 'white',
					padding: '1rem',
					width: '210mm',
					overflow: 'scroll',
					maxWidth: '794px',
					margin: '0 auto',
					marginBottom: '1em',
					pageBreakAfter: 'always',
					display: 'block',
					...baseStyle,
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
				<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', marginBottom: '1rem' }}>
					<span>
						<Bold>Size:</Bold> {sheet.size.toString()}
					</span>
					<span>
						<Bold>Movement: </Bold>
						{statTree.getDistance(DerivedStatType.Movement).value.description}
					</span>
					<span>
						<Bold>Influence Range: </Bold>
						{statTree.getDistance(DerivedStatType.InfluenceRange).value.description}
					</span>
					<span>
						<Bold>Initiative: </Bold>
						{statTree.getModifier(DerivedStatType.Initiative).value.description}
					</span>
				</div>
				<PrintFriendlyTree characterSheet={sheet} />
				<hr />
				<div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
					<div style={{ width: '50%', height: '120px', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Conditions</Bold>
						</div>
					</div>
					<div style={{ width: '50%', height: '120px', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Consequences</Bold>
						</div>
					</div>
				</div>
				<hr />
				<div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
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
				<div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
					<div style={{ width: '100%', border: '1px solid black' }}>
						<div style={{ textAlign: 'center', borderBottom: '1px dotted black', margin: '0 1em' }}>
							<Bold>Feats</Bold>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '8px' }}>
							{feats.map((feat, idx) => (
								<div key={idx} className='rich-text' style={{ borderLeft: '2px solid #217be2ff', paddingLeft: '4px' }}>
									<Bold>{feat.name}</Bold>
									<div style={{ textAlign: 'justify', fontSize: '0.75em' }}>
										<RichText>{feat.description}</RichText>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</Blocks>
		</>
	);
};
