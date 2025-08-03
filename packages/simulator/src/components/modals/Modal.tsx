import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { Modal as ModalType } from '../../types';
import { Button } from '../shared/Button';

interface ModalProps {
	modal: ModalType;
	children: React.ReactNode;
	onStartDrag: (e: React.MouseEvent) => void;
	titleBarButtons?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ modal, children, onStartDrag, titleBarButtons }) => {
	const { closeModal, updateModal } = useModals();
	const [isDragging, setIsDragging] = useState(false);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button === 0) {
			// Left click only
			const titleBar = e.target instanceof Element && e.target.closest('.modal-title');
			if (titleBar) {
				e.preventDefault();
				e.stopPropagation(); // Prevent grid from handling this
				onStartDrag(e);
			}
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (isDragging) {
			e.preventDefault();
			updateModal({
				...modal,
				position: {
					x: e.clientX,
					y: e.clientY,
				},
			});
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleClose = () => {
		closeModal(modal.id);
	};

	// Add useEffect to handle document-level mouse events
	useEffect(() => {
		if (isDragging) {
			const handleDocumentMouseMove = (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				updateModal({
					...modal,
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
	}, [isDragging, modal, updateModal]);

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
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				/>
			)}
			<div
				className='draggable-modal'
				onMouseDown={handleMouseDown}
				style={{
					position: 'absolute',
					left: modal.position.x,
					top: modal.position.y,
					width: modal.width || 'fit-content',
					height: modal.height || 'auto',
					minWidth: '250px',
					minHeight: modal.width ? '200px' : 'auto', // If width is set, ensure minimum height
					maxWidth: '95vw',
					maxHeight: '90vh',
					backgroundColor: 'var(--background)',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
					display: 'flex',
					flexDirection: 'column',
					userSelect: 'none',
					zIndex: 999,
					overflow: 'visible',
				}}
			>
				<div
					className='modal-title'
					style={{
						padding: '2px 6px', // Reduced from 4px 8px
						backgroundColor: 'var(--background-alt)',
						borderBottom: '1px solid var(--text)',
						cursor: isDragging ? 'grabbing' : 'grab',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						fontSize: '0.9em',
						height: '24px', // Fixed height for compactness
						overflow: 'hidden', // Keep title bar with hidden overflow
					}}
				>
					<span>{modal.title}</span>
					<div style={{ display: 'flex', gap: '4px' }}>
						{titleBarButtons}
						<Button onClick={handleClose} icon={FaTimes} tooltip='Close' type='inline' />
					</div>
				</div>
				<div
					style={{
						padding: '4px',
						overflow: 'auto',
						position: 'relative',
						zIndex: 1000, // Higher z-index for content
						maxHeight: 'calc(100vh - 100px)', // Limit height to viewport minus some space for header
						flex: '1', // Take up remaining space in flexbox
						minHeight: '0', // Allow shrinking but respect child minHeight
					}}
				>
					{children}
				</div>
			</div>
		</>
	);
};
