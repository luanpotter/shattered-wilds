import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

import { TempModal } from '../contexts/tempModalContext';
import { useTempModals } from '../hooks/useTempModals';

import { Button } from './shared/Button';

interface TempModalWrapperProps {
	modal: TempModal<unknown>;
	onStartDrag: (e: React.MouseEvent) => void;
}

const TempModalWrapper: React.FC<TempModalWrapperProps> = ({ modal, onStartDrag }) => {
	const { removeTempModal, updateTempModal } = useTempModals();
	const [isDragging, setIsDragging] = useState(false);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 0) {
			const titleBar = e.target instanceof Element && e.target.closest('.modal-title');
			if (titleBar) {
				e.preventDefault();
				e.stopPropagation();
				onStartDrag(e);
			}
		}
	};

	const handleClose = () => {
		removeTempModal(modal.id);
	};

	useEffect(() => {
		if (isDragging) {
			const handleDocumentMouseMove = (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				updateTempModal(modal.id, {
					position: {
						x: e.clientX,
						y: e.clientY,
					},
				});
			};

			const handleDocumentMouseUp = (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDragging(false);
			};

			document.addEventListener('mousemove', handleDocumentMouseMove);
			document.addEventListener('mouseup', handleDocumentMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleDocumentMouseMove);
				document.removeEventListener('mouseup', handleDocumentMouseUp);
			};
		}

		return () => {};
	}, [isDragging, modal.id, updateTempModal]);

	return (
		<>
			{isDragging && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 9998,
						cursor: 'grabbing',
					}}
				/>
			)}
			<div
				className='draggable-modal'
				onMouseDown={handleMouseDown}
				style={{
					position: 'absolute',
					left: modal.position.x,
					top: modal.position.y,
					width: modal.widthPixels ? `${modal.widthPixels}px` : 'fit-content',
					height: modal.heightPixels ? `${modal.heightPixels}px` : 'auto',
					minWidth: '250px',
					maxWidth: '95vw',
					maxHeight: '90vh',
					backgroundColor: 'var(--background)',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
					display: 'flex',
					flexDirection: 'column',
					userSelect: 'none',
					zIndex: 1000, // Higher z-index for temp modals to appear above persistent ones
					overflow: 'visible',
				}}
			>
				<div
					className='modal-title'
					style={{
						padding: '2px 6px',
						backgroundColor: 'var(--background-alt)',
						borderBottom: '1px solid var(--text)',
						cursor: isDragging ? 'grabbing' : 'grab',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						fontSize: '0.9em',
						height: '24px',
						overflow: 'hidden',
					}}
				>
					<span>{modal.title}</span>
					<div style={{ display: 'flex', gap: '4px' }}>
						<Button onClick={handleClose} icon={FaTimes} tooltip='Close' variant='inline' />
					</div>
				</div>
				<div
					style={{
						padding: '4px',
						overflow: 'auto',
						position: 'relative',
						zIndex: 1001,
						maxHeight: 'calc(100vh - 100px)',
						flex: '1',
						minHeight: '0',
					}}
				>
					{modal.content}
				</div>
			</div>
		</>
	);
};

interface TempModalRendererProps {
	onStartDrag: (modalId: string) => (e: React.MouseEvent) => void;
}

export const TempModalRenderer: React.FC<TempModalRendererProps> = ({ onStartDrag }) => {
	const { tempModals } = useTempModals();

	return (
		<>
			{tempModals.map(modal => (
				<TempModalWrapper key={modal.id} modal={modal} onStartDrag={onStartDrag(modal.id)} />
			))}
		</>
	);
};
