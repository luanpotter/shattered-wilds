import React from 'react';
import { IconType } from 'react-icons';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ButtonProps {
	variant?: 'normal' | 'inline';
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

	const style = {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		...(type === 'inline' ? { padding: '2px 6px', fontSize: '0.9em' } : {}),
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
