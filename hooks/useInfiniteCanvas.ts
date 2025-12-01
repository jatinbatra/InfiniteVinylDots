import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasState, Position } from '../types';
import { CANVAS_OPTS } from '../constants';

export const useInfiniteCanvas = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offset: { x: 0, y: 0 },
    scale: 1,
  });

  const isDragging = useRef(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Prevent default browser zoom
    // Note: In React, we might need to attach this passively to the DOM node directly for true prevention,
    // but here we handle the logic.
    
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(
      Math.max(CANVAS_OPTS.MIN_SCALE, canvasState.scale * (1 + scaleAmount)),
      CANVAS_OPTS.MAX_SCALE
    );

    // Zoom towards mouse pointer logic
    // 1. Get mouse position relative to window (client coordinates)
    // 2. We want the world coordinate under the mouse to remain constant
    
    // For simplicity in this iteration, we zoom to center to avoid complex jitter without a rigid coord system lib
    // A robust implementation requires screenToWorld mapping.
    
    setCanvasState(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [canvasState.scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setCanvasState(prev => ({
      ...prev,
      offset: {
        x: prev.offset.x + dx,
        y: prev.offset.y + dy
      }
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Screen to World conversion helper
  const screenToWorld = useCallback((screenX: number, screenY: number): Position => {
    // Center of screen is (window.innerWidth/2, window.innerHeight/2)
    // This corresponds to world (0,0) + offset
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    return {
      x: (screenX - centerX - canvasState.offset.x) / canvasState.scale,
      y: (screenY - centerY - canvasState.offset.y) / canvasState.scale
    };
  }, [canvasState]);

  return {
    canvasState,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp
    },
    screenToWorld
  };
};