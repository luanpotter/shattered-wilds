import React from 'react';
import { IconType } from 'react-icons';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ButtonProps {
	type?: 'normal' | 'inline' | 'inline-full';
	icon: IconType;
	title: string;
	onClick: () => void;
	warning?: string | undefined;
}

export const Button: React.FC<ButtonProps> = ({ type, icon: Icon, title, onClick, warning }) => {
	const isInline = type === 'inline' || type === 'inline-full';
	const style = {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		...(isInline ? { padding: '2px 6px', fontSize: '0.9em' } : {}),
		...(type === 'inline-full' ? { width: '100%' } : {}),
	};
	return (
		<button onClick={onClick} style={style} title={title}>
			<Icon />
			{title}
			{warning && <FaExclamationTriangle size={12} style={{ color: 'orange', marginLeft: 'auto' }} title={warning} />}
		</button>
	);
};
