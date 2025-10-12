import { useState } from 'react';

import { Button } from '../shared/Button';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';

interface CircumstanceDefinition {
	name: string;
	ranked: boolean;
	description: string;
}

interface AddCircumstanceModalProps<T extends string> {
	characterId: string;
	onClose: () => void;
	onConfirm: (item: T, rank: number) => void;
	items: T[];
	definitions: Record<T, CircumstanceDefinition>;
}

export function AddCircumstanceModal<T extends string>({
	onClose,
	onConfirm,
	items,
	definitions,
}: AddCircumstanceModalProps<T>) {
	const [selectedItem, setSelectedItem] = useState<T | null>(null);
	const [rank, setRank] = useState(1);

	const itemDef = selectedItem ? definitions[selectedItem] : null;

	const handleConfirm = () => {
		if (selectedItem) {
			onConfirm(selectedItem, itemDef?.ranked ? rank : 0);
			onClose();
		}
	};

	const handleCancel = () => {
		onClose();
	};

	return (
		<>
			<div style={{ marginBottom: '16px' }}>
				<LabeledDropdown
					label='Select Item'
					value={selectedItem}
					options={items}
					placeholder='-- Select an item --'
					onChange={item => {
						setSelectedItem(item);
						setRank(1); // Reset rank when changing item
					}}
				/>
			</div>

			{itemDef && (
				<>
					<div
						style={{
							marginBottom: '16px',
							padding: '12px',
							backgroundColor: 'var(--background-alt)',
							border: '1px solid var(--text)',
							borderRadius: '4px',
							fontSize: '0.9em',
						}}
					>
						<div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{itemDef.name}</div>
						<div style={{ textAlign: 'justify' }}>
							<RichText>{itemDef.description}</RichText>
						</div>
					</div>

					{itemDef.ranked && (
						<div style={{ marginBottom: '16px' }}>
							<LabeledInput
								label='Rank'
								value={rank.toString()}
								onChange={(value: string) => {
									const parsed = parseInt(value);
									if (!isNaN(parsed)) {
										setRank(Math.max(1, Math.min(10, parsed)));
									}
								}}
							/>
						</div>
					)}
				</>
			)}

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button onClick={handleCancel} title='Cancel' />
				<Button onClick={handleConfirm} title='Confirm' disabled={!selectedItem} />
			</div>
		</>
	);
}
