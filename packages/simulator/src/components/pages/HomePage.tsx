import React from 'react';
import { FaArrowAltCircleLeft, FaMap, FaUsers } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { semanticClick } from '../../utils';
import { Navigator, Route } from '../../utils/routes';

export const HomePage: React.FC = () => {
	const { openOmniBoxModal } = useModals();
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
			}}
		>
			<em style={{ textEmphasis: 'italics' }}>
				[Press <a {...semanticClick('button', () => openOmniBoxModal({ context: {} }))}>Ctrl+O</a> for OmniBox]
			</em>
			<div
				style={{
					display: 'flex',
					gap: '2rem',
					marginTop: '1rem',
				}}
			>
				<MenuCard
					icon={FaUsers}
					title='Characters'
					description='Manage character sheets'
					onClick={() => Navigator.to(Route.Characters)}
				/>
				<MenuCard
					icon={FaMap}
					title='Encounters'
					description='Simulate combat encounters'
					onClick={() => Navigator.to(Route.Encounters)}
				/>
				<MenuCard
					icon={FaArrowAltCircleLeft}
					title='Back to Site'
					description='Return to the main site'
					onClick={Navigator.toSite}
				/>
			</div>
		</div>
	);
};

interface MenuCardProps {
	icon: React.ComponentType<{ size?: number }>;
	title: string;
	description: string;
	onClick: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ icon: Icon, title, description, onClick }) => {
	return (
		<button
			onClick={onClick}
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '2rem',
				border: '1px solid var(--text)',
				borderRadius: '8px',
				backgroundColor: 'var(--background-alt)',
				cursor: 'pointer',
				width: '200px',
				gap: '1rem',
				transition: 'transform 0.1s ease-in-out',
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'scale(1.02)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'scale(1)';
			}}
		>
			<Icon size={48} />
			<div style={{ textAlign: 'center' }}>
				<h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{title}</h3>
				<p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{description}</p>
			</div>
		</button>
	);
};
