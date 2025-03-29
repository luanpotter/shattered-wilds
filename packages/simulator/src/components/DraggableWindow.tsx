import React, { useRef, useState, useEffect } from 'react';
import { FaMinus, FaTimes } from 'react-icons/fa';

import { useStore } from '../store';
import { Window } from '../types';

interface DraggableWindowProps {
  window: Window;
  children: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  window,
  children,
}) => {
  const updateWindow = useStore((state) => state.updateWindow);
  const removeWindow = useStore((state) => state.removeWindow);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target instanceof Element && e.target.closest('.window-title')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && e.buttons === 1) {
      e.preventDefault();
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      updateWindow({
        ...window,
        position: { x: newX, y: newY },
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMinimize = () => {
    updateWindow({ ...window, isMinimized: !window.isMinimized });
  };

  const handleClose = () => {
    removeWindow(window.id);
  };

  // Add useEffect to handle document-level mouse events
  useEffect(() => {
    if (isDragging) {
      const handleDocumentMouseMove = (e: MouseEvent) => {
        if (e.buttons === 1) {
          e.preventDefault();
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;
          
          updateWindow({
            ...window,
            position: { x: newX, y: newY },
          });
        } else {
          // If left button is released outside, stop dragging
          setIsDragging(false);
        }
      };

      const handleDocumentMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      };
    }
  }, [isDragging, dragOffset, window, updateWindow]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'absolute',
        left: window.position.x,
        top: window.position.y,
        width: '300px',
        backgroundColor: 'var(--background)',
        border: '1px solid var(--text)',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: window.isMinimized ? 'none' : 'block',
        userSelect: 'none',
      }}
    >
      <div
        className="window-title"
        style={{
          padding: '8px',
          backgroundColor: 'var(--background-alt)',
          borderBottom: '1px solid var(--text)',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{window.title}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleMinimize} className="icon-button">
            <FaMinus />
          </button>
          <button onClick={handleClose} className="icon-button">
            <FaTimes />
          </button>
        </div>
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}; 