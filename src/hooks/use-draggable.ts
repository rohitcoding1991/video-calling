import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Default position. If not set, defaults to 16px from top-right of parent. */
  defaultPosition?: Position;
  /** Minimum distance (px) pointer must move to count as a drag (default: 5) */
  dragThreshold?: number;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Called when drag starts */
  onDragStart?: (position: Position) => void;
  /** Called during drag */
  onDragMove?: (position: Position) => void;
  /** Called when drag ends */
  onDragEnd?: (position: Position) => void;
}

interface UseDraggableReturn {
  ref: React.RefCallback<HTMLElement>;
  style: React.CSSProperties;
  isDragging: boolean;
  hasDragged: boolean;
  position: Position;
}

export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const {
    defaultPosition,
    dragThreshold = 5,
    disabled = false,
    onDragStart,
    onDragMove,
    onDragEnd,
  } = options;

  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Refs to avoid stale closures in document-level listeners
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement | null>(null);
  const dragStartPosRef = useRef<Position>({ x: 0, y: 0 });
  const pointerStartRef = useRef<Position>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);

  const getBounds = useCallback(() => {
    const el = elementRef.current;
    if (!el || !el.parentElement) return null;

    const parentRect = el.parentElement.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    return {
      minX: 0,
      minY: 0,
      maxX: parentRect.width - elRect.width,
      maxY: parentRect.height - elRect.height,
    };
  }, []);

  const clampPosition = useCallback(
    (pos: Position): Position => {
      const bounds = getBounds();
      if (!bounds) return pos;

      return {
        x: Math.min(Math.max(pos.x, bounds.minX), bounds.maxX),
        y: Math.min(Math.max(pos.y, bounds.minY), bounds.maxY),
      };
    },
    [getBounds]
  );

  // Ref callback for the element
  const ref = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;

      if (node && !initialized) {
        // Compute default position once element is mounted
        const parent = node.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const elRect = node.getBoundingClientRect();

        const initial = defaultPosition ?? {
          x: parentRect.width - elRect.width - 16,
          y: 16,
        };

        const clamped = {
          x: Math.min(Math.max(initial.x, 0), parentRect.width - elRect.width),
          y: Math.min(Math.max(initial.y, 0), parentRect.height - elRect.height),
        };

        positionRef.current = clamped;
        setPosition(clamped);
        setInitialized(true);
      }
    },
    [defaultPosition, initialized]
  );

  // Handle pointer move (mouse + touch)
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - pointerStartRef.current.x;
      const dy = clientY - pointerStartRef.current.y;

      // Check if we've exceeded the drag threshold
      if (!hasDraggedRef.current) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < dragThreshold) return;
        hasDraggedRef.current = true;
        setHasDragged(true);
        onDragStart?.(positionRef.current);
      }

      const newPos: Position = {
        x: dragStartPosRef.current.x + dx,
        y: dragStartPosRef.current.y + dy,
      };

      const bounds = getBounds();
      if (bounds) {
        newPos.x = Math.min(Math.max(newPos.x, bounds.minX), bounds.maxX);
        newPos.y = Math.min(Math.max(newPos.y, bounds.minY), bounds.maxY);
      }

      positionRef.current = newPos;
      setPosition(newPos);
      onDragMove?.(newPos);
    },
    [dragThreshold, getBounds, onDragStart, onDragMove]
  );

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      onDragEnd?.(positionRef.current);
    }
  }, [onDragEnd]);

  // Mouse handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      handlePointerUp();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      e.preventDefault();
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return;
      handlePointerUp();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };

    const el = elementRef.current;
    if (!el || disabled) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      setIsDragging(true);
      setHasDragged(false);

      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      dragStartPosRef.current = { ...positionRef.current };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      e.preventDefault();

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      setIsDragging(true);
      setHasDragged(false);

      pointerStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      dragStartPosRef.current = { ...positionRef.current };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchEnd);
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('touchstart', onTouchStart, { passive: false });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('touchstart', onTouchStart);
      // Cleanup in case component unmounts while dragging
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, handlePointerMove, handlePointerUp]);

  // Re-clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      const clamped = clampPosition(positionRef.current);
      positionRef.current = clamped;
      setPosition(clamped);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    willChange: isDragging ? 'transform' : 'auto',
  };

  return { ref, style, isDragging, hasDragged, position };
}
