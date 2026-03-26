import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasState, Position } from '../types';
import { CANVAS_OPTS } from '../constants';

export const useInfiniteCanvas = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offset: { x: 0, y: 0 },
    scale: 1,
  });

  const isDragging = useRef(false);
  const dragDistance = useRef(0); // Track total drag distance to distinguish click vs drag
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  // Touch support refs
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef<Position>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;

    setCanvasState(prev => {
      const newScale = Math.min(
        Math.max(CANVAS_OPTS.MIN_SCALE, prev.scale * (1 + scaleAmount)),
        CANVAS_OPTS.MAX_SCALE
      );

      // Zoom toward mouse cursor
      const mouseX = e.clientX - window.innerWidth / 2;
      const mouseY = e.clientY - window.innerHeight / 2;

      const scaleFactor = newScale / prev.scale;
      const newOffsetX = mouseX - scaleFactor * (mouseX - prev.offset.x);
      const newOffsetY = mouseY - scaleFactor * (mouseY - prev.offset.y);

      return {
        offset: { x: newOffsetX, y: newOffsetY },
        scale: newScale
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragDistance.current = 0;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    dragDistance.current += Math.abs(dx) + Math.abs(dy);

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

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragDistance.current = 0;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      setCanvasState(prev => ({
        ...prev,
        offset: { x: prev.offset.x + dx, y: prev.offset.y + dy }
      }));
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (lastTouchDist.current > 0) {
        const scaleFactor = dist / lastTouchDist.current;

        setCanvasState(prev => {
          const newScale = Math.min(
            Math.max(CANVAS_OPTS.MIN_SCALE, prev.scale * scaleFactor),
            CANVAS_OPTS.MAX_SCALE
          );

          const mx = centerX - window.innerWidth / 2;
          const my = centerY - window.innerHeight / 2;
          const sf = newScale / prev.scale;

          return {
            offset: {
              x: mx - sf * (mx - prev.offset.x) + (centerX - lastTouchCenter.current.x),
              y: my - sf * (my - prev.offset.y) + (centerY - lastTouchCenter.current.y)
            },
            scale: newScale
          };
        });
      }

      lastTouchDist.current = dist;
      lastTouchCenter.current = { x: centerX, y: centerY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastTouchDist.current = 0;
  }, []);

  // Prevent default wheel on the document to avoid page zoom
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    document.addEventListener('wheel', preventWheel, { passive: false });
    return () => document.removeEventListener('wheel', preventWheel);
  }, []);

  // Was this a click (not a drag)?
  const wasClick = useCallback(() => {
    return dragDistance.current < 10;
  }, []);

  return {
    canvasState,
    setCanvasState,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    wasClick,
  };
};
