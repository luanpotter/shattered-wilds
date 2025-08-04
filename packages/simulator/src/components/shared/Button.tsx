import React from 'react';
import { IconType } from 'react-icons';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ButtonProps {
	variant?: 'normal' | 'inline' | 'inline-full';
	icon?: IconType;
	title?: string;
	tooltip?: string;
	onClick: () => void;
	warning?: string | undefined;
	disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
	variant: type,
	icon: Icon,
	title,
	tooltip,
	onClick,
	warning,
	disabled,
}) => {
	if (!title && !Icon) {
		throw new Error('Button requires either title or icon prop');
	}
	if (!title && !tooltip) {
		throw new Error('Button requires either title or tooltip prop');
	}

	const isInline = type === 'inline' || type === 'inline-full';
	const style = {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		...(isInline ? { padding: '2px 6px', fontSize: '0.9em' } : {}),
		...(type === 'inline-full' ? { width: '100%' } : {}),
		...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
	};

	return (
		<button onClick={onClick} style={style} title={tooltip ?? title} disabled={disabled}>
			{Icon && <Icon />}
			{title}
			{warning && <FaExclamationTriangle size={12} style={{ color: 'orange', marginLeft: 'auto' }} title={warning} />}
		</button>
	);
};
