import React, { useState, useEffect } from 'react';
import { FaMinus, FaTimes } from 'react-icons/fa';

import { useStore } from '../store';
import { Window } from '../types';

interface DraggableWindowProps {
  window: Window;
  children: React.ReactNode;
  onStartDrag: (e: React.MouseEvent) => void;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  window,
  children,
  onStartDrag,
}) => {
  const updateWindow = useStore((state) => state.updateWindow);
  const removeWindow = useStore((state) => state.removeWindow);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      const titleBar = e.target instanceof Element && e.target.closest('.window-title');
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
      updateWindow({
        ...window,
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
        e.preventDefault();
        e.stopPropagation();
        updateWindow({
          ...window,
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
  }, [isDragging, window, updateWindow]);

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
            cursor: 'grabbing'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
      <div
        className="draggable-window"
        onMouseDown={handleMouseDown}
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
          zIndex: 9999
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
    </>
  );
}; 