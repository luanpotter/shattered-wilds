import React from 'react';

export interface TabItem<T extends string> {
	key: T;
	label: string;
	icon?: React.ComponentType<{ size?: number }>;
}

export interface TabsProps<T extends string> {
	tabs: ReadonlyArray<TabItem<T>>;
	activeKey: T;
	onChange: (key: T) => void;
	iconSize?: number;
}

export function Tabs<T extends string>({ tabs, activeKey, onChange, iconSize = 14 }: TabsProps<T>) {
	return (
		<div
			style={{
				display: 'flex',
				borderBottom: '1px solid var(--text)',
				marginBottom: '16px',
				gap: '2px',
			}}
		>
			{tabs.map(tab => {
				const Icon = tab.icon;
				const isActive = tab.key === activeKey;
				return (
					<button
						key={tab.key}
						onClick={() => onChange(tab.key)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
							padding: '8px 12px',
							border: 'none',
							borderRadius: 0,
							borderBottom: isActive ? '2px solid var(--text)' : '2px solid transparent',
							backgroundColor: isActive ? 'var(--background-alt)' : 'transparent',
							color: 'var(--text)',
							cursor: 'pointer',
							fontSize: '0.9em',
							fontWeight: isActive ? 'bold' : 'normal',
						}}
					>
						{Icon ? <Icon size={iconSize} /> : null}
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}
